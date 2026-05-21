import app.llm.agent as llm
import app.chat.models as chat
import app.gee.tasks as gee_task
from app.gee.utils import update_job_progress
from app.worker import app

@app.task(
    bind=True,
    name="trigger_geospatial_request_analysis",
    max_retries=3
)
def trigger_geospatial_request_analysis(
    self, 
    chat_id: str, 
    user_id: str, 
    prompt: str
):
    task_id = self.request.id
    update_job_progress(chat_id, user_id, task_id, "analyzing_prompt")

    try:
        analysis = llm.analyse_user_request(prompt)
        gee_task.trigger_geospatial_computation.delay(chat_id, user_id, analysis)

        return { 
            "status": "completed",
            "task": self.name,
            "id": chat_id
        }
    except Exception as e:
        if self.request.retries >= self.max_retries:
            update_job_progress(chat_id, user_id, task_id, "failed", error_msg=str(e))
        raise self.retry(exc=e, countdown=2 ** self.request.retries)

    
@app.task(
    bind=True,
    name="trigger_environmental_report_generation",
    max_retries=3
)
def trigger_environmental_report_generation(
    self, 
    chat_id: str, 
    user_id: str, 
    geo_analysis_id: str
):
    task_id = self.request.id
    update_job_progress(chat_id, user_id, task_id, "generating_report")

    try:
        report = llm.generate_environmental_report(geo_analysis_id)

        chat.rename_chat(chat_id, user_id, report["title"])
        chat.save_chat_message(chat_id, user_id, "model", report["summary"])

        update_job_progress(chat_id, user_id, task_id, "completed")
        return { 
            "status": "completed",
            "task": self.name,
            "id": report
        }
    except Exception as e:
        if self.request.retries >= self.max_retries:
            update_job_progress(chat_id, user_id, task_id, "failed", error_msg=str(e))
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
