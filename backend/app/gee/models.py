import os
import ee
from google.oauth2 import service_account

service_account = os.environ.get("SERVICE_ACCOUNT")
private_key = os.environ.get("SERVICE_ACCOUNT_FILE")

def authenticate_gee():
	try:
		credentials = ee.ServiceAccountCredentials(service_account, private_key)
		ee.Initialize(credentials)

		print("Successfully connected to GEE")
	except Exception as err:
		print("GEE initialization failed:", str(err))

authenticate_gee()

def compute_gee_analysis(bbox, start_time, end_time, dataset_type="tree_cover"):
	roi = ee.Geometry.Rectangle(bbox)
	
	sen2_col, median_ndvi = get_sentinel_ndvi(roi, start_time, end_time)
	reference_img, vis_params = get_dataset_col(dataset_type, start_time, end_time, roi)

	fit_stats = median_ndvi.addBands(reference_img).reduceRegion(
		reducer=ee.Reducer.linearFit(),
		geometry=roi,
		scale=250,
		bestEffort=True
	)
	scale = ee.Number(fit_stats.get('scale'))
	offset = ee.Number(fit_stats.get('offset'))

	tile_url = generate_tile_layer(median_ndvi, scale, offset, vis_params)
	processed_ts = compute_time_series(sen2_col, roi, scale, offset, start_time, end_time)
	
	area_ha = roi.area().divide(10000).getInfo()

	return {
		"tile_url": tile_url,
		"time_series": processed_ts,
		"area_ha": round(area_ha, 2),
		"model_params": {
			"scale": scale.getInfo(), 
			"offset": offset.getInfo()
		}
	}

def get_sentinel_ndvi(roi, start_time, end_time):
	"""
	Fetches and masks Sentinel-2 collection,
	returning the collection and a median NDVI.
	"""
	
	def mask_s2(img):
		qa = img.select('QA60')
		cloud = qa.bitwiseAnd(1 << 10).eq(0)
		cirrus = qa.bitwiseAnd(1 << 11).eq(0)
		return img.updateMask(cloud.And(cirrus)) 

	sen2 = (ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
		.filterBounds(roi)
		.filterDate(start_time, end_time)
		.map(mask_s2))

	median_ndvi = sen2.median().normalizedDifference(['B8', 'B4']).rename('ndvi')
	return sen2, median_ndvi

def get_dataset_col(dataset_type, start_time, end_time, roi):
	"""
	Returns the reference image and specific visualization parameters.
	"""

	if dataset_type == "carbon_stock":
		ref_col = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0")
		vis = {'min': 0, 'max': 100, 'palette': ['#a34b3c', '#b37a3f', '#4b907f', '#287662']}
	else:
		ref_col = ee.ImageCollection("MODIS/006/MOD44B").select('Percent_Tree_Cover')
		vis = {'min': 0, 'max': 100, 'palette': ['#ffffff', '#afce56', '#196e0c']}

	reference_img = ref_col.filterDate(start_time, end_time).mean().clip(roi)
	return reference_img, vis

def generate_tile_layer(ndvi_img, scale, offset, vis_params):
	"""
	Applies the linear model to an NDVI image and returns the tile URL.
	"""

	predicted_img = ndvi_img.multiply(scale).add(offset).updateMask(ndvi_img.gt(0))
	map_id = predicted_img.getMapId(vis_params)

	return map_id['tile_fetcher'].url_format

def compute_time_series(collection, roi, scale, offset, start_date, end_date):
	"""
	Generates a monthly environmental time series from a Sentinel-2 image collection.
	"""

	start = ee.Date(start_date)
	end = ee.Date(end_date)

	n_months = end.difference(start, 'month').round()
	months = ee.List.sequence(0, n_months.subtract(1))

	def monthly_feature(m):
		m = ee.Number(m)
		month_start = start.advance(m, 'month')
		month_end = month_start.advance(1, 'month')

		monthly_collection = collection.filterDate(month_start, month_end)
		monthly_img = monthly_collection.median()

		ndvi = monthly_img.normalizedDifference(['B8', 'B4']).rename('ndvi')
		pred = ndvi.multiply(scale).add(offset).max(0).rename('pred')

		stats = ndvi.addBands(pred).reduceRegion(
			reducer=ee.Reducer.mean(),
			geometry=roi,
			scale=250,
			bestEffort=True
		)

		return ee.Feature(None, {
			'date': month_start.format('YYYY-MM'),
			'ndvi': stats.get('ndvi'),
			'pred': stats.get('pred')
		})

	fc = ee.FeatureCollection(months.map(monthly_feature))
	fc = fc.filter(ee.Filter.notNull(['ndvi', 'pred']))

	return [f['properties'] for f in fc.getInfo()['features']]
