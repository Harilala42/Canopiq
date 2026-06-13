import app.llm.agent as llm
import app.chat.models as chat
from app.job.models import update_job_progress
from celery import shared_task

@shared_task(bind=True, max_retries=3)
def analyze_gis_intent(
	self,
	job_id: str,
	user_id: str,
	chat_id: str,
	prompt: str
) -> dict:
	update_job_progress(job_id, user_id, "analyzing_prompt")

	try:
		chat_history = chat.get_chat_message(chat_id, user_id)
		recent_context = chat_history[-3:] if chat_history else []

		query = llm.extract_geospatial_params(prompt, recent_context)

		return { "query": query	}
	except Exception as e:
		if self.request.retries >= self.max_retries:
			update_job_progress(job_id, user_id, "failed", str(e))
		raise self.retry(exc=e, countdown=2 ** self.request.retries)

@shared_task(bind=True, max_retries=3)
def generate_environmental_report(
	self, 
	gis_results,
	job_id: str,
	user_id: str,
	chat_id: str
):
	update_job_progress(job_id, user_id, "generating_report")

	try:
		report = llm.generate_environmental_report(
			geo_analysis_id=gis_results["geo_analysis_id"]
		)

		chat.rename_chat(chat_id, user_id, report["title"])
		chat.save_chat_message(chat_id, user_id, "model", report["summary"])

		update_job_progress(job_id, user_id, "completed")
	except Exception as e:
		if self.request.retries >= self.max_retries:
			update_job_progress(job_id, user_id, "failed", str(e))
		raise self.retry(exc=e, countdown=2 ** self.request.retries)
