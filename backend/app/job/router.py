import app.job.models as job_model
from fastapi import APIRouter, HTTPException, Depends, Request, Query
from app.dependencies import check_auth, rate_limiter
from app.worker import app
from uuid import UUID

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

@router.delete("/job/{chat_id}", tags=["job"])
async def cancel_running_job(
    chat_id: str,
    request: Request,
    task_id: UUID = Query(...)
):
    try:
        user_id = request.state.user.id

        job = job_model.get_job_by_task_id(task_id, chat_id, user_id)
        if not job:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "JOB_NOT_FOUND",
                    "message": "Job not found"
                }
            )

        if job["status"] in ("completed", "failed", "cancelled"):
            raise HTTPException(
                status_code=409,
                detail={
                    "code": "JOB_ALREADY_FINISHED",
                    "message": f"Job-{task_id} is already finished"
                }
            )

        app.control.revoke(task_id, terminate=True, signal='SIGKILL')
        job_model.update_job_progress(user_id, chat_id, task_id, "cancelled")

        return { "message": "Successfully cancelled job" }
    except HTTPException:
        raise
    except Exception as err:
        print(f"ERROR: Failed to cancel job-{task_id}:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
