import app.gee.models as gee
from app.job.models import update_job_progress
from app.geo_analysis.models import save_geo_analysis
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def compute_gis_dataset(
	self, 
	gis_intent, 
	job_id: str,
	user_id: str,
	chat_id: str
) -> dict:
	update_job_progress(job_id, user_id, "computing_gee")

	try:
		query = gis_intent["query"]

		gis_analysis = gee.compute_gee_analysis(
			bbox=query["bbox"],
			start_time=str(query["start_time"]),
			end_time=str(query["end_time"]),
			dataset_type=query["data_set"]
		)

		result = save_geo_analysis(
			query=query,
			gis_analysis=gis_analysis,
			user_id=user_id,
			chat_id=chat_id,
			job_id=job_id
		)

		return { "geo_analysis_id": result[0]["id"] }
	except Exception as e:
		if self.request.retries >= self.max_retries:
			update_job_progress(job_id, user_id, "failed", str(e))
		raise self.retry(exc=e, countdown=2 ** self.request.retries)
