import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

celery_app = Celery(
    'canopiq_worker',
    broker=os.getenv("REDIS_URL"),
    backend=os.getenv("REDIS_URL"),
    include=["app.llm.tasks"]
)

celery_app.conf.update(
    broker_pool_limit=1,
    broker_transport_options={
        "polling_interval": 10.0
    },

    worker_prefetch_multiplier=1,
    worker_concurrency=1,
    task_acks_late=True,

    task_serializer="json",
    accept_content=["json"],
    result_serializer="json"
)
