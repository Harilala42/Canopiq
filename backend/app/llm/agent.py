import os
from langchain.agents import create_agent
from langchain.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.llm.schemas import GeoSpatialQuery, EnvironmentalReport
from app.llm.tools import search_location, normalizeGeoAnalysisData

model = ChatGoogleGenerativeAI(
    model=os.environ.get("GEMINI_MODEL"),     
    api_key=os.environ.get("GEMINI_API_KEY"),
    temperature=0.2
)

analysis_agent = create_agent(
    model, 
    tools=[search_location],
    response_format=GeoSpatialQuery
)

def analyse_user_request(user_prompt: str):
    prompt = """
        You are a geospatial AI planner for an environmental analysis platform.
        Your role is to extract structured information from a natural language request related to geographic environmental analysis.
        You MUST return a valid JSON object and nothing else.

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

        🚫 STRICT RULES

        - Do NOT explain anything
        - Do NOT add text outside JSON
        - Do NOT define coordinates
        - If uncertain, set fields to null
    """

    try:
        ai_response = analysis_agent.invoke({
            "messages": [
                SystemMessage(prompt),
                HumanMessage(user_prompt)
            ]
        })

        output = ai_response["structured_response"]
        result = GeoSpatialQuery.model_validate(output)

        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to analyse user request:", str(err))
        raise Exception(err)
    
    
report_agent = create_agent(
    model, 
    tools=[normalizeGeoAnalysisData],
    response_format=EnvironmentalReport
)

def generate_environmental_report(geo_analysis_id: str):
    prompt = """
        You are an environmental analysis reporting AI.
        You MUST call the tool `normalizeGeoAnalysisData` before generating the report.
        Return ONLY valid JSON.

        ---

        🎯 OBJECTIVE:

        Generate:
        1. A concise report title
        2. An objective environmental summary

        ---

        🚫 RULES:
        - Use ONLY provided data
        - Do NOT speculate
        - Do NOT exaggerate
        - Keep summary under 500 characters
        - Use scientific and neutral tone
        - Mention important trends and percentages
        - Mention dominant land cover when relevant
        - Mention comparison against global average if relevant

        ---

        🏷️ TITLE RULES:
        - Format:
            "<Dataset Label> in <Location>"
        - Examples:
            "Urban Forest in Singapore"
            "Tree Cover in Madagascar"
            "Carbon Density in Amazon Basin"

        ---

        ✏️ SUMMARY RULES:
        - Focus on:
            - environmental trend
            - major change
            - land cover dominance
            - ecological significance
    """

    try:
        ai_response = report_agent.invoke({
            "messages": [
                SystemMessage(prompt),
                HumanMessage(f"""
                    Environmental geospatial analysis ID: {geo_analysis_id}
                """)
            ]
        })

        output = ai_response["structured_response"]
        result = EnvironmentalReport.model_validate(output)

        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to write environmental report:", str(err))
        raise Exception(err)
