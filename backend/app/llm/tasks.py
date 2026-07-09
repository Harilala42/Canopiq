import asyncio
import app.chat.models as chat
from app.worker import celery_app
from app.llm.graph.pipeline import graph
from app.job.models import update_job_progress
from celery.contrib.abortable import AbortableTask
from langchain_core.runnables import RunnableConfig
from app.llm.graph.state import PipelineStage

@celery_app.task(bind=True, base=AbortableTask)
def run_geospatial_pipeline(self, user_id: str, chat_id: str, prompt: str):
	job_id = self.request.id

	try:
		update_job_progress(job_id, user_id, PipelineStage.JOB_QUEUED.value)

		chat_history = chat.get_chat_message(chat_id, user_id)
		recent_context = chat_history[-3:] if chat_history else []

		initial_state = {
			"user_prompt": prompt,
			"recent_context": recent_context,
			"geo_params": None,
			"geo_analysis_id": None,
			"report": None,
			"recovery_reply": None,
			"pipeline_stage": None,
		}

		config = RunnableConfig(
            configurable={
				"job_id": job_id,
                "user_id": user_id,
                "chat_id": chat_id,
				"abortable_task": self,
            }
        )

		asyncio.run(graph.ainvoke(initial_state, config))
	except Exception as e:
		print(f"Failed to run geospatial pipeline for {job_id}: {str(e)}")
		update_job_progress(job_id, user_id, PipelineStage.JOB_FAILED.value, str(e))
		raise
