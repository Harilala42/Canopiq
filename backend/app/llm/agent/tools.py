import httpx
from typing import List, Dict, Any
from app.llm.agent.schemas import GeoSpatialQuery
from app.dependencies import get_supabase as supabase
from langchain.tools import tool

@tool
def search_location(location: str) -> GeoSpatialQuery:
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

	return GeoSpatialQuery(
		location=name,
		latitude=lat,
		longitude=lon,
		bbox=bbox,
		start_time=None,
		end_time=None,
		data_set = None
	)

@tool
def normalizeGeoAnalysisData(geo_analysis_id: str) -> Dict[str, Any]:
	"""
	Retrieve a geo analysis entry from Supabase and normalize
	the raw GEE analytics data into a compact AI-friendly structure.
	"""

	try:
		client = supabase()

		response = client.table("geo_analysis") \
			.select("*") \
			.eq("id", geo_analysis_id) \
			.single() \
			.execute()

		data = response.data
		if not data: raise Exception("Geo analysis not found.")

		analytics = data.get("analytics", {})
		stats = analytics.get("stats", {})
		insights = analytics.get("insights", {})
		land_use = analytics.get("land_use", {})

		time_series = insights.get("time_series", [])
		latest_value = None
		peak_value = None

		if time_series:
			latest_value = time_series[-1].get("value")

			peak_value = max(
				item.get("value", 0)
				for item in time_series
			)

		distribution = land_use.get("distribution", {})

		dominant_land_use: List[Dict[str, Any]] = sorted(
			[
				{
					"biome": category,
					"percent_area": values.get("percent", 0)
				}
				for category, values in distribution.items()
			],
			key=lambda item: item["percent"],
			reverse=True
		)[:3]

		return {
			"location": data.get("location"),
			"dataset": data.get("dataset"),
			"period": (
				f"{data.get('start_year', '')[:4]}-"
				f"{data.get('end_year', '')[:4]}"
			),
			"unit": insights.get("unit"),
			"total_change_percent": stats.get("total_change_percent"),
			"global_average": stats.get("global_average"),
			"area_coverage_km2": round(stats.get("area_coverage_ha") / 100),
			"land_use_classes": dominant_land_use,
			"latest_value": latest_value,
			"peak_value": peak_value
		}
	except Exception as err:
		print(f"Failed to normalize geo analysis data: {str(err)}")
		raise
