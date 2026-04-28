import os
import ee
from google.oauth2 import service_account
from app.dependencies import get_supabase as supabase

service_account = os.environ.get("SERVICE_ACCOUNT")
private_key = os.environ.get("SERVICE_ACCOUNT_FILE")

# Anthentication to GEE using Service Account
def authenticate_gee():
	try:
		credentials = ee.ServiceAccountCredentials(service_account, private_key)
		ee.Initialize(credentials)

		print("Successfully connected to GEE")
	except Exception as err:
		print("GEE initialization failed:", str(err))

authenticate_gee()

# Store query details to Supabase
def save_query_to_db(query: dict, chat_id: str, user_id: str, tile_url: str):
	client = supabase()

	start_time = str(query["start_time"])
	end_time = str(query["end_time"])
	
	b = query['bbox']
	wkt_boundary = f"POLYGON(({b[0]} {b[1]}, {b[2]} {b[1]}, {b[2]} {b[3]}, {b[0]} {b[3]}, {b[0]} {b[1]}))"
	wkt_center = f"POINT({query['longitude']} {query['latitude']})"
	
	response = client.table("geo_analysis") \
		.insert({
			"chat_id": chat_id,
			"user_id": user_id,
			"location": query['location'],
			"dataset": query['data_set'],
			"boundary": wkt_boundary,
			"center_point": wkt_center,
			"gee_tile_url": tile_url,
			"metadata": {
				"start_time": start_time,
				"end_time": end_time
			}
		}).execute()

	return response.data if response and response.data else None

# Estimate tree cover from Sentinel-2
def get_high_res_tree_cover(bbox: list[float], startTime: str, endTime: str):
	try:
		roi = ee.Geometry.Rectangle(bbox)

		modis = ee.ImageCollection("MODIS/006/MOD44B") \
			.select('Percent_Tree_Cover') \
			.filterDate(startTime, endTime).first()

		sen2 = (ee.ImageCollection("COPERNICUS/S2_HARMONIZED")
			.filterBounds(roi)
			.filterDate(startTime, endTime)
			.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
			.median())
		
		ndvi = sen2.normalizedDifference(['B8', 'B4']).rename('ndvi')

		dataset = ndvi.addBands(modis)
		linear_fit = dataset.reduceRegion(
			reducer=ee.Reducer.linearFit(),
			geometry=roi,
			scale=100,
			bestEffort=True
		)

		stats = linear_fit.getInfo()
		if not stats.get('scale') or not stats.get('offset'):
			scale = ee.Number(100) 
			offset = ee.Number(0)
		else:
			offset = ee.Number(stats.get('offset'))
			scale = ee.Number(stats.get('scale'))

		tree_cover_high_res = ndvi.multiply(scale).add(offset).round().rename('tree_cover')

		mask = tree_cover_high_res.gt(0)
		final_layer = tree_cover_high_res.updateMask(mask)

		vis_params = {
			'min': 0,
			'max': 100,
			'palette': ['ffffff', 'afce56', '5f9c3f', '196e0c']
		}
		
		map_id = final_layer.getMapId(vis_params)
		
		return map_id['tile_fetcher'].url_format
	except Exception as err:
		raise err

# Estimate carbon stock from Sentinel-2
def get_high_res_carbon_stock(bbox: list[float], startTime: str, endTime: str):
	try:
		roi = ee.Geometry.Rectangle(bbox)

		carbon = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0") \
			.first()

		sen2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
			.filterBounds(roi)
			.filterDate(startTime, endTime)
			.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10))
			.median())
		
		ndvi = sen2.normalizedDifference(['B8', 'B4']).rename('ndvi')

		dataset = ndvi.addBands(carbon)
		linear_fit = dataset.reduceRegion(
			reducer=ee.Reducer.linearFit(),
			geometry=roi,
			scale=100,
			bestEffort=True
		)

		stats = linear_fit.getInfo()
		if not stats.get('scale') or not stats.get('offset'):
			scale = ee.Number(100) 
			offset = ee.Number(0)
		else:
			offset = ee.Number(stats.get('offset'))
			scale = ee.Number(stats.get('scale'))

		carbon_stock_high_res = ndvi.multiply(scale).add(offset).rename('carbon_stock')

		mask = carbon_stock_high_res.gt(0)
		final_layer = carbon_stock_high_res.updateMask(mask)

		vis_params = {
			'min': 0,
			'max': 100,
			'palette': ['FFFFFF', 'FFFF00', 'FFA500', '008000', '006400']
		}
		
		map_id = final_layer.getMapId(vis_params)
		
		return map_id['tile_fetcher'].url_format
	except Exception as err:
		raise err
