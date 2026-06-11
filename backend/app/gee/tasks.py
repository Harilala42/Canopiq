import app.gee.models as gee
import app.llm.tasks as llm_task
from app.geo_analysis.models import save_geo_analysis
from app.job.models import update_job_progress
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def compute_gis_dataset(
    self, 
    query: dict,
    job_id=job_id
):
    task_id = self.request.id
    update_job_progress(chat_id, user_id, task_id, "computing_gee")

    try:
        gis_analysis = gee.compute_gee_analysis(
            bbox=query["bbox"],
            start_time=str(query["start_time"]),
            end_time=str(query["end_time"]),
            dataset_type=query["data_set"]
        )

        result = save_geo_analysis(chat_id, user_id, query, gis_analysis)
        llm_task.trigger_environmental_report_generation(
            chat_id=chat_id,
            user_id=user_id,
            geo_analysis_id=result[0]["id"]
        )

        return { 
            "status": "completed", 
            "task": self.name,
            "id": result[0]["id"]
        }
    except Exception as e:
        if self.request.retries >= self.max_retries:
            update_job_progress(chat_id, user_id, task_id, "failed", error_msg=str(e))
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
