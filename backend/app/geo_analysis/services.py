import os
import ee
import h3
import time
import random
import geopandas as gpd
from h3 import LatLngPoly
from google.oauth2 import service_account
from typing import Any, List, Dict, Tuple
from datetime import date
from enum import Enum

service_account = os.environ.get("SERVICE_ACCOUNT")
private_key = os.environ.get("SERVICE_ACCOUNT_FILE")

# Authenticate GEE via service account
def authenticate_gee(attempt=1, max_retries=3, base_delay=1, max_delay=15):
	try:
		credentials = ee.ServiceAccountCredentials(service_account, private_key)
		ee.Initialize(credentials)
		print("Successfully connected to GEE")
		return True
	except Exception as err:
		if attempt >= max_retries:
			print(f"GEE initialization failed after {max_retries} attempts:", str(err))
			return False

		# Exponential backoff retry with jitter
		delay = min(base_delay * (2 ** (attempt - 1)), max_delay)
		delay += random.uniform(0, delay * 0.1)

		print(f"Attempt {attempt} failed: {err}. Retrying in {delay:.1f}s...")
		time.sleep(delay)

		return authenticate_gee(attempt + 1)

authenticate_gee()


# GEE Datasets currently supported
class GEEDataset(str, Enum):
	TREE_COVER = "tree_cover"
	CARBON_DENSITY = "carbon_density"
	LAND_USE_DISTRIBUTION = "land_use_distribution"

	def execute(self, q: dict[str, Any]):
		match self:
			case GEEDataset.LAND_USE_DISTRIBUTION:
				return compute_land_use_distribution(bbox=q["bbox"])
			case GEEDataset.CARBON_DENSITY | GEEDataset.TREE_COVER:
				return compute_biomass_trend(
					dataset_type=self,
					bbox=q["bbox"],
					start_time=str(q["start_time"]),
					end_time=str(q["end_time"]),
				)


# ── Vegetation Cover & Biomass Carbon Sequestration ─────────────
def compute_biomass_trend(
	dataset_type: str, 
	bbox: List[float], 
	start_time: date, 
	end_time: date
) -> Dict[str, Any]:
	"""
	Unified analysis for continuous variables (Tree Cover & Carbon Density):
	Sentinel-2 NDVI linear-fitted against a reference image dataset baseline,
	aggregated to an H3 hex grid, plus a monthly linear-fitted NDVI time series.
	"""
	roi: ee.Geometry = ee.Geometry.Rectangle(bbox)
	area_ha: float = roi.area().divide(10000).getInfo()

	# 1. Resolve dynamic H3 scaling
	h3_resolution, scale = _get_dynamic_h3_resolution_and_scale(area_ha)
	h3_vector_col: ee.FeatureCollection = _generate_gee_h3_grid(bbox, h3_resolution)

	# 2. Get Sentinel collection metrics & dataset-specific configuration
	ts_col, median_ndvi = _get_sentinel_ndvi(roi, start_time, end_time)
	ref_img, palette = _get_dataset_col(dataset_type, start_time, end_time, roi)

	# 3. Fit Sentinel NDVI against the chosen reference layer
	fit_stats: ee.Dictionary = median_ndvi.addBands(ref_img).reduceRegion(
		reducer=ee.Reducer.linearFit(),
		geometry=roi,
		scale=scale,
		bestEffort=True
	)
	scale_factor = ee.Number(fit_stats.get('scale'))
	offset_factor = ee.Number(fit_stats.get('offset'))

	predicted_img: ee.Image = median_ndvi \
		.multiply(scale_factor) \
		.add(offset_factor) \
		.updateMask(median_ndvi.gt(0)) \
		.rename('biomass')

	# 4. Reduce predicted raster values to H3 hexagonal collection
	vmin, vmax, hex_gdf = _extract_gee_image_to_h3_grid(
		predicted_img=predicted_img,
		roi=roi, scale=scale,
		h3_vector_col=h3_vector_col,
		palette=palette
	)

	# 5. Extract calibrated continuous historical timeline data
	processed_ts = _compute_time_series(
		collection=ts_col,
		roi=roi,
		scale=scale_factor,
		offset=offset_factor,
		start_date=start_time,
		end_date=end_time
	)

	# 6. Generate dynamic legends for the map
	legend_data = _generate_legend_intervals(vmin, vmax, palette)

	return {
		"hex_geojson": hex_gdf.__geo_interface__,
		"time_series": processed_ts,
		"area_ha": round(area_ha, 2),
		"legend": legend_data
	}


# ── Biomass Trend Helper Functions ─────────────
def _get_sentinel_ndvi(
	roi: ee.Geometry, 
	start_time: date, 
	end_time: date
) -> Tuple[ee.ImageCollection, ee.Image]:
	"""
	Fetches and masks Sentinel-2 collection,
	returning the time series collection and a median NDVI.
	"""
	
	def mask_s2(img):       
		# Mask Sentinel-2 pixels using QA60 cloud mask bits
		qa = img.select('QA60')         
		cloud = qa.bitwiseAnd(1 << 10).eq(0)
		cirrus = qa.bitwiseAnd(1 << 11).eq(0)
		return img.updateMask(cloud.And(cirrus)) 
	
	def make_col(collection_id):
		return (ee.ImageCollection(collection_id)
			.filterBounds(roi)
			.filterDate(max(start_time, "2015-06-23"), end_time)
			.filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 30))
			.select(['B2', 'B3', 'B4', 'B8', 'QA60'])
			.map(mask_s2))

	# Sentinel-2 Level-2A Surface Reflectance (Bottom-of-Atmosphere)
	boa_col = make_col("COPERNICUS/S2_SR_HARMONIZED")   
	# Sentinel-2 Level-1C Top-of-Atmosphere reflectance.    
	toa_col = make_col("COPERNICUS/S2_HARMONIZED")
	sen2_col = boa_col if boa_col.size().getInfo() > 0 else toa_col

	ts_col = toa_col        # Use the TOA collection as the source for the time series.
	if ts_col.size().getInfo() == 0:
		raise Exception(
			f"No Sentinel-2 imagery found "
			f"between {start_time} and {end_time}."
		)

	median_ndvi = sen2_col.median().normalizedDifference(['B8', 'B4']).rename('ndvi')
	return ts_col, median_ndvi

def _get_dataset_col(
	dataset_type: str, 
	start_time: date, 
	end_time: date, 
	roi: ee.Geometry
) -> Tuple[ee.Image, List[str]]:
	"""
	Returns the reference image and specific visualization parameters.
	"""

	if dataset_type == "carbon_density":
		ref_col = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0")
		ref_img = ref_col.first().clip(roi)
		palette = ['#a34b3c', '#b37a3f', '#4b907f', '#287662']
	else:
		ref_col = ee.ImageCollection("MODIS/061/MOD44B").select('Percent_Tree_Cover')
		ref_img = ref_col.filterDate(start_time, end_time).mean().clip(roi)
		palette = ['#ffffff', '#afce56', "#3fa34d", '#196e0c']

	ref_bands = ref_img.bandNames().getInfo()
	if not ref_bands:
		raise Exception(
			f"The reference dataset '{dataset_type}' contains no valid data "
			f"within the selected region bounding box "
			f"between {start_time} and {end_time}."
		)

	return ref_img, palette

def _generate_legend_intervals(
	min_val: float, 
	max_val: float, 
	palette: List[str]
) -> List[Dict[str, str]]:
	"""
	Splits the min/max range into even steps matching the palette size.
	"""
	n_steps = len(palette)
	step_size = (max_val - min_val) / n_steps
	
	legend = []
	for i in range(n_steps):
		start = min_val + (i * step_size)
		end = min_val + ((i + 1) * step_size)

		legend.append({
			"color": palette[i],
			"label": f"{max(0, round(start))} - {max(0, round(end))}"
		})

	return legend

def _get_dynamic_h3_resolution_and_scale(area_ha: float) -> Tuple[int, int]:
	"""
	Determines H3 resolution and corresponding GEE extraction scale 
	based on area size to balance detail and performance.
	"""
	area_km2 = area_ha / 100
	if area_km2 >= 10000:
		raise Exception(
			f"Requested area ({round(area_km2)} km²) exceeds the maximum "
			f"regional processing limit of 10,000 km²."
		)
	
	h3_resolution = 8 if area_km2 < 1000 else 7
	current_scale = 500 if h3_resolution == 8 else 1000

	return h3_resolution, current_scale

def _generate_gee_h3_grid(
	bbox: List[float], 
	h3_resolution: int = 8
) -> ee.FeatureCollection:
	"""
	Generates H3 hex IDs for a bounding box and converts them 
	directly into an Earth Engine FeatureCollection.
	"""
	xmin, ymin, xmax, ymax = bbox
	polygon = LatLngPoly([
		(ymin, xmin),
		(ymin, xmax),
		(ymax, xmax),
		(ymax, xmin),
		(ymin, xmin)
	])

	hex_ids = h3.polygon_to_cells(polygon, h3_resolution)
	
	ee_features = []
	for hex_id in hex_ids:
		boundary = h3.cell_to_boundary(hex_id)
		flipped_boundary = [[lon, lat] for lat, lon in boundary]
		
		gee_geom = ee.Geometry.Polygon(flipped_boundary)
		feat = ee.Feature(gee_geom, {'hex_id': hex_id})
		ee_features.append(feat)
		
	return ee.FeatureCollection(ee_features)

def _extract_gee_image_to_h3_grid(
	predicted_img: ee.Image,
	roi: ee.Geometry, 
	scale: int,
	h3_vector_col: ee.FeatureCollection,
	palette: List[str]
) -> Tuple[float, float, gpd.GeoDataFrame]:
	"""
	Reduces imagery data directly inside the provided H3 FeatureCollection 
	and returns a clean, fully aggregated GeoPandas GeoDataFrame.
	"""
	stats = predicted_img.reduceRegion(
		reducer=ee.Reducer.minMax(),
		geometry=roi,
		scale=scale,
		bestEffort=True
	).getInfo()

	band_name = predicted_img.bandNames().get(0).getInfo()
	vmin = round(stats.get(f'{band_name}_min', 0), 2)
	vmax = round(stats.get(f'{band_name}_max', 100), 2)

	reduced_hex = predicted_img.reduceRegions(
		collection=h3_vector_col,
		reducer=ee.Reducer.mean(),
		scale=scale,
		tileScale=4
	)
	cleaned_hex = reduced_hex.filter(ee.Filter.gt('mean', 0))

	hex_gdf = ee.data.computeFeatures({
		'expression': cleaned_hex,
		'fileFormat': 'GEOPANDAS_GEODATAFRAME'
	})
	hex_gdf.crs = 'EPSG:4326'

	def map_val_to_color(val):
		if vmax == vmin: return palette[0]
		t = (val - vmin) / (vmax - vmin)
		t = max(0.0, min(1.0, t))
		idx = int(t * (len(palette) - 1))
		return palette[idx]
	hex_gdf = hex_gdf.rename(columns={'mean': band_name})
	hex_gdf["color"] = hex_gdf[band_name].apply(map_val_to_color)

	return vmin, vmax, hex_gdf

def _compute_time_series(
	collection: ee.ImageCollection, 
	roi: ee.Geometry,
	scale: ee.Number, 
	offset: ee.Number, 
	start_date: date, 
	end_date: date,
	roi_scale: int = 1000
) -> List[Dict[str, Any]]:
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
		has_images = monthly_collection.size().gt(0)

		def calculate_metrics():
			monthly_img = monthly_collection.median()
			ndvi = monthly_img.normalizedDifference(['B8', 'B4']).rename('ndvi')
			pred = ndvi.multiply(scale).add(offset).max(0).rename('pred')

			stats = ndvi.addBands(pred).reduceRegion(
				reducer=ee.Reducer.mean(),
				geometry=roi,
				scale=roi_scale,
				bestEffort=True
			)
			return ee.Feature(None, {
				'date': month_start.format('YYYY-MM'),
				'ndvi': stats.get('ndvi'),
				'pred': stats.get('pred'),
				'valid': 1
			})

		def return_empty_feature():
			return ee.Feature(None, {
				'date': month_start.format('YYYY-MM'),
				'ndvi': None,
				'pred': None,
				'valid': 0
			})

		return ee.Feature(ee.Algorithms.If(
			has_images, 
			calculate_metrics(),
			return_empty_feature()
		))

	fc = ee.FeatureCollection(months.map(monthly_feature))
	clean_fc = fc.filter(ee.Filter.eq('valid', 1))

	return [f['properties'] for f in clean_fc.getInfo()['features']]


# ── Land-Use Distribution ─────────────
LAND_COVER_CLASSES = {
	10: {"label": "Tree cover", "color": "#287662"},
	20: {"label": "Shrubland", "color": "#afce56"},
	30: {"label": "Grassland", "color": "#4c8f7f"},
	40: {"label": "Cropland", "color": "#534ab7"},
	50: {"label": "Built-up", "color": "#a34b3c"},
	60: {"label": "Bare/sparse vegetation", "color": "#7A728F"},
	70: {"label": "Snow and ice", "color": "#cbdff6"},
	80: {"label": "Permanent water", "color": "#4a82b7"},
	90: {"label": "Herbaceous wetland", "color": "#2C7A7B"},
	95: {"label": "Mangroves", "color": "#2FBF9B"},
	100: {"label": "Moss and lichen", "color": "#8F87D6"},
}

def compute_land_use_distribution(bbox: List[float]) -> Dict[str, Any]:
	"""
	Land-use distribution analysis: ESA WorldCover v200 class composition
	over the ROI (region-wide percentages for a donut chart), plus the same
	classes aggregated to an H3 hex grid for the map, each hex colored by
	its dominant land-cover class. This is a single-snapshot analysis with
	no time-series component.
	"""
	roi: ee.Geometry = ee.Geometry.Rectangle(bbox)
	area_ha: float = roi.area().divide(10000).getInfo()

	# 1. Resolve dynamic H3 scaling
	h3_resolution, scale = _get_dynamic_h3_resolution_and_scale(area_ha)
	h3_vector_col: ee.FeatureCollection = _generate_gee_h3_grid(bbox, h3_resolution)

	# 2. Fetch the categorical reference land cover dataset
	ref_col: ee.ImageCollection = ee.ImageCollection("ESA/WorldCover/v200")
	ref_img: ee.Image = ref_col.first().clip(roi)
	ref_bands = ref_img.bandNames().getInfo()
	if not ref_bands:
		raise Exception(
			f"The land-cover dataset contains no valid data "
			f"within the selected region bounding box."
		)

	#3. Compute region-wide class frequency distribution for global metrics
	histogram = ref_img.reduceRegion(
		reducer=ee.Reducer.frequencyHistogram(),
		geometry=roi,
		scale=scale,
		bestEffort=True
	).getInfo()

	# 4. Reduce categorical raster values to H3 grid via majority voting
	hex_gdf = _extract_landcover_to_h3_grid(ref_img, h3_vector_col, scale)

	# 5. Extract chart distribution percentages and build the interactive map legend
	land_use_percent, legend_data = _generate_legend_classes(histogram)

	return {
		"hex_geojson": hex_gdf.__geo_interface__,
		"land_use": land_use_percent,
		"area_ha": round(area_ha, 2),
		"legend": legend_data
	}


# ── Land-Use Distribution Helper Funtions ─────────────
def _extract_landcover_to_h3_grid(
	ref_img: ee.Image, 
	h3_vector_col: ee.FeatureCollection, 
	scale: int
) -> gpd.GeoDataFrame:
	"""
	Reduces the categorical WorldCover image into the H3 grid. Land cover
	classes are categorical (10, 20, 30...), so per-hex aggregation uses
	frequencyHistogram (not mean) and each hex is colored/labeled by its
	dominant class.
	"""
	reduced_hex = ref_img.reduceRegions(
		collection=h3_vector_col,
		reducer=ee.Reducer.frequencyHistogram(),
		scale=scale,
		tileScale=4
	)

	hex_gdf = ee.data.computeFeatures({
		'expression': reduced_hex,
		'fileFormat': 'GEOPANDAS_GEODATAFRAME'
	})
	hex_gdf.crs = 'EPSG:4326'

	dominant_labels = []
	dominant_colors = []
	for histogram in hex_gdf.get("histogram", []):
		class_id = int(max(histogram, key=histogram.get)) if histogram else None
		info = LAND_COVER_CLASSES.get(class_id)
		if info is None:
			dominant_labels.append(None)
			dominant_colors.append(None)
		else:
			dominant_labels.append(info["label"])
			dominant_colors.append(info["color"])

	hex_gdf["dominant_class"] = dominant_labels
	hex_gdf["color"] = dominant_colors
	hex_gdf = hex_gdf[hex_gdf["dominant_class"].notna()]

	return hex_gdf

def _generate_legend_classes(
	histogram: Dict[str, Any]
) -> Tuple[Dict[str, Dict[str, Any]], List[Dict[str, str]]]:
	"""
	Computes region-wide land cover class percentages and maps them 
	to their corresponding colors and labels for the legend.
	"""
	pixel_counts = histogram.get('Map', {})
	total_pixels = sum(pixel_counts.values())

	land_use_percent = {}
	for class_id_str, count in pixel_counts.items():
		class_id = int(class_id_str)
		info = LAND_COVER_CLASSES.get(class_id)
		if not info: continue
			
		label = info["label"]
		color = info["color"]
		percentage = round((count / total_pixels) * 100, 2)

		land_use_percent[label] = {
			"value": percentage,
			"color": color
		}
		
	legend_data = [
		{"color": info["color"], "label": info["label"]}
		for info in LAND_COVER_CLASSES.values()
		if info["label"] in land_use_percent
	]

	return land_use_percent, legend_data
