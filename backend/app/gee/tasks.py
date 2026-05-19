import app.gee.models as gee
import app.llm.tasks as llm_task
from app.gee.utils import save_analysis_to_db
from app.worker import app

@app.task(
    bind=True, 
    name="trigger_geospatial_computation", 
    max_retries=2
)
def trigger_geospatial_computation(
    self, 
    chat_id: str, 
    user_id: str, 
    query: dict
):
    try:
        gis_analysis = gee.compute_gee_analysis(
            bbox=query["bbox"],
            start_time=str(query["start_time"]),
            end_time=str(query["end_time"]),
            dataset_type=query["data_set"]
        )

        result = save_analysis_to_db(chat_id, user_id, query, gis_analysis)
        
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
        raise self.retry(exc=e, countdown=2 ** self.request.retries)
