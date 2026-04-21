import app.gee.models as gee_models
from app.gee.schemas import MapRequest
from fastapi import APIRouter, HTTPException, Depends
from app.dependencies import check_auth, gee_rate_limit

router = APIRouter(dependencies=[
	Depends(check_auth),
	Depends(gee_rate_limit)
])

# Endpoint to generate tile layer for tree cover
@router.post("/gee/tree-cover/tile", tags=["gee"])
async def estimate_tree_canopy_cover(payload: MapRequest):
	try:
		start_str = payload.start_time.strftime('%Y-%m-%d')
		end_str = payload.end_time.strftime('%Y-%m-%d')

		tile_layer = await gee_models.get_high_res_tree_cover(
			bbox=payload.bbox,
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
			bbox=payload.bbox,
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

# Endpoint to pintpoint a geographic location
@router.post("gee/location/coordinates", tags=["gee"])
async def search_location_coordinates(query: str):
	try:
		result = await gee_models.fetch_coordinates(
			location=query
		)
		
		if not result.get("features"):
			raise Exception("Location not found")

		feature = result["features"][0]
		lon, lat = feature["geometry"]["coordinates"]
		bbox = feature["bbox"]

		description = feature["properties"].get("display_name")

		return {
			"latitude": lat,
			"longitude": lon,
			"bbox": bbox,
			"description": description
		}
	except Exception as err:
		error_msg = str(err).lower()
		print("ERROR: Failed to fetch location coordinates:", str(err))

		if "not found" in error_msg:
			raise HTTPException(
				status_code=404, 
				detail= {
					"code": "LOCATION_NOT_FOUND",
					"message": "Location not found"
				}
			)

		raise HTTPException(
			status_code=500,
			detail={
				"code": "INTERNAL_SERVER_ERROR",
				"message": "Something went wrong"
			}
		)
