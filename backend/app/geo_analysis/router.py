import uuid
import app.chat.models as chat_models
import app.geo_analysis.models as geo_analysis_model
from fastapi import APIRouter, HTTPException, Depends, Request
from app.dependencies import check_auth, rate_limiter

router = APIRouter(dependencies=[
    Depends(check_auth),
    Depends(rate_limiter)
])

@router.get("/geo-analysis/{chat_id}", tags=["geo-analysis"])
async def get_geo_analysis(chat_id: uuid.UUID, request: Request):
    try:
        user_id = request.state.user.id
        geo_analysis = geo_analysis_model.get_geo_analysis(chat_id, user_id)
        
        return { "geo_analysis": geo_analysis }
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
        
@router.get("/geo-analysis/map/{h3_grid_map_id}", tags=["geo-analysis"])
async def get_geo_analysis_map(h3_grid_map_id: uuid.UUID, request: Request):
    try:
        user_id = request.state.user.id        
        h3_grid_map = geo_analysis_model.get_h3_grid_map(
            h3_grid_map_id=h3_grid_map_id,
            user_id=user_id
        )
        if not h3_grid_map:
            raise HTTPException(
                status_code=404,
                detail={
                    "code": "MAP_NOT_FOUND",
                    "message": "No H3 grid map found"
                }
            )
        
        return {
            "hex_geojson": h3_grid_map["hex_geojson"],
            "legend": h3_grid_map["legend"]
        }
    except HTTPException:
        raise
    except Exception as err:
        print("ERROR: Failed to retrieve geospatial H3 matrix cells:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
