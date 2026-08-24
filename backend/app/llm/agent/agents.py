import os
from datetime import date

from google import genai
from google.genai import types

from app.llm.agent.schemas import GeoSpatialQuery, EnvironmentalReport, RequestClassification
from app.llm.agent.tools import search_location, normalizeGeoAnalysisData

MODEL = os.environ.get("GEMINI_MODEL")
TEMPERATURE = 0.2

client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))


def _build_contents(prompt: str = None, recent_context: list = None) -> list[types.Content]:
    """
    Constructs a list of google-genai Content turns from historical context and
    an optional concluding user prompt.
    """

    contents: list[types.Content] = []

    if recent_context:
        for msg in recent_context:
            role = "user" if msg.get("role") == "user" else "model"
            content = msg.get("content", "")

            contents.append(types.Content(
                role=role, 
                parts=[types.Part.from_text(text=content)]
            ))

    if prompt:
        contents.append(types.Content(
            role="user", 
            parts=[types.Part.from_text(text=prompt)]
        ))

    return contents


def _run_tool_and_structured_turn(
    contents: list[types.Content],
    system_instruction: str,
    tools: list,
    response_schema,
    structured_prompt_suffix: str = ""
):
    """
    Runs automatic function calling, then requests a 
    structured JSON response based on the updated conversation state.
    """
    
    history = list(contents)
    last_prompt = "Execute the requested analysis tool and process the query."

    if history and history[-1].role == "user":
        last_turn = history.pop()
        if last_turn.parts and last_turn.parts[0].text:
            last_prompt = last_turn.parts[0].text

    # 1. Initialize chat session with history and function tools 
    chat = client.chats.create(
        model=MODEL,
        history=history,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            tools=tools,
            temperature=TEMPERATURE,
        )
    )

    # 2. Trigger Automatic Function Calling (AFC)
    chat.send_message(last_prompt)

    # 3. Final structured output pass over the completed conversation context 
    structured_instruction = system_instruction
    if structured_prompt_suffix:
        structured_instruction += f"\n\n{structured_prompt_suffix}"

    structured_output_prompt = types.Content(
        role="user",
        parts=[types.Part.from_text(
            text="Extract and output ONLY the final structured JSON object matching the schema."
        )]
    )

    response = client.models.generate_content(
        model=MODEL,
        contents=chat.get_history() + [structured_output_prompt],
        config=types.GenerateContentConfig(
            system_instruction=structured_instruction,
            response_mime_type="application/json",
            response_schema=response_schema,
            temperature=TEMPERATURE,
        )
    )

    return response.parsed


def classify_user_request(prompt: str, recent_context: list = None) -> str:
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

        3. 'impossible_request':
        - Any request completely unrelated to environmental monitoring (e.g., general web searches, coding help, recipes).
        - Requests for non-Earth locations (Moon, Mars, etc.) or dates before the Sentinel-2 satellite record began (before 2015, e.g., "France in 1520").
        - Requests specifying highly custom coordinates, micro-locations, or specific radial boundaries (e.g., "within a 5km radius of the [Specific Power Plant Name]"). Canopiq does not support custom bounding boxes yet.
        - Requests targeting massive geographic regions exceeding the regional analysis threshold of 10,000 km² (e.g., trying to analyze an entire continent or massive country at once).
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

    contents = _build_contents(prompt=prompt, recent_context=recent_context)

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                response_mime_type="application/json",
                response_schema=RequestClassification,
                temperature=TEMPERATURE,
            )
        )
        
        parsed = RequestClassification.model_validate(response.parsed)
        return parsed.route
    except Exception as err:
        print("ERROR: Failed to classify user request:", str(err))
        raise


def extract_geospatial_params(prompt: str, recent_context: list = None) -> dict:
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

        Use the `search_location` tool to resolve the location's coordinates and bounding box before finalizing your answer.

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
        - If the user uses a location pronoun (e.g., "there", "that region", "in this city", "what about", etc), look at the previous messages in the history to find the missing context.
        - If the user uses a time shorthand (e.g., "in the same period", "during those years", "back then") AND the resolved dataset is "tree_cover" or "carbon_density", scan the chat history to extract the exact start and end dates previously calculated or mentioned.
        - If the resolved dataset is "land_use_distribution", ignore all time shorthand from history — start_time and end_time stay null regardless.
        - Prioritize the latest explicit parameters mentioned in the chat history to fill in any gaps left blank in the newest user prompt.

        ---

        🚫 STRICT RULES

        - Do NOT explain anything
        - Do NOT add text outside JSON
        - Do NOT define coordinates yourself — use the `search_location` tool result
        - If uncertain, set fields to null
        - For dataset = "land_use_distribution": start_time and end_time MUST be null, no exceptions
    """

    contents = _build_contents(prompt=prompt, recent_context=recent_context)

    try:
        result = _run_tool_and_structured_turn(
            contents=contents,
            system_instruction=system_instruction,
            tools=[search_location],
            response_schema=GeoSpatialQuery,
            structured_prompt_suffix="""
                The `search_location` tool has already been called above. 
                Using its result plus everything else in the conversation, 
                output ONLY the final JSON object now.
            """
        )

        parsed = GeoSpatialQuery.model_validate(result)
        return parsed.model_dump()
    except Exception as err:
        print("ERROR: Failed to analyse user request:", str(err))
        raise


def generate_environmental_report(geo_analysis_id: str, recent_context: list = None) -> dict:
    system_instruction = f"""
        You are an environmental GIS reporting AI for an environmental analysis platform.
        You MUST call `normalizeGeoAnalysisData` with geo_analysis_id="{geo_analysis_id}" before writing anything.
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

        [1 follow-up question that suggests a relevant next GIS analysis based on the recent context.]

        ---

        💡 FOLLOW-UP QUESTION CONSTRAINTS:

        When suggesting a follow-up GIS analysis question, you MUST strictly ensure it stays within Canopiq's capabilities. NEVER suggest any query that violates these limits:
        - Must be strictly related to environmental monitoring (no general queries, web searches, or coding).
        - Must target an existing location on Earth.
        - Must stay within the Sentinel-2 timeframe (2015 to present — never propose dates before 2015).
        - Must focus ONLY on our supported datasets: 'tree cover', 'carbon density', or 'land-use distribution'.
        - Must ask about a SINGLE dataset at a time (NEVER suggest comparing multiple datasets simultaneously).
        - Must NOT specify custom bounding boxes, micro-locations, or explicit radial distances (e.g., "within a 5km radius").
        - Must NOT target massive geographic areas exceeding 10,000 km² (e.g., entire continents or large countries at once).

        ---

        🚫 STRICT RULES:

        - Scientific, neutral tone throughout.
        - Include EXACTLY ONE fenced chart block — biomass_trends OR land_use_distribution, never both.
        - Always WRAP the embedded chart in a Markdown code block using the exact geo_analysis_id.
        - Never alter, omit, or duplicate the fenced block.
        - For categorical datasets, order table rows from highest percentage to lowest.
        - Use ONLY provided tool data. Do NOT speculate or exaggerate.
        - Do NOT describe chart visuals — charts render inline.
        - Total report_markdown under 5000 characters.
    """

    contents = _build_contents(prompt=f"Generate report for geo_analysis_id: {geo_analysis_id}", recent_context=recent_context)

    try:
        result = _run_tool_and_structured_turn(
            contents=contents,
            system_instruction=system_instruction,
            tools=[normalizeGeoAnalysisData],
            response_schema=EnvironmentalReport,
            structured_prompt_suffix="""
                `normalizeGeoAnalysisData` has already been called above. 
                Using its result, write the final report and output ONLY the JSON object now.
            """
        )

        parsed = EnvironmentalReport.model_validate(result)
        return parsed.model_dump()
    except Exception as err:
        print("ERROR: Failed to write environmental report:", str(err))
        raise


def generate_conversational_reply(prompt: str, mode: str = "conversational", recent_context: list = None) -> str:
    if mode == "impossible_request":
        mode_instruction = """
            ⚠️ MODE: IMPOSSIBLE REQUEST REJECTION
            The user has requested parameters that are physically or historically impossible to process.
            Politely explain why the request cannot be fulfilled based on the platform boundaries below. Then suggest a relevant alternative request.

            Platform limits:
            - SPATIAL BOUNDS: Canopiq only analyzes locations existing on planet Earth.
            - TEMPORAL BOUNDS: We only support time ranges since the Sentinel-2 satellite launch date on 23 June 2015.
            - DATASET BOUNDS: We strictly process environmental metrics related to 'biomass carbon density', 'tree cover', and 'land-use distribution'.
            - SINGLE REGION BOUNDS: Each request must target a single geographic region.

            Tone: Academic, helpful, and direct.
        """
    elif mode == "error":
        mode_instruction = """
            💥 MODE: GEOSPATIAL ANALYSIS FAILURE
            A backend Google Earth Engine (GEE) or data computation error occurred.
            Translate the provided 'Technical reason' into a plain-English, supportive explanation.

            Guidelines:
            - Acknowledge clearly that the requested satellite analysis could not be completed.
            - Infer the reason from the technical log.
            - Never expose raw Python tracebacks, exception names, database terminology, or JSON code structures.
            - Keep your reply short under 500 characters.

            Tone: Highly professional, empathetic, and scientifically grounded.
        """
    else:
        mode_instruction = """
            💬 MODE: STANDARD CONVERSATION / FOLLOW-UP
            Address the user's input based entirely on the provided chat history context.
            - If greeting, greet them back warmly, acknowledge your role, and ask what region they want to analyze.
            - If asking follow-up questions about a report, provide a clear, scientifically accurate explanation.

            Tone: Professional, supportive, and scientifically grounded.
        """

    system_instruction = f"""
        You are the voice of Canopiq, an expert conversational AI collaborator.
        User prompt will be below:
        {prompt}

        ---

        🗺️ ABOUT CANOPIQ

        Canopiq is a GeoAI agent powered by large language models and Google Earth Engine, designed to make satellite and geospatial data accessible through natural language.

        ---

        {mode_instruction}

        ---

        🚫 SYSTEM CONSTRAINTS
        - Never invent or hallucinate satellite readings.
        - Keep answers concise, scannable, and directly helpful to academic researchers.
        - Do not expose raw technical code, JSON formats, or API endpoints.
        - Always maintain a professional and scientifically accurate tone.
    """

    contents = _build_contents(prompt=prompt, recent_context=recent_context)

    try:
        response = client.models.generate_content(
            model=MODEL,
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=TEMPERATURE,
            ),
        )
        
        return response.text
    except Exception as err:
        print("ERROR: Failed to execute contextual chat:", str(err))
        raise
