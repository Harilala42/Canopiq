from app.worker import app
import app.llm.agent as llm
import app.gee.tasks as gee

@app.task(bind=True, name="trigger_geospatial_ai_analysis", max_retries=3)
def trigger_geospatial_ai_analysis(self, chat_id: str, user_id: str, prompt: str):
    try:
        result = llm.analyse_user_request(prompt)

        if result["data_set"] == "tree_cover":
            gee.task_generate_tree_cover_tile_layer.delay(chat_id, user_id, result)
            gee.task_generate_tree_cover_time_series.delay(chat_id, user_id, result)
        elif result["data_set"] == "carbon_stock":
            gee.task_generate_carbon_stock_tile_layer.delay(chat_id, user_id, result)
            gee.task_generate_carbon_stock_time_series.delay(chat_id, user_id, result)

        return { 
            "status": "completed", 
            "data": { "id": chat_id }
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=60)
