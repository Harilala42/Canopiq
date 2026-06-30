import asyncio
import app.chat.models as chat
import app.llm.agent.agents as llm
from app.job.models import update_job_progress
from app.geo_analysis.services import GEEDataset
from app.llm.graph.state import CanopiqState, PipelineStage
from app.geo_analysis.models import save_geo_analysis
from langchain_core.runnables import RunnableConfig
from langgraph.errors import NodeError
from langgraph.types import Command
from langgraph.graph import END

# ── Node 1: parses GIS parameters from user's prompt ──────────────
async def extract_params_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], PipelineStage.LLM_EXTRACT.value)

    query = await asyncio.to_thread(
        llm.extract_geospatial_params,
        prompt=state["user_prompt"],
        recent_context=state["recent_context"],
    )

    return {
        "geo_params": query,
        "pipeline_stage": PipelineStage.LLM_EXTRACT
    }


# ── Node 2: runs heavy-lifting GEE computation in background ─────────────
async def run_gee_computation_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], PipelineStage.GEE_COMPUTE.value)

    query = state["geo_params"]
    dataset = GEEDataset(query["dataset"])

    gis_analysis = await asyncio.to_thread(dataset.execute, query)

    saved = save_geo_analysis(
        query=query,
        gis_analysis=gis_analysis,
        user_id=cfg["user_id"],
        chat_id=cfg["chat_id"],
        job_id=cfg["job_id"]
    )

    return {
        "geo_analysis_id": saved[0]["id"],
        "pipeline_stage": PipelineStage.GEE_COMPUTE
    }


# ── Node 3: generates final mardown environmental report ───
async def generate_report_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], PipelineStage.LLM_REPORT.value)

    report = await asyncio.to_thread(
        llm.generate_environmental_report,
        geo_analysis_id=state["geo_analysis_id"],
        recent_context=state["recent_context"]
    )

    chat.rename_chat(cfg["chat_id"], cfg["user_id"], report["title"])
    chat.save_chat_message(cfg["chat_id"], cfg["user_id"], "model", report["report_markdown"])
    update_job_progress(cfg["job_id"], cfg["user_id"], "completed")

    return { 
        "report": report,
        "pipeline_stage": PipelineStage.LLM_REPORT
    }


# ── Handler Error Recorery: Gemini writes a friendly GEE failure message ──
def handle_error_recovery(state: CanopiqState, config: RunnableConfig, error: NodeError) -> Command:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], "failed", str(error.error))

    query = state.get("geo_params", {})
    stage = state.get("pipeline_stage", PipelineStage.LLM_EXTRACT)

    prompt_templates = {
        PipelineStage.LLM_EXTRACT: f"""
            The AI failed to understand or process the user's geospatial request.
            Write a short, friendly message asking the user to rephrase their request.
            Technical reason: {error.error}
        """,
        
        PipelineStage.GEE_COMPUTE: f"""
            A satellite data request failed after multiple retries.
            Craft an environmental analysis recovery response based on these attributes:
            
            Location: {query["location"]}
            Dataset: {query["dataset"]}
            Period: {query["start_time"]} → {query["end_time"]}
            Technical reason: {str(error.error)}
        """,
        
        PipelineStage.LLM_REPORT: f"""
            The AI successfully retrieved satellite data but failed to generate
            the final environmental report due to a technical error.

            The geo analysis ID is: {state["geo_analysis_id"]}
            Location: {query["location"]}
            Dataset: {query["dataset"]}
            Period: {query["start_time"]} → {query["end_time"]}
            Technical reason: {error.error}

            Write a short, friendly message informing the user that their satellite
            data was retrieved successfully, but the report could not be generated.
            Encourage them to retry later.
        """
    }

    recovery_prompt = prompt_templates.get(stage)

    reply = llm.generate_conversational_reply(
        prompt=recovery_prompt,
        mode="error",
        recent_context=state["recent_context"]
    )

    chat.save_chat_message(cfg["chat_id"], cfg["user_id"], "model", reply)
    return Command(update={"recovery_reply": reply}, goto=END)
