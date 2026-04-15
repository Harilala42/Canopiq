import app.gee.models as gee_models
from fastapi import APIRouter, HTTPException, Request, Depends
from app.dependencies import check_auth

router = APIRouter(dependencies=[Depends(check_auth)])

@router.get("/gee/sequestration-report", tags=["gee"])
async def estimate_carbon_sequestration(request: Request):
    try:
        user_id = request.state.user.id

        return { "message": "GEE layers successfully retrieved" }
    except Exception as err:
        print("ERROR: Failed to retrieve GEE layers:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
