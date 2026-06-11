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
):
	update_job_progress(job_id, "analyzing_prompt")

	try:
		chat_history = chat.get_chat_message(chat_id, user_id)
		recent_context = chat_history[-3:] if chat_history else []

		route = llm.classify_user_request(prompt, recent_context)

		if route == "geospatial_analysis":
			query = llm.extract_geospatial_params(prompt, recent_context)
		# else:
		#     is_impossible = (route == "impossible_request")
			
		#     chat_reply = llm.execute_contextual_chat(
		#         chat_id, 
		#         user_id, 
		#         prompt, 
		#         is_impossible=is_impossible
		#     )
			
		#     chat.save_chat_message(chat_id, user_id, "model", chat_reply)
		#     update_job_progress(chat_id, user_id, task_id, "completed")

		return { "query": query }
	except Exception as err:
		raise self.retry(exc=err, countdown=2 ** self.request.retries)


@shared_task(bind=True, max_retries=3)
def generate_environmental_report(
	self, 
	job_id: str,
	chat_id: str, 
	user_id: str, 
	geo_analysis_id: str
):
	update_job_progress(job_id, "generating_report")

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
		raise self.retry(exc=err, countdown=2 ** self.request.retries)
