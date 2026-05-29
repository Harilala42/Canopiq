import os
import ee
import h3
import geopandas as gpd
from shapely.geometry import Polygon
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
    dataset_type="tree_cover"
):
    roi = ee.Geometry.Rectangle(bbox)
    
    sen2_col, median_ndvi = get_sentinel_ndvi(roi, start_time, end_time)
    reference_img, palette = get_dataset_col(dataset_type, start_time, end_time, roi)

    fit_stats = median_ndvi.addBands(reference_img).reduceRegion(
        reducer=ee.Reducer.linearFit(),
        geometry=roi,
        scale=250,
        bestEffort=True
    )
    scale = ee.Number(fit_stats.get('scale'))
    offset = ee.Number(fit_stats.get('offset'))

    predicted_img = median_ndvi.multiply(scale).add(offset).updateMask(median_ndvi.gt(0)).rename('biomass')
    vmin, vmax, points_gdf = extract_gee_image_to_points(predicted_img, roi, palette)
    final_hex_gdf = aggregate_points_to_h3_grid(points_gdf)

    processed_ts = compute_time_series(sen2_col, roi, scale, offset, start_time, end_time)
    land_cover_percent = compute_landcover_composition(roi)
    
    legend_data = generate_legend_intervals(vmin, vmax, palette)
    area_ha = roi.area().divide(10000).getInfo()

    return {
        "hex_geojson": final_hex_gdf.__geo_interface__,
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
        palette = ['#ffffff', '#afce56', '#196e0c']
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

def extract_gee_image_to_points(
    predicted_img,
    roi, 
    palette,
    scale=250
):
    """
    Computes local min/max statistics for an image over an ROI, applies a cloud-baked
    color visualization palette, samples the pixels as points, and exports them 
    directly into a native GeoPandas GeoDataFrame.
    """
    local_stats = predicted_img.reduceRegion(
        reducer=ee.Reducer.minMax(),
        geometry=roi,
        scale=scale,
        bestEffort=True
    ).getInfo()

    band_name = predicted_img.bandNames().get(0).getInfo()
    vmin = round(local_stats.get(f'{band_name}_min', 0), 2)
    vmax = round(local_stats.get(f'{band_name}_max', 100), 2)

    visualized_img = predicted_img.visualize(
        min=vmin,
        max=vmax,
        palette=palette
    )

    export_img = predicted_img.addBands(visualized_img)

    pixel_samples = export_img.sampleRegions(
        collection=ee.FeatureCollection([ee.Feature(roi)]),
        scale=scale,
        geometries=True
    )

    points_gdf = ee.data.computeFeatures({
        'expression': pixel_samples,
        'fileFormat': 'GEOPANDAS_GEODATAFRAME'
    })
    points_gdf.crs = 'EPSG:4326'

    return vmin, vmax, points_gdf

def aggregate_points_to_h3_grid(points_gdf, h3_resolution=8):
    """
    Takes a GeoPandas GeoDataFrame of points containing 'biomass', 'vis-red', 
    'vis-green', and 'vis-blue' bands. Maps them to an H3 grid, averages the metrics, 
    and returns a clean, vector-ready GeoDataFrame.
    """
    if points_gdf.empty:
        return gpd.GeoDataFrame()
    
    def convert_rgb_to_hex(row, rc='vis-red', gc='vis-green', bc='vis-blue'):
        return '#{:02x}{:02x}{:02x}'.format(
            int(row[rc]), 
            int(row[gc]), 
            int(row[bc])
        )

    points_gdf['color'] = points_gdf.apply(
        lambda r: convert_rgb_to_hex(r), 
        axis=1
    )

    points_gdf['hex_id'] = points_gdf.geometry.apply(
        lambda geom: h3.latlng_to_cell(geom.y, geom.x, h3_resolution)
    )

    hex_summary = points_gdf.groupby('hex_id').agg({
        'biomass': 'mean',
        'color': 'first'
    }).reset_index()

    def cell_to_shapely_polygon(hex_str):
        boundary = h3.cell_to_boundary(hex_str)
        flipped_boundary = [(lon, lat) for lat, lon in boundary]
        return Polygon(flipped_boundary)

    hex_summary['geometry'] = hex_summary['hex_id'].apply(cell_to_shapely_polygon)
    
    return gpd.GeoDataFrame(hex_summary, geometry='geometry', crs="EPSG:4326")

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
