import app.gee.tasks as gee_task
import app.llm.tasks as llm_task
from app.job.models import update_job_progress
from app.worker import celery_app
from celery import chain

@celery_app.task(bind=True, name="trigger_geospatial_analysis")
def trigger_geospatial_analysis(
    self, 
    user_id: str,
    chat_id: str,  
    prompt: str
):
    job_id = self.request.id

    try:
        chain(
            llm_task.analyze_gis_intent.s(
                job_id=job_id, 
                user_id=user_id, 
                chat_id=chat_id, 
                prompt=prompt
            ),
            gee_task.compute_gis_dataset.s(
                job_id=job_id,
                user_id=user_id,
                chat_id=chat_id
            ),
            llm_task.generate_environmental_report.s(
                job_id=job_id, 
                user_id=user_id, 
                chat_id=chat_id
            )
        ).apply_async()

        return { 
            "task_id": job_id,
            "status": "completed"
        }
    except Exception as err:
        print(f"[GEOSPATIAL TASK FAILED] job_id={job_id} err={err}")
        raise
