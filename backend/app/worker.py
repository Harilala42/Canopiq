import os
import ssl
from celery import Celery
from dotenv import load_dotenv

load_dotenv()

ssl_options = {
    "ssl_cert_reqs": ssl.CERT_NONE
}

app = Celery(
    'canopiq_worker',
    broker=os.getenv("UPSTASH_REDIS_URL"),
    backend=os.getenv("UPSTASH_REDIS_URL"),
    include=["app.job.tasks"]
)

app.conf.update(
    broker_pool_limit=1,
    broker_use_ssl=ssl_options,
    broker_transport_options={
        "polling_interval": 10.0
    },

    redis_backend_use_ssl=ssl_options,

    worker_prefetch_multiplier=1,
    worker_concurrency=1,
    task_acks_late=True,

    task_serializer="json",
    accept_content=["json"],
    result_serializer="json"
)
