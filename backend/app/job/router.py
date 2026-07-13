import app.job.models as job_model
from fastapi import APIRouter, HTTPException, Depends, Request
from celery.contrib.abortable import AbortableAsyncResult
from app.dependencies import check_auth, rate_limiter
from app.worker import celery_app
from uuid import UUID

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

@router.get("/job/{job_id}", tags=["job"])
async def get_job_status(job_id: UUID, request: Request):
    try:
        user_id = request.state.user.id

        job = job_model.get_job_by_task_id(job_id, user_id)
        if not job:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "JOB_NOT_FOUND",
                    "message": "Job not found"
                }
            )

        return {
            "job": {
                "id": job["id"],
                "status": job["status"],
                "err_message": job.get("err_message")
            }
        }
    except HTTPException:
        raise
    except Exception as err:
        print(f"ERROR: Failed to fetch job status:", str(err))
        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

@router.delete("/job/{job_id}", tags=["job"])
async def cancel_running_job(job_id: UUID, request: Request):
    try:
        user_id = request.state.user.id

        job = job_model.get_job_by_task_id(job_id, user_id)
        if not job:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "JOB_NOT_FOUND",
                    "message": "Job not found"
                }
            )

        if job["status"] in ("completed", "failed", "canceled"):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "JOB_ALREADY_FINISHED",
                    "message": f"Job is already finished"
                }
            )

        result = AbortableAsyncResult(str(job_id), app=celery_app)
        result.abort()
        job_model.update_job_progress(job_id, user_id, "canceled")

        return { "message": "Job successfully canceled" }
    except HTTPException:
        raise
    except Exception as err:
        print(f"ERROR: Failed to cancel job:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
