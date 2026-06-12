from app.dependencies import get_supabase as supabase
from app.gee.utils import compute_global_average, compute_yearly_average, compute_total_change_percent

def get_geo_analysis(geo_analysis_id: str, user_id: str):
    client = supabase()

    response = client.table("geo_analysis") \
        .select("*") \
        .eq("id", geo_analysis_id) \
        .eq("user_id", str(user_id)) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def get_h3_grid_map(h3_grid_map_id: str, user_id: str):
    client = supabase()
    
    response = client.table("h3_grid_maps") \
        .select("hex_geojson, legend") \
        .eq("id", h3_grid_map_id) \
        .eq("user_id", user_id) \
        .maybe_single() \
        .execute()
    
    return response.data if response and response.data else None

def save_geo_analysis(query: dict, gis_analysis: dict, user_id: str, job_id: str):
    client = supabase()
    
    b = query['bbox']
    wkt_boundary = f"POLYGON(({b[0]} {b[1]}, {b[2]} {b[1]}, {b[2]} {b[3]}, {b[0]} {b[3]}, {b[0]} {b[1]}))"
    wkt_center = f"POINT({query['longitude']} {query['latitude']})"
     
    global_average = compute_global_average(gis_analysis["time_series"])
    yearly_average = compute_yearly_average(gis_analysis["time_series"])
    total_change_percent = compute_total_change_percent(yearly_average)

    carbon_density_metadata = {
        "legend": "Biomass Carbon Density",
        "description": "Estimated above-ground carbon biomass",
        "source": "WCMC/biomass_carbon_density/v1_0",
        "unit": "tC/ha"
    }

    tree_cover_metadata = {
        "legend": "Percent Tree Cover",
        "description": "Fraction of land covered by tree canopy",
        "source": "MODIS/061/MOD44B",
        "unit": "%"
    }

    land_cover_metadata = {
        "legend": "Land Cover Distribution",
        "description": "Global land cover map representing surface cover categories such as forest, shrubland, cropland, urban areas, water bodies, and bare land",
        "source": "ESA/WorldCover/v200",
        "unit": "%"
    }

    h3_grid_map = save_h3_grid_map(
        hex_geojson=gis_analysis["hex_geojson"],
        legend=gis_analysis["legend"],
        user_id=user_id,
        job_id=job_id
    )
    
    response = client.table("geo_analysis") \
        .upsert({
            "job_id": job_id,
            "user_id": user_id,
            "h3_grid_map_id": h3_grid_map[0]["id"],
            "location": query['location'],
            "dataset": query['data_set'],
            "start_year": query["start_time"].isoformat(),
            "end_year": query["end_time"].isoformat(),
            "boundary": wkt_boundary,
            "coordinates": wkt_center,
            "analytics": {
                "stats": {
                    "global_average": global_average,
                    "area_coverage_ha": gis_analysis["area_ha"],
                    "total_change_percent": total_change_percent
                },
                "insights": {
                    "time_series": yearly_average,
                    "metadata": (
                        carbon_density_metadata 
                        if query['data_set'] == "carbon_density" 
                        else tree_cover_metadata
                    )
                },
                "land_cover": {
                    "distribution": gis_analysis["land_cover"],
                    "metadata": land_cover_metadata
                }
            }
        }, on_conflict="job_id") \
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
