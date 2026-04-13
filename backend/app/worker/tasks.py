import os
from celery import Celery
from dotenv import load_dotenv
import app.worker.models as worker_models

load_dotenv()

app = Celery(
    'canopiq_worker',
    broker=os.getenv("UPSTASH_REDIS_URL")
)

app.conf.update(
    broker_use_ssl={'ssl_cert_reqs': 'none'},
    worker_prefetch_multiplier=1,
    worker_concurrency = 2,
    task_acks_late=True,
    result_backend=None
)

@app.task(bind=True, rate_limit="10/m", max_retries=3)
def generate_geospatial_report(self, chat_id: str, user_id: str, prompt: str):
    try:
        worker_models.ask_llm_model(chat_id, user_id, prompt)
    
        return {"status": "completed", "chat_id": chat_id}
    except Exception as e:
        raise self.retry(exc=e, countdown=2)
