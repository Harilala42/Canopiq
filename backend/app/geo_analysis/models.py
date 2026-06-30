from shapely.geometry import box, Point
from app.dependencies import get_supabase as supabase
from app.geo_analysis.utils import compute_global_average, compute_yearly_average, compute_total_change_percent

def get_h3_grid_map(h3_grid_map_id: str, user_id: str):
    client = supabase()
    
    response = client.table("h3_grid_maps") \
        .select("hex_geojson, legend") \
        .eq("id", h3_grid_map_id) \
        .eq("user_id", user_id) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def save_h3_grid_map(hex_geojson: dict, legend: list, job_id: str, user_id: str):
    client = supabase()

    response = client.table("h3_grid_maps") \
        .upsert({
            "job_id": job_id,
            "user_id": user_id,
            "hex_geojson": hex_geojson,
            "legend": legend
        }, on_conflict="job_id") \
        .execute()

    return response.data if response and response.data else None

def get_geo_analysis(chat_id: str, user_id: str):
    client = supabase()

    response = client.table("geo_analysis") \
        .select("*") \
        .eq("chat_id", str(chat_id)) \
        .eq("user_id", str(user_id)) \
        .order("created_at", desc=True) \
        .execute()
    
    return response.data if response and response.data else []

def save_geo_analysis(query: dict, gis_analysis: dict, user_id: str, chat_id: str, job_id: str):
    client = supabase()
    
    b = query['bbox']
    boundary = box(b[0], b[1], b[2], b[3]).wkt
    center = Point(query['longitude'], query['latitude']).wkt

    DATASET_META = {
        "carbon_density": {
            "legend": "Biomass Carbon Density",
            "description": "Estimated above-ground carbon biomass",
            "source": "WCMC Biomass Carbon Density",
            "type": "carbon_density",
            "kind": "time_series",
            "unit": "tC/ha",
        },
        "tree_cover": {
            "legend": "Percent Tree Cover",
            "description": "Fraction of land covered by tree canopy",
            "source": "MOD44B Version 6.1 Vegetation Continuous Fields",
            "type": "tree_cover",
            "kind": "time_series",
            "unit": "%",
        },
        "land_use_distribution": {
            "legend": "Land-Use Distribution",
            "description": (
                "Global land cover map representing surface cover categories "
                "such as forest, shrubland, cropland, urban areas, water "
                "bodies, and bare land"
            ),
            "source": "ESA WorldCover",
            "type": "land_use_distribution",
            "kind": "categorical",
            "unit": "%",
        }
    }

    def _build_time_series_payload(gis_analysis: dict, meta: dict) -> dict:
        """For tree_cover / carbon_density: yearly TimeSeriesData[] + scalar stats."""
        global_average = compute_global_average(gis_analysis["time_series"])
        yearly_average = compute_yearly_average(gis_analysis["time_series"])
        total_change_percent = compute_total_change_percent(yearly_average)

        return {
            "stats": {
                "global_average": global_average,
                "area_coverage_ha": gis_analysis["area_ha"],
                "total_change_percent": total_change_percent,
            },
            "metadata": meta,
            "insights": yearly_average,
        }
    
    def _build_categorical_payload(gis_analysis: dict, meta: dict) -> dict:
        """For land_use_distribution: BiomeData[] + area only (no time-series stats)."""
        land_use = gis_analysis["land_use"]  # {label: {value, color}}

        biome_data = [
            {"category": label, "value": stats["value"], "color": stats["color"]}
            for label, stats in land_use.items()
        ]

        return {
            "stats": {
                "global_average": None,
                "area_coverage_ha": gis_analysis["area_ha"],
                "total_change_percent": None,
            },
            "metadata": meta,
            "insights": biome_data,
        }

    meta = DATASET_META.get(query['dataset'])
    if meta["kind"] == "time_series":
        payload = _build_time_series_payload(gis_analysis, meta)
    else:
        payload = _build_categorical_payload(gis_analysis, meta)

    h3_grid_map = save_h3_grid_map(
        hex_geojson=gis_analysis["hex_geojson"],
        legend=gis_analysis["legend"],
        user_id=user_id,
        job_id=job_id
    )

    def _iso_or_none(value):
        if value is None:
            return None
        return value if isinstance(value, str) else value.isoformat()
    
    response = client.table("geo_analysis") \
        .upsert({
            "job_id": job_id,
            "user_id": user_id,
            "chat_id": chat_id,
            "h3_grid_map_id": h3_grid_map[0]["id"],
            "location": query['location'],
            "dataset": query['dataset'],
            "start_year": _iso_or_none(query.get("start_time")),
            "end_year": _iso_or_none(query.get("end_time")),
            "boundary": boundary,
            "coordinates": center,
            "analytics": payload
        }, on_conflict="job_id") \
        .execute()

    return response.data if response and response.data else None
