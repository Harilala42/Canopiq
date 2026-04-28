import os
from langchain.agents import create_agent
from langchain.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from app.llm.schemas import GeoSpatialQuery
from app.llm.tools import search_location

model = ChatGoogleGenerativeAI(
    model=os.environ.get("GEMINI_MODEL"),     
    api_key=os.environ.get("GEMINI_API_KEY")
)

prompt = SystemMessage("""
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
    - "carbon_stock"
    - "tree_cover"

    ---

    🚫 STRICT RULES

    - Do NOT explain anything
    - Do NOT add text outside JSON
    - Do NOT define coordinates
    - If uncertain, set fields to null
""")

agent = create_agent(
    model, 
    tools=[search_location],
    response_format=GeoSpatialQuery
)

def analyse_user_request(user_prompt: str):
    try:
        ai_response = agent.invoke({
            "messages": [
                prompt,
                HumanMessage(user_prompt)
            ]
        })

        output = ai_response["structured_response"]
        result = GeoSpatialQuery.model_validate(output)

        return result.model_dump()
    except Exception as err:
        print("ERROR: Failed to analyse user request:", str(err))
        raise Exception(err)
