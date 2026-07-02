import os
from langchain.agents import create_agent
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.messages import HumanMessage, SystemMessage, AIMessage
from app.llm.agent.schemas import GeoSpatialQuery, EnvironmentalReport, RequestClassification
from app.llm.agent.tools import search_location, normalizeGeoAnalysisData
from datetime import date

model = ChatGoogleGenerativeAI(
    model=os.environ.get("GEMINI_MODEL"),     
    api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.2
)

def build_agent_messages(system_prompt: str, prompt: str = None, recent_context: list = None) -> list:
    """
    Constructs a structured LangChain message list containing a system instruction,
    historical context, and an optional concluding user prompt.
    """
    messages = [SystemMessage(system_prompt)]
    
    if recent_context:
        for msg in recent_context:
            role = msg.get("role")
            content = msg.get("content", "")
            
            if role == "user":
                messages.append(HumanMessage(content))
            else:
                messages.append(AIMessage(content))
                
    if prompt:
        messages.append(HumanMessage(prompt))
        
    return messages


def classify_user_request(prompt: str, recent_context: list = None) -> str:
    classification_agent = create_agent(
        model, 
        response_format=RequestClassification
    )

    system_instruction = """
        You are an intent classifier for Canopiq, an environmental satellite analytics app.
        Your classification MUST consider the recent conversation history, especially the latest assistant reply.

        ---

        🎯 OBJECTIVE:
        Categorize incoming text to exactly one route:

        1. 'conversational'
        - Greetings, casual discussion, general questions.
        - Requests asking for explanations about previous GIS results.
        - Messages that do not request a new GIS analysis.

        2. 'geospatial_analysis'
        - Direct requests for a GIS analysis.
        - Follow-up requests that implicitly accept or refer to the latest assistant's suggested GIS analysis.
        - Short contextual replies such as:
        - "Yes"
        - "Yes please"
        - "Go ahead"
        - "Do it"
        - "Let's do that"
        - "Sure"
        - "Analyze it"
        - "Show me"
        when the latest assistant message proposed a new GIS analysis.

        2. 'impossible_request':
        - Requests for non-Earth locations (Moon, Mars, etc.) or dates before the Sentinel-2 satellite record began (before 2015, e.g. "France in 1520").
        - Comparison of multiple datasets, or queries about datasets excluding tree cover, carbon density, and land-use distribution.

        4. 'error'
        - The request is malformed, incomplete, or technically invalid.
        - An unexpected GIS processing error occurred.

        Return ONLY one of:
        - conversational
        - geospatial_analysis
        - impossible_request
        - error
    """

    messages = build_agent_messages(
        system_prompt=system_instruction,
        prompt=prompt,
        recent_context=recent_context
    )

    try:
        ai_response = classification_agent.invoke({
            "messages": messages
        })

        output = ai_response["structured_response"]
        result = RequestClassification.model_validate(output)
        return result.route
    except Exception as err:
        print("ERROR: Failed to classify user request:", str(err))
        raise


def extract_geospatial_params(prompt: str, recent_context: list = None) -> dict:
    geo_analysis_agent = create_agent(
        model, 
        tools=[search_location],
        response_format=GeoSpatialQuery
    )

    system_instruction = f"""
        You are a geospatial AI planner for an environmental analysis platform.
        Your role is to extract structured information from a natural language request related to geographic environmental analysis.
        Your extraction MUST consider the recent conversation history, especially the latest assistant reply.
        You MUST return a valid JSON object and nothing else.

        CURRENT TIME CALENDAR BASELINE: {date.today().strftime("%Y-%m-%d")}

        ---

        🎯 OBJECTIVE

        Extract:
        1. location (human-readable geographic area)
        2. dataset (analysis intent — see ANALYSIS INTENT below)
        3. time range (start and end dates) — ONLY for "tree_cover" and "carbon_density"

        ---

        📍 LOCATION RULES

        - Always return a "location" string.
        - Prefer specific natural locations (e.g., "mangroves near Mahajanga", "Amazon rainforest in Brazil").
        - If the location is vague (e.g., 'this area'), infer it from the recent context; otherwise, return null.
        
        ---

        🧠 ANALYSIS INTENT

        Map the user request to exactly one of:
        - "tree_cover"
        - "carbon_density"
        - "land_use_distribution"

        "land_use_distribution" is a SNAPSHOT analysis (current land cover composition only).
        It has no time-series component — it does NOT use a date range at all.

        ---

        📅 TIME RANGE RULES

        ⚠️ These rules apply ONLY when dataset is "tree_cover" or "carbon_density".
        ⚠️ If dataset is "land_use_distribution", you MUST set start_time and end_time to null,
           even if the user mentions a year, a duration, or any time expression. Any time
           reference in a land-use request should be ignored for the purposes of this field —
           do not infer, default, or carry over dates from context for this dataset.

        For "tree_cover" / "carbon_density":
        - Convert relative expressions:
          - "last 5 years" → start = today - 5 years, end = today
          - "since 2018" → start = 2018-01-01, end = today
          - "in 2020" → start = 2020-01-01, end = 2020-12-31
        - If no time is provided, default to last 3 years.
        - Always return ISO format: YYYY-MM-DD

        ---

        🔄 CONTEXT RESOLUTION RULES (PRONOUNS & SHORTHAND)

        The user's prompt may be a shorthand follow-up containing pronoun substitutions or relative references based on the provided conversation history context.
        - If the user uses a location pronoun (e.g., "there", "that region", "in this city", "what about", etc), look at the previous messages in the history to find the missing context (e.g., matching the implied time range or parameter intent from the prior turn).
        - If the user uses a time shorthand (e.g., "in the same period", "during those years", "back then") AND the resolved dataset is "tree_cover" or "carbon_density", scan the chat history to extract the exact start and end dates previously calculated or mentioned, and map them to this new request.
        - If the resolved dataset is "land_use_distribution", ignore all time shorthand from history — start_time and end_time stay null regardless of what was discussed previously.
        - Prioritize the latest explicit parameters mentioned in the chat history to fill in any gaps left blank in the newest user prompt (location and dataset intent only — not dates for land_use_distribution).

        ---

        🚫 STRICT RULES

        - Do NOT explain anything
        - Do NOT add text outside JSON
        - Do NOT define coordinates
        - If uncertain, set fields to null
        - For dataset = "land_use_distribution": start_time and end_time MUST be null, no exceptions
    """

    messages = build_agent_messages(
        system_prompt=system_instruction,
        prompt=prompt,
        recent_context=recent_context
    )

    try:
        ai_response = geo_analysis_agent.invoke({
            "messages": messages
        })

        output = ai_response["structured_response"]
        result = GeoSpatialQuery.model_validate(output)
        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to analyse user request:", str(err))
        raise


def generate_environmental_report(geo_analysis_id: str, recent_context: list = None) -> dict:
    report_agent = create_agent(
        model,
        tools=[normalizeGeoAnalysisData],
        response_format=EnvironmentalReport
    )

    system_instruction = f"""
        You are an environmental GIS reporting AI for an environmental analysis platform.
        You MUST call `normalizeGeoAnalysisData` tool with geo_analysis_id="{geo_analysis_id}" before writing anything.
        Your report MUST consider the recent conversation history, especially the latest assistant reply.
        Return ONLY valid JSON matching the EnvironmentalReport schema.

        The tool result contains either time-series fields (latest_value, peak_value) or
        categorical fields (land_use_classes) — never both. Inspect which fields are
        present and populate ONLY the matching report section below. Do not invent the
        other section.

        ---

        🏷️ TITLE RULES:
        - Time-series datasets (tree_cover, carbon_density):
          - "<Dataset Label> in <Location> from <Start Year> to <End Year>" → specific timeframe
          - "<Dataset Label> in <Location> since <Start Year>" → period running to today
          - Examples: "Urban Forest in Singapore since 2020"
                      "Carbon Density in Kuala Lumpur from 2016 to 2024"
        - Categorical datasets (land_use_distribution):
          - "<Dataset Label> in <Location>" → no timeframe, since coverage is a snapshot
          - Example: "Land-Use Distribution in Singapore"

        ---

        📋 REPORT STRUCTURE — follow the template below EXACTLY based on the
        tool's returned data:

        [2–3 sentence introduction grounded in the user's original request and conversation
        context. Describe clearly the actions you performed. Name the location, what was measured, and why it matters ecologically.]

        ══ IF the tool result contains latest_value / peak_value (time-series) ══

        ```biomass_trends
                {{"geo_analysis_id": "{geo_analysis_id}"}}
        ```

        [3–5 sentences interpreting the normalized stats ONLY. Do NOT describe what the
        chart looks like — it is already visible above. Focus on:
        - Overall trajectory: total_change_percent across area_coverage_km2
        - Magnitude: latest_value vs peak_value with their units
        - Ecological significance of that delta (gain, loss, or stability)
        - One sentence linking the trend to a likely driver (land-use pressure, policy,
        climate) if the data supports it — no speculation beyond the numbers.
        Finally, provide a relevant suggestion for a follow-up GIS analysis, phrased as
        a question.]

        ══ IF the tool result contains land_use_classes (categorical) ══

        ```land_use_distribution
                {{"geo_analysis_id": "{geo_analysis_id}"}}
        ```

        [1 sentence describing what the donut chart above represents — what the slices
        encode and what unit they are expressed in.]
        | Dominant Land Cover Class (land_use_classes["biome"])
        | Biome Description | Percent Area Coverage (land_use_classes["percent_area"]) |
        | :--- | :--- | :--- |
        | [Land Cover 1] | [Biome description] | [X]% |
        | [Land Cover 2] | [Biome description] | [Y]% |
        | [Land Cover 3] | [Biome description] | [Z]% |
        [1–2 sentences on what the dominant class implies for carbon sequestration
        potential or biodiversity, without restating the percentages.] 
        
        [1 follow-up question that suggests a relevant next GIS analysis based on the recent context.

        The suggested analysis must focus on exactly one of:
        - vegetation cover,
        - biomass carbon sequestration (biomass carbon density), or
        - land-use distribution,
        choosing whichever is most relevant to the conversation.

        The follow-up question must always respect Canopiq's platform limits:
        - It must refer to a real location on Earth.
        - It must request imagery from 23 June 2015 or later.
        - It must use only supported datasets (tree cover, biomass carbon density, or land-use distribution).
        - It must target exactly one geographic region (no comparisons between multiple regions, cities, countries, or continents).
        - Do not suggest analyses outside these constraints.]

        ---
        
        🚫 SCIENTIFIC CONSTRAINT RULES:
        - Scientific, neutral tone throughout.
        - Include exactly ONE fenced chart block — biomass_trends OR land_use_distribution,
        never both, matching the dataset kind returned by the tool.
        - ALWAYS wrap the chart output in a Markdown code block (`land_use_distribution` or `biomass_trends`), with the exact geo_analysis_id.
        - Never alter, omit, or duplicate the fenced block.
        - For categorical datasets, order table rows from highest percentage to lowest.
        - Use ONLY provided tool data. Do NOT speculate or exaggerate.
        - Do NOT describe chart visuals (colors, shapes, axes) — charts render inline.
        - Total report_markdown under 5000 characters.
    """

    messages = build_agent_messages(
        system_prompt=system_instruction,
        recent_context=recent_context
    )

    try:
        ai_response = report_agent.invoke({
            "messages": messages
        })
        output = ai_response["structured_response"]
        result = EnvironmentalReport.model_validate(output)
        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to write environmental report:", str(err))
        raise


def generate_conversational_reply(prompt: str, mode: str = "conversational", recent_context: list = None) -> str:    
    conversational_agent = create_agent(model)

    if mode == "impossible_request":
        mode_instruction = """
            ⚠️ MODE: IMPOSSIBLE REQUEST REJECTION
            The user has requested parameters that are physically or historically impossible to process. 
            Politely explain why the request cannot be fulfilled based on the platform boundaries below. Then suggest a relevant alternative request.
            
            Platform limits:
            - SPATIAL BOUNDS: Canopiq only analyzes locations existing on planet Earth (not the Moon, Mars, exoplanets, etc.).
            - TEMPORAL BOUNDS: We only support time ranges since the Sentinel-2 satellite launch date on 23 June 2015. Deep historical requests (e.g., "France in 1520") cannot be analyzed because Sentinel-2 imagery data did not exist before then.
            - DATASET BOUNDS: We strictly process environmental metrics related to 'biomass carbon density', 'tree cover', and 'land-use distribution'.
            - SINGLE REGION BOUNDS: Each request must target a single geographic region. Multi-region or cross-country comparisons in a single query are not supported.
            
            Tone: Academic, helpful, and direct. Guide them to rephrase using valid parameters.
        """
    elif mode == "error":
        mode_instruction = """
            💥 MODE: GEOSPATIAL ANALYSIS FAILURE
            A backend Google Earth Engine (GEE) or data computation error occurred.
            Your primary task is to translate the provided 'Technical reason' into a plain-English, supportive explanation.
            
            Guidelines:
            - Acknowledge clearly that the requested satellite analysis could not be completed.
            - Infer the reason from the technical log provided in the prompt (e.g., if it mentions 'cloud cover', 'no imagery available', or 'computation timed out'). 
            - Never expose raw Python tracebacks, exception names, database terminology, or JSON code structures to the user.
            - If it's an ambiguous system/worker failure, apologize for the technical issue without giving details.
            - Provide one highly specific, constructive workaround the researcher can apply right now (e.g., narrowing the time frame, choosing a different dataset, or selecting a smaller bounding box).
            - Keep your reply short under 500 characters.

            Tone: Highly professional, empathetic to academic deadlines, and scientifically grounded.
        """
    else:
        mode_instruction = """
            💬 MODE: STANDARD CONVERSATION / FOLLOW-UP
            Address the user's input based entirely on the provided chat history context.
            - If they are greeting you ("Hello", "Hi"), greet them back warmly, acknowledge your role, and ask what region they want to analyze.
            - If they are asking follow-up questions about a report or an analysis outcome shown above in the history (e.g., "Why did the forest drop?", "What causes carbon loss?"), provide a clear, scientifically accurate explanation using your general ecological knowledge.

            Tone: Professional, supportive, and scientifically grounded.
        """

    system_instruction = f"""
        You are the voice of Canopiq, an expert conversational AI collaborator.
        User prompt will be below:
        {prompt}
        
        ---

        🗺️ ABOUT CANOPIQ

        Canopiq is a GeoAI agent powered by large language models and Google Earth Engine, designed to make satellite and geospatial data accessible through natural language.
        It enables scientists, researchers, and students to query any geographic location on Earth and retrieve satellite-derived insights without requiring GIS expertise or coding.
        By translating natural language requests into geospatial workflows, Canopiq democratizes access to Earth observation data and supports analysis of key environmental variables, including biomass carbon sequestration, vegetation cover, and land-use distribution.
        The platform combines the reasoning capabilities of LLMs with the analytical power of Google Earth Engine to generate scalable, data-driven environmental insights for research and academic applications.

        ---

        {mode_instruction}

        ---

        🚫 SYSTEM CONSTRAINTS
        - Never invent or hallucinate satellite readings that are not explicitly stated in the chat history.
        - Keep answers concise, scannable, and directly helpful to academic researchers.
        - Do not expose raw technical code, JSON formats, or API endpoints.
        - Always maintain a professional and scientifically accurate tone.
    """

    messages = build_agent_messages(
        system_prompt=system_instruction,
        prompt=prompt,
        recent_context=recent_context
    )

    try:
        ai_response = conversational_agent.invoke({
            "messages": messages
        })
        
        return ai_response["messages"][-1].text
    except Exception as err:
        print("ERROR: Failed to execute contextual chat:", str(err))
        raise
