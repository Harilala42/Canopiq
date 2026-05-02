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

def get_sentinel_ndvi(roi, start, end, sr=False):
	collection_id = "COPERNICUS/S2_SR_HARMONIZED" if sr else "COPERNICUS/S2_HARMONIZED"

	sen2 = (ee.ImageCollection(collection_id)
		.filterBounds(roi)
		.filterDate(start, end)
		.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 10)))

	median = sen2.median()
	ndvi = median.normalizedDifference(['B8', 'B4']).rename('ndvi')

	return sen2, ndvi

def compute_linear_model(ndvi, reference, roi):
	dataset = ndvi.addBands(reference)

	fit = dataset.reduceRegion(
		reducer=ee.Reducer.linearFit(),
		geometry=roi,
		scale=250,
		bestEffort=True
	)

	scale = ee.Number(fit.get('scale'))
	offset = ee.Number(fit.get('offset'))

	return scale, offset

def apply_linear_model(ndvi, scale, offset, name):
	return ndvi.multiply(scale).add(offset).rename(name)

def generate_tile_layer(image, vis_params):
	mask = image.gt(0)
	final = image.updateMask(mask)

	map_id = final.getMapId(vis_params)
	return map_id['tile_fetcher'].url_format

def generate_time_series(collection, roi, scale, offset):
	def mapper(img):
		ndvi = img.normalizedDifference(['B8', 'B4']).rename('ndvi')
		value = ndvi.multiply(scale).add(offset)

		stats = value.reduceRegion(
			reducer=ee.Reducer.mean(),
			geometry=roi,
			scale=250,
			bestEffort=True
		)

		return ee.Feature(None, {
			'date': img.date().format('YYYY-MM'),
			'value': stats.get('ndvi')
		})

	fc = collection.map(mapper).filter(ee.Filter.notNull(['value']))

	data = fc.reduceColumns(
		ee.Reducer.toList(2),
		['date', 'value']
	).get('list').getInfo()

	return [{"date": d, "value": round(v, 2)} for d, v in data]

def compute_tree_cover_tl(bbox, start, end):
	roi = ee.Geometry.Rectangle(bbox)

	modis = (ee.ImageCollection("MODIS/006/MOD44B")
		.select('Percent_Tree_Cover')
		.filterDate(start, end)
		.first())

	sen2, ndvi = get_sentinel_ndvi(roi, start, end)

	scale, offset = compute_linear_model(ndvi, modis, roi)

	tree_cover = apply_linear_model(ndvi, scale, offset, 'tree_cover')

	return generate_tile_layer(tree_cover, {
		'min': 0,
		'max': 100,
		'palette': ['ffffff', 'afce56', '5f9c3f', '196e0c']
	})
	
def compute_tree_cover_ts(bbox, start, end):
	roi = ee.Geometry.Rectangle(bbox)

	modis = (ee.ImageCollection("MODIS/006/MOD44B")
		.select('Percent_Tree_Cover')
		.filterDate(start, end)
		.mean())

	sen2, ndvi = get_sentinel_ndvi(roi, start, end)

	scale, offset = compute_linear_model(ndvi, modis, roi)

	return generate_time_series(sen2, roi, scale, offset)

def compute_carbon_stock_tl(bbox, start, end):
	roi = ee.Geometry.Rectangle(bbox)

	carbon = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0").first()

	sen2, ndvi = get_sentinel_ndvi(roi, start, end, sr=True)

	scale, offset = compute_linear_model(ndvi, carbon, roi)

	carbon_stock = apply_linear_model(ndvi, scale, offset, 'carbon_stock')

	return generate_tile_layer(carbon_stock, {
		'min': 0,
		'max': 100,
		'palette': ['FFFFFF', 'FFFF00', 'FFA500', '008000', '006400']
	})

def compute_carbon_stock_ts(bbox, start, end):
	roi = ee.Geometry.Rectangle(bbox)

	carbon = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0").mean()

	sen2, ndvi = get_sentinel_ndvi(roi, start, end, sr=True)

	scale, offset = compute_linear_model(ndvi, carbon, roi)

	return generate_time_series(sen2, roi, scale, offset)
