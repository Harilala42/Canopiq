from uuid import UUID
from enum import Enum
from typing_extensions import TypedDict, NotRequired
from app.llm.agent.schemas import GeoSpatialQuery

class PipelineStage(str, Enum):
    JOB_QUEUED    = "queued"
    LLM_EXTRACT   = "analyzing_prompt"
    GEE_COMPUTE   = "computing_gee"
    LLM_REPORT    = "generating_report"
    JOB_COMPLETED = "completed"
    JOB_FAILED    = "failed"
    JOB_ABORTED   = "canceled"

class CanopiqState(TypedDict):
    # Inputs by FastAPI before invoking
    user_prompt: str
    recent_context: list

    # Extracted GIS parameters from query
    geo_params: NotRequired[GeoSpatialQuery]

    # GEE computation results
    geo_analysis_id: NotRequired[UUID]

    # Final generated environmental report
    report: NotRequired[str]

    recovery_reply: NotRequired[str]       # recovery message in case of failure
    pipeline_stage: NotRequired[PipelineStage]
