import os
import ee
import h3
import geopandas as gpd
from h3 import LatLngPoly
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

def compute_gee_analysis(
    bbox, 
    start_time, end_time, 
    dataset_type="tree_cover",
    scale=1000
):
    roi = ee.Geometry.Rectangle(bbox)
    h3_vector_col = generate_gee_h3_grid(bbox)
    
    sen2_col, median_ndvi = get_sentinel_ndvi(roi, start_time, end_time)
    reference_img, palette = get_dataset_col(dataset_type, start_time, end_time, roi)

    fit_stats = median_ndvi.addBands(reference_img).reduceRegion(
        reducer=ee.Reducer.linearFit(),
        geometry=roi,
        scale=scale,
        bestEffort=True
    )
    scale_factor = ee.Number(fit_stats.get('scale'))
    offset_factor = ee.Number(fit_stats.get('offset'))

    predicted_img = median_ndvi \
        .multiply(scale_factor) \
        .add(offset_factor) \
        .updateMask(median_ndvi.gt(0)) \
        .rename('biomass')
    
    vmin, vmax, hex_gdf = extract_gee_image_to_h3_grid(
        predicted_img=predicted_img, 
        roi=roi, scale=scale,
        h3_vector_col=h3_vector_col, 
        palette=palette
    )

    processed_ts = compute_time_series(
        collection=sen2_col, 
        roi=roi, 
        scale=scale_factor, 
        offset=offset_factor, 
        start_date=start_time, 
        end_date=end_time
    )

    land_cover_percent = compute_landcover_composition(roi)
    
    legend_data = generate_legend_intervals(vmin, vmax, palette)
    area_ha = roi.area().divide(10000).getInfo()

    return {
        "hex_geojson": hex_gdf.__geo_interface__,
        "time_series": processed_ts,
        "land_cover": land_cover_percent,
        "area_ha": round(area_ha, 2),
        "legend": legend_data
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

    if dataset_type == "carbon_density":
        ref_col = ee.ImageCollection("WCMC/biomass_carbon_density/v1_0")
        reference_img = ref_col.first().clip(roi)
        palette = ['#a34b3c', '#b37a3f', '#4b907f', '#287662']
    else:
        ref_col = ee.ImageCollection("MODIS/006/MOD44B").select('Percent_Tree_Cover')
        reference_img = ref_col.filterDate(start_time, end_time).mean().clip(roi)
        palette = ['#ffffff', '#afce56', "#3fa34d", '#196e0c']
    return reference_img, palette

def generate_legend_intervals(min_val, max_val, palette):
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
            "range": f"{max(0, round(start))} - {max(0, round(end))}"
        })

    return legend

def generate_gee_h3_grid(bbox, h3_resolution=8):
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

def extract_gee_image_to_h3_grid(
    predicted_img,
    roi, scale,
    h3_vector_col,
    palette
):
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

def compute_time_series(
    collection, 
    roi, 
    scale, offset, 
    start_date, end_date
):
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

def compute_landcover_composition(roi, scale=10):
    """
    Aggregates ESA WorldCover v200 land cover classes over a ROI
    and computes normalized class distribution based on pixel frequency.
    """

    ref_col = ee.ImageCollection("ESA/WorldCover/v200")
    reference_img = ref_col.first().clip(roi)

    class_info = {
        10: {
            "label": "Tree cover",
            "color": "#287662"
        },
        20: {
            "label": "Shrubland",
            "color": "#afce56"
        },
        30: {
            "label": "Grassland",
            "color": "#4c8f7f"
        },
        40: {
            "label": "Cropland",
            "color": "#534ab7"
        },
        50: {
            "label": "Built-up",
            "color": "#a34b3c"
        },
        60: {
            "label": "Bare/sparse vegetation",
            "color": "#7A728F"
        },
        70: {
            "label": "Snow and ice",
            "color": "#cbdff6"
        },
        80: {
            "label": "Permanent water",
            "color": "#4a82b7"
        },
        90: {
            "label": "Herbaceous wetland",
            "color": "#2C7A7B"
        },
        95: {
            "label": "Mangroves",
            "color": "#2FBF9B"
        },
        100: {
            "label": "Moss and lichen",
            "color": "#8F87D6"
        }
    }

    histogram = reference_img.reduceRegion(
        reducer=ee.Reducer.frequencyHistogram(),
        geometry=roi,
        scale=scale,
        bestEffort=True
    ).getInfo()

    pixel_counts = histogram.get('Map', {})
    total_pixels = sum(pixel_counts.values())
    if total_pixels == 0: return {}
    
    results = {}
    for k, v in pixel_counts.items():
        class_id = int(k)
        if class_id not in class_info:
            continue

        results[class_info[class_id]["label"]] = {
            "percent": round(v / total_pixels * 100, 2),
            "color": class_info[class_id]["color"]
        }

    return results
