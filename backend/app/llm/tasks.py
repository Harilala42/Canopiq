import app.chat.models as chat
from app.worker import celery_app
from app.llm.graph.pipeline import graph
from app.job.models import update_job_progress
from langchain_core.runnables import RunnableConfig

@celery_app.task(bind=True)
def run_geospatial_pipeline(
	self,
	job_id: str,
	user_id: str,
	chat_id: str,
	prompt: str
):
	try:
		update_job_progress(job_id, user_id, "queued")

		chat_history = chat.get_chat_message(chat_id, user_id)
		recent_context = chat_history[-3:] if chat_history else []

		initial_state = {
			"user_prompt": prompt,
			"recent_context": recent_context,

			"geo_params": None,
			"geo_analysis_id": None,
			"gee_error": None,

			"report": None,

			"recovery_reply": None
		}

		config = RunnableConfig(
            configurable={
				"thread_id": job_id,
                "user_id": user_id,
                "job_id": job_id,
                "chat_id": chat_id,
            }
        )

		graph.invoke(initial_state, config)
	except Exception as e:
		update_job_progress(job_id, user_id, "failed", str(e))
		raise
