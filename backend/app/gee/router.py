import app.gee.models as gee_models
from app.gee.schemas import MapRequest
from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import check_auth

router = APIRouter(dependencies=[Depends(check_auth)])

# Endpoint to generate tile layer for tree cover
@router.post("/gee/tree-cover/tile", tags=["gee"])
async def estimate_tree_canopy_cover(payload: MapRequest):
    try:
        start_str = payload.start_time.strftime('%Y-%m-%d')
        end_str = payload.end_time.strftime('%Y-%m-%d')

        tile_layer = await gee_models.get_high_res_tree_cover(
            lat=payload.latitude,
            lon=payload.longitude,
            startTime=start_str,
            endTime=end_str
        )

        if tile_layer is None:
            raise Exception("GEE could not generate tile layer.")

        return { "tile_url": tile_layer }
    except Exception as err:
        print("ERROR: Failed to generate GEE tile layers for tree cover:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )

# Endpoint to generate tile layer for carbon stock
@router.post("/gee/carbon-stock/tile", tags=["gee"])
async def estimate_carbon_sequestration(payload: MapRequest):
    try:
        start_str = payload.start_time.strftime('%Y-%m-%d')
        end_str = payload.end_time.strftime('%Y-%m-%d')

        tile_layer = await gee_models.get_high_res_carbon_stock(
            lat=payload.latitude,
            lon=payload.longitude,
            startTime=start_str,
            endTime=end_str
        )

        if tile_layer is None:
            raise Exception("GEE could not generate tile layer.")

        return { "tile_url": tile_layer }
    except Exception as err:
        print("ERROR: Failed to generate GEE tile layers for carbon stock:", str(err))

        raise HTTPException(
            status_code=500,
            detail={
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Something went wrong"
            }
        )
