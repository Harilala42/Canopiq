from pydantic import BaseModel, Field, field_validator, model_validator
from typing import List, Literal, Optional
from datetime import date

class GeoSpatialQuery(BaseModel): 
	"""Query for GIS data of a location."""

	location: str = Field(description="Short description for the location.")
	data_set: Literal["carbon_density", "tree_cover"] | None = Field(description="Dataset to query for the analysis intent ('carbon_density' or 'tree_cover').")
	latitude: float = Field(ge=-90, le=90, description="Latitude of the target location in decimal degrees (WGS84). Must be between -90 (south) and 90 (north).") 
	longitude: float = Field(ge=-180, le=180, description="Longitude of the target location in decimal degrees (WGS84). Must be between -180 (west) and 180 (east).") 
	bbox: list[float] = Field(description="Bounding box coordinates [min_lon, min_lat, max_lon, max_lat].")
	start_time: date | None = Field(description="Start time for the data range.")
	end_time: date | None = Field(description="End time for the data range.")

	@field_validator('bbox') 
	@classmethod 
	def validate_bbox_logic(cls, val: List[float]) -> List[float]: 
		min_lon, min_lat, max_lon, max_lat = val 
		
		if not (-180 <= min_lon <= 180 and -180 <= max_lon <= 180): 
			raise ValueError("Bounding box longitudes must be between -180 and 180") 
		if not (-90 <= min_lat <= 90 and -90 <= max_lat <= 90): 
			raise ValueError("Bounding box latitudes must be between -90 and 90") 
		
		if min_lon >= max_lon: 
			raise ValueError("min_longitude must be less than max_longitude") 
		if min_lat >= max_lat: 
			raise ValueError("min_latitude must be less than max_latitude") 
		
		return val 
	
	@model_validator(mode='after') 
	def check_date_range(self) -> 'GeoSpatialQuery': 
		if self.start_time and self.end_time and self.start_time >= self.end_time: 
			raise ValueError("startTime must be earlier than endTime") 
		return self
