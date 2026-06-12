from pydantic import BaseModel, UUID4

class GeoAnalysisMapRequest(BaseModel):
    h3_grid_map_id: UUID4
