import httpx
from typing import List
from app.llm.schemas import GeoSpatialQuery
from langchain.tools import tool

@tool
def search_location(location: str) -> GeoSpatialQuery:
	"""Search the geographic coordinates (latitude and longitude) for a given location"""

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
