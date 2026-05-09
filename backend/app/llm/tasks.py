from app.worker import app
import app.llm.agent as llm
import app.gee.tasks as gee_task

@app.task(bind=True, name="trigger_geospatial_request_analysis", max_retries=3)
def trigger_geospatial_request_analysis(self, chat_id: str, user_id: str, prompt: str):
    try:
        result = llm.analyse_user_request(prompt)

        gee_task.trigger_geospatial_computation.delay(chat_id, user_id, result)

        return { 
            "status": "completed",
            "task": self.name,
            "id": chat_id
        }
    except Exception as e:
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
