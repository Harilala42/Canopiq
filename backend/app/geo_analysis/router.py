import app.chat.models as chat_models
import app.geo_analysis.models as geo_analysis_model
from fastapi import APIRouter, HTTPException, Depends, Request
from app.dependencies import check_auth, rate_limiter

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

@router.get("/geo-analysis/{chat_id}", tags=["geo-analysis"])
async def get_geo_analysis(
    chat_id: str,
    request: Request
):
    try:
        user_id = request.state.user.id
        if not chat_id or not chat_models.chat_exists(chat_id, user_id):
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "CHAT_NOT_FOUND",
                    "message": "Chat not found"
                }
            )
        
        result = geo_analysis_model.get_geo_analysis(chat_id, user_id)
        
        return { "data": result }
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to retrieve geospatial analysis:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
