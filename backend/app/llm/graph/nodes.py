import json
import app.gee.tasks as gee
import app.chat.models as chat
import app.llm.agent.agents as llm
from app.llm.graph.state import CanopiqState
from app.job.models import update_job_progress
from app.geo_analysis.models import save_geo_analysis
from langchain_core.runnables import RunnableConfig
from langgraph.types import interrupt

# ── Node 1: parses GIS parameters from user's prompt ──────────────
def extract_params_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], "analyzing_prompt")

    query = llm.extract_geospatial_params(
        prompt=state["user_prompt"],
        recent_context=state["recent_context"]
    )
    return { "geo_params": query }


# ── Node 2: runs heavy-lifting GEE computation in background ─────────────
def run_gee_computation_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], "computing_gee")

    query = state["geo_params"]
    sanitized_query = json.loads(json.dumps(query, default=str))
    sanitized_cfg = json.loads(json.dumps(cfg, default=str))

    gee.compute_gis_dataset.delay(sanitized_query, sanitized_cfg)
    result = interrupt("awaiting_gee")

    if result.get("gee_error"):
        return { "gee_error": result["gee_error"] }

    return {
        "geo_analysis_id": result["geo_analysis_id"],
        "gee_error": None
    }

# ── Node 3: generates final mardown environmental report ───
def generate_report_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], "generating_report")

    report = llm.generate_environmental_report(
        geo_analysis_id=state["geo_analysis_id"],
        recent_context=state["recent_context"]
    )

    chat.rename_chat(cfg["chat_id"], cfg["user_id"], report["title"])
    chat.save_chat_message(cfg["chat_id"], cfg["user_id"], "model", report["report_markdown"])
    update_job_progress(cfg["job_id"], cfg["user_id"], "completed")

    return { "report": report }


# ── Node 4: Gemini writes a friendly GEE failure message ──
def gee_recovery_node(state: CanopiqState, config: RunnableConfig) -> CanopiqState:
    cfg = config.get("configurable", {})
    update_job_progress(cfg["job_id"], cfg["user_id"], "failed", state["gee_error"])

    recovery_prompt = f"""
        A satellite data request failed after multiple retries.
        Craft an environmental analysis recovery response based on these attributes:
        
        Location: {state["geo_params"].get("location")}
        Dataset: {state["geo_params"].get("data_set")}
        Period: {state["geo_params"].get("start_time")} → {state["geo_params"].get("end_time")}
        Technical reason: {state["gee_error"]}
    """

    reply = llm.generate_conversational_reply(
        prompt=recovery_prompt,
        mode="error",
        recent_context=state["recent_context"]
    )

    chat.save_chat_message(cfg["chat_id"], cfg["user_id"], "model", reply)

    return { "recovery_reply": reply }
