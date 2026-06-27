from uuid import UUID
from typing import Annotated, Optional
from typing_extensions import TypedDict
from app.llm.agent.schemas import GeoSpatialQuery

class CanopiqState(TypedDict):
    # Inputs by FastAPI before invoking
    user_prompt: str
    recent_context: list

    # Extracted GIS paramerters from query
    geo_params: Optional[GeoSpatialQuery]

    # GEE computation results
    geo_analysis_id: Optional[UUID]
    gee_error: Optional[str]

    # Final generated envrionmental report
    report: Optional[str]

    # recovery output in case of failure
    recovery_reply:  Optional[str]
