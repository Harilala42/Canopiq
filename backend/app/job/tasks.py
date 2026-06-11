import app.gee.tasks as gee_task
import app.llm.tasks as llm_task
from app.job.models import update_job_progress
from celery import chord, chain
from app.worker import app

@app.task(bind=True, name="trigger_geospatial_analysis")
def trigger_geospatial_analysis(
    self, 
    user_id: str,
    chat_id: str,  
    prompt: str
):
    job_id = self.request.id

    try:
        chord(
            chain(
                llm_task.analyze_gis_intent.s(
                    job_id=job_id, 
                    user_id=user_id, 
                    chat_id=chat_id, 
                    prompt=prompt
                ),
                gee_task.compute_gis_dataset.s(job_id=job_id)
            )
        )(llm_task.generate_environmental_report.s(job_id=job_id))

        return { 
            "task_id": job_id,
            "status": "completed"
        }
    except Exception as err:
        update_job_progress(job_id, "failed", str(exc))
        raise
