import os
import ee
from google.oauth2 import service_account

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

# Estimate tree cover from Sentinel-2
async def get_high_res_tree_cover(lat: float, lon: float, startTime: str, endTime: str):
	try:
		geometry = ee.Geometry.Point([lon, lat])
		roi = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level1").filterBounds(geometry)

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
			geometry=roi.geometry(),
			scale=100,
			bestEffort=True
		)

		stats = linear_fit.values()
		offset = ee.Number(stats.get(0))
		scale = ee.Number(stats.get(1))

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
async def get_high_res_carbon_stock(lat: float, lon: float, startTime: str, endTime: str):
    try:
        geometry = ee.Geometry.Point([lon, lat])
        roi = ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level1").filterBounds(geometry)

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
            geometry=roi.geometry(),
            scale=100,
            bestEffort=True
        )

        stats = linear_fit.values()
        offset = ee.Number(stats.get(0))
        scale = ee.Number(stats.get(1))

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
