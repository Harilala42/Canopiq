from pydantic import BaseModel, UUID4

class GeoAnalysisMapRequest(BaseModel):
    geo_analysis_id: UUID4
