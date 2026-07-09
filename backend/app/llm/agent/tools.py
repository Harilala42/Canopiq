import httpx
from typing import List, Dict, Any
from app.dependencies import get_supabase
from langchain.tools import tool

@tool
def search_location(location: str) -> dict:
	"""
	Search the geographic coordinates (latitude and longitude) for a given location
	"""

	url = "https://nominatim.openstreetmap.org/search"
	params = { 
		"q": location, 
		"format": "geojson",
		"limit": 1
	}

	headers = {'User-Agent': 'Canopiq/1.0 (https://github.com/Harilala42/Canopiq)'}

	with httpx.Client() as client:
		response = client.get(url, params=params, headers=headers, timeout=10.0)
		response.raise_for_status()
		data = response.json()
		
	if not data["features"]:
		raise ValueError("Location not found")

	feature = data["features"][0]
	bbox: List[float] = feature["bbox"]
	lon, lat = feature["geometry"]["coordinates"]
	name: str = feature["properties"]["display_name"]

	return {
		"location": name,
		"latitude": lat,
		"longitude": lon,
		"bbox": bbox
	}


@tool
def normalizeGeoAnalysisData(geo_analysis_id: str) -> Dict[str, Any]:
    """
    Retrieve a geo analysis entry from Supabase and normalize
    the raw GEE analytics data into a compact AI-friendly structure.
    """
    try:
        client = get_supabase()
        response = client.table("geo_analysis") \
            .select("*") \
            .eq("id", geo_analysis_id) \
            .single() \
            .execute()
        data = response.data
        if not data:
            raise Exception("Geo analysis not found.")

        analytics = data.get("analytics") or {}
        stats = analytics.get("stats") or {}
        metadata = analytics.get("metadata") or {}
        insights = analytics.get("insights") or []
        kind = metadata.get("kind")  # "categorical" | "time_series"

        start_time = data.get("start_time")
        end_time = data.get("end_time")
        period = (
            f"{start_time[:4]}-{end_time[:4]}"
            if start_time and end_time
            else None
        )

        area_ha = stats.get("area_coverage_ha")
        area_coverage_km2 = round(area_ha / 100)

        result = {
            "location": data.get("location"),
            "dataset": data.get("dataset") or metadata.get("type"),
            "period": period,
            "unit": metadata.get("unit"),
            "total_change_percent": stats.get("total_change_percent"),
            "global_average": stats.get("global_average"),
            "area_coverage_km2": area_coverage_km2,
        }

        if kind == "categorical":
            dominant_classes = sorted(
                [
                    {
                        "biome": item.get("category"),
                        "percent_area": item.get("value", 0),
                    }
                    for item in insights
                ],
                key=lambda item: item["percent_area"],
                reverse=True,
            )[:3]
            result["land_use_classes"] = dominant_classes
        elif kind == "time_series":
            values = [item.get("value") for item in insights if item.get("value") is not None]
            result["latest_value"] = insights[-1].get("value") if insights else None
            result["peak_value"] = max(values) if values else None

        return result
    except Exception as err:
        print(f"Failed to normalize geo analysis data: {str(err)}")
        raise
