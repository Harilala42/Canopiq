import os
from google import genai
import app.llm.models as llm_models

genai_cli = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

def ask_llm_model(chat_id: str, user_id: str, message: str):
    try:
        messages_list = llm_models.get_chat_message(chat_id, user_id)
        messages_list.append({ "role": "user", "content": message })

        response = genai_cli.interactions.create(
            model=os.environ.get("GEMINI_MODEL"),
            input=messages_list,
            timeout=30
        )

        if not response or not response.outputs:
            raise Exception("Invalid response from LLM service")

        ai_response = response.outputs[-1].text
        llm_models.save_chat_message(chat_id, user_id, "model", ai_response)
    except Exception as err:
        print("ERROR: Failed to process llm request:", str(err))
        raise Exception(err)
