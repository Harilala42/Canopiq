import os
import app.chat.models as chat
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.messages import HumanMessage, SystemMessage, AIMessage
from app.llm.schemas import GeoSpatialQuery, EnvironmentalReport, RequestClassification
from app.llm.tools import search_location, normalizeGeoAnalysisData
from datetime import date

model = ChatGoogleGenerativeAI(
    model=os.environ.get("GEMINI_MODEL"),     
    api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.2
)

def classify_user_request(user_prompt: str, recent_context: list = None) -> str:
    classification_agent = create_agent(
        model, 
        response_format=RequestClassification
    )

    prompt = """
        You are an intent classifier for Canopiq, an environmental satellite analytics app.
        
        ---

        🎯 OBJECTIVE:
        Categorize incoming text to exactly one route:
        1. 'conversational': Greetings, casual questions, or follow-up explanations about a previous map output.
        2. 'impossible_request': Requests for non-Earth locations (Moon, Mars) or years before Sentinel-2 satellite launch (anything before 2015 like 'France in 1520').
        3. 'geospatial_analysis': Direct commands to analyze or map environmental factors (tree cover, carbon density) on real Earth spots.
    """

    messages = [SystemMessage(prompt)]
    
    if recent_context:
        for msg in recent_context:
            if msg.get("role") == "user":
                messages.append(HumanMessage(msg.get("content", "")))
            else:
                messages.append(AIMessage(msg.get("content", "")))
                
    messages.append(HumanMessage(user_prompt))

    try:
        ai_response = classification_agent.invoke({
            "messages": messages
        })

        output = ai_response["structured_response"]
        result = RequestClassification.model_validate(output)
        return result.route
    except Exception as err:
        print("ERROR: Failed to classify user request:", str(err))
        raise Exception(err)

def extract_geospatial_params(user_prompt: str, recent_context: list = None) -> dict:
    geo_analysis_agent = create_agent(
        model, 
        tools=[search_location],
        response_format=GeoSpatialQuery
    )

    prompt = f"""
        You are a geospatial AI planner for an environmental analysis platform.
        Your role is to extract structured information from a natural language request related to geographic environmental analysis.
        You MUST return a valid JSON object and nothing else.

        CURRENT TIME CALENDAR BASELINE: {date.today().strftime("%Y-%m-%d")}

        ---

        🎯 OBJECTIVE

        Extract:
        1. location (human-readable geographic area)
        3. time range (start and end dates)
        4. analysis intent (short label)

        ---

        📍 LOCATION RULES

        - Always return a "location" string.
        - Prefer specific natural locations (e.g., "mangroves near Mahajanga", "Amazon rainforest in Brazil").
        - If vague (e.g., "this area"), return null.

        ---

        📅 TIME RANGE RULES

        - Convert relative expressions:
        - "last 5 years" → start = today - 5 years, end = today
        - "since 2018" → start = 2018-01-01, end = today
        - "in 2020" → start = 2020-01-01, end = 2020-12-31

        - If no time is provided:
        - default to last 3 years

        - Always return ISO format:
        YYYY-MM-DD

        ---

        🧠 ANALYSIS INTENT

        Map user request to one of:
        - "carbon_density"
        - "tree_cover"

        ---

        🔄 CONTEXT RESOLUTION RULES (PRONOUNS & SHORTHAND)

        The user's prompt may be a shorthand follow-up containing pronoun substitutions or relative references based on the provided conversation history context.
        - If the user uses a location pronoun (e.g., "there", "that region", "in this city", "what about", etc), look at the previous messages in the history to find the missing context (e.g., matching the implied time range or parameter intent from the prior turn).
        - If the user uses a time shorthand (e.g., "in the same period", "during those years", "back then"), scan the chat history to extract the exact start and end dates previously calculated or mentioned, and map them to this new request.
        - Prioritize the latest explicit parameters mentioned in the chat history to fill in any gaps left blank in the newest user prompt.

        ---

        🚫 STRICT RULES

        - Do NOT explain anything
        - Do NOT add text outside JSON
        - Do NOT define coordinates
        - If uncertain, set fields to null
    """

    messages = [SystemMessage(prompt)]
    
    if recent_context:
        for msg in recent_context:
            if msg.get("role") == "user":
                messages.append(HumanMessage(msg.get("content", "")))
            else:
                messages.append(AIMessage(msg.get("content", "")))
                
    messages.append(HumanMessage(user_prompt))

    try:
        ai_response = geo_analysis_agent.invoke({
            "messages": messages
        })

        output = ai_response["structured_response"]
        result = GeoSpatialQuery.model_validate(output)
        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to analyse user request:", str(err))
        raise Exception(err)

def generate_environmental_report(geo_analysis_id: str, recent_context: list = None) -> dict:
    report_agent = create_agent(
        model, 
        tools=[normalizeGeoAnalysisData],
        response_format=EnvironmentalReport
    )

    prompt = f"""
        You are an environmental GIS reporting AI for Canopiq.
        You MUST call `normalizeGeoAnalysisData` tool with geo_analysis_id="{geo_analysis_id}" before writing anything.
        Return ONLY valid JSON matching the EnvironmentalReport schema.

        ---

        🏷️ TITLE RULES:
        - "<Dataset Label> in <Location> from <Start Year> to <End Year>"  → specific timeframe
        - "<Dataset Label> in <Location> since <Start Year>"               → period running to today
        - Examples: "Urban Forest in Singapore since 2020"
                    "Carbon Density in Kuala Lumpur from 2016 to 2024"

        ---

        📋 REPORT STRUCTURE — follow this template exactly, in this order:

        [2–3 sentence introduction grounded in the user's original request and conversation 
        context. Start with a friendly, true-assistant greeting, such as "Yes, I can certainly 
        help you with that...". Name the location, what was measured, and why it matters ecologically.]

        ```biomass_trends
            {{"geo_analysis_id": "{geo_analysis_id}"}}
        ```

        [3–5 sentences interpreting the normalized stats ONLY. Do NOT describe what the
        chart looks like — it is already visible above. Focus on:
        - Overall trajectory: total_change_percent across area_coverage_km2
        - Magnitude: latest_value vs peak_value with their units
        - Ecological significance of that delta (gain, loss, or stability)
        - One sentence linking the trend to a likely driver (land-use pressure, policy,
        climate) if the data supports it — no speculation beyond the numbers.]

        ```land_use_distribution
            {{"geo_analysis_id": "{geo_analysis_id}"}}
        ```

        [1 sentence describing what the donut chart above represents — what the slices
        encode and what unit they are expressed in.]

        | Dominant Land Cover Class (dominant_land_use["category"]) 
        | Biome Description | Percent Area Coverage (dominant_land_use["percent"]) |
        | :--- | :--- | :--- |
        | [Land Cover 1] | [Biome description] | [X]% |
        | [Land Cover 2] | [Biome description] | [Y]% |
        | [Land Cover 3] | [Biome description] | [Z]% |

        [1–2 sentences on what the dominant class implies for carbon sequestration
        potential or biodiversity, without restating the percentages. Finally, provide a 
        relevant suggestion for a follow-up GIS analysis in the report, phrased as a question.]

        ---

        🚫 SCIENTIFIC CONSTRAINT RULES:
        - Scientific, neutral tone throughout.
        - Order the rows in the Land-Use Distribution table from highest percentage to lowest.
        - Use ONLY provided tool data. Do NOT speculate or exaggerate.
        - Do NOT describe chart visuals (colors, shapes, axes) — charts render inline.
        - The two fenced blocks (biomass_trends, land_use_distribution) must appear
        verbatim with the exact geo_analysis_id. Never alter or omit them.
        - Total report_markdown under 5000 characters.
    """

    messages = [SystemMessage(prompt)]
    
    if recent_context:
        for msg in recent_context:
            if msg.get("role") == "user":
                messages.append(HumanMessage(msg.get("content", "")))
            else:
                messages.append(AIMessage(msg.get("content", "")))

    try:
        ai_response = report_agent.invoke({
            "messages": messages
        })

        output = ai_response["structured_response"]
        result = EnvironmentalReport.model_validate(output)
        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to write environmental report:", str(err))
        raise Exception(err)

def generate_conversational_reply(
    chat_id: str, 
    user_id: str, 
    user_prompt: str,
    is_impossible: bool = False
) -> str:    
    conversational_agent = create_agent(model)

    if is_impossible:
        mode_instruction = """
            ⚠️ MODE: IMPOSSIBLE REQUEST REJECTION
            The user has requested parameters that are physically or historically impossible to process. 
            Politely explain the platform boundaries using these exact criteria:
            
            - SPATIAL BOUNDS: Canopiq only analyzes locations existing on planet Earth (not the Moon, Mars, exoplanets, etc.).
            - TEMPORAL BOUNDS: We only support time ranges since the Sentinel-2 satellite launch date on 23 June 2015. Deep historical requests (e.g., "France in 1520") cannot be analyzed because Sentinel-2 imagery data did not exist before then.
            - DATASET BOUNDS: We strictly process environmental metrics related to 'carbon_density' and 'tree_cover'.
            
            Tone: Academic, helpful, and direct. Guide them to rephrase using valid parameters.
        """
    else:
        mode_instruction = """
            💬 MODE: STANDARD CONVERSATION / FOLLOW-UP
            Address the user's input based entirely on the provided chat history context.
            - If they are greeting you ("Hello", "Hi"), greet them back warmly, acknowledge your role, and ask what region they want to analyze.
            - If they are asking follow-up questions about a report or an analysis outcome shown above in the history (e.g., "Why did the forest drop?", "What causes carbon loss?"), provide a clear, scientifically accurate explanation using your general ecological knowledge.
            
            Tone: Professional, supportive, and scientifically grounded.
        """

    prompt = f"""
        You are the voice of Canopiq, an expert conversational AI collaborator.
        User prompt will be below:
        {user_prompt}
        
        ---

        🗺️ ABOUT CANOPIQ
        Canopiq bridges the gap between complex geospatial data and academic insights. 
        Built specifically for researchers and academic students, this platform allows users to query specific geographic locations using natural language. 
        It orchestrates Gemini AI with the Google Earth Engine (GEE) API to process natural environmental queries and deliver comprehensive biomass and carbon sequestration reports.

        ---

        {mode_instruction}

        ---

        🚫 SYSTEM CONSTRAINTS
        - Never invent or hallucinate satellite readings that are not explicitly stated in the chat history.
        - Keep answers concise, scannable, and directly helpful to academic researchers.
        - Do not expose raw technical code, JSON formats, or API endpoints.
        - Always maintain a professional and scientifically accurate tone.
    """

    try:
        chat_history = chat.get_chat_message(chat_id, user_id)

        messages = [SystemMessage(prompt)]
        for msg in chat_history or []:
            if msg["role"] == "user":
                messages.append(HumanMessage(msg["content"]))
            else:
                messages.append(AIMessage(msg["content"]))

        messages.append(HumanMessage(user_prompt))

        ai_response = conversational_agent.invoke({
            "messages": messages
        })
        
        return ai_response["messages"][-1].text
    except Exception as err:
        print("ERROR: Failed to execute contextual chat:", str(err))
        raise Exception(err)
