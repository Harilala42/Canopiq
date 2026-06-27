import app.gee.models as gee
from celery import shared_task
from app.llm.agent.schemas import GeoSpatialQuery
from app.geo_analysis.models import save_geo_analysis
from langgraph.types import Command

@shared_task(bind=True, max_retries=3, soft_time_limit=180, time_limit=190)
def compute_gis_dataset(self, query: dict, config: dict):
	from app.llm.graph.pipeline import graph

	resume_config = {
        "configurable": {
            "thread_id": config["job_id"], 
            "user_id": config["user_id"],
			"chat_id": config["chat_id"],
            "job_id": config["job_id"]
        }
    }

	try:
		gis_analysis = gee.compute_gee_analysis(
			bbox=query["bbox"],
            start_time=str(query["start_time"]),
            end_time=str(query["end_time"]),
            dataset_type=query["data_set"]
		)

		saved = save_geo_analysis(
            query=query,
            gis_analysis=gis_analysis,
            user_id=config["user_id"],
            chat_id=config["chat_id"],
            job_id=config["job_id"]
        )

		graph.invoke(
			Command(resume={"geo_analysis_id": saved[0]["id"]}),
			resume_config
		)
	except Exception as e:
		if self.request.retries >= self.max_retries:
			graph.invoke(
				Command(resume={"gee_error": str(e)}),
				resume_config
			)
		raise self.retry(exc=e, countdown=2 ** self.request.retries)
