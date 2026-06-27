from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import InMemorySaver 
from app.llm.graph.state import CanopiqState
from app.llm.graph.nodes import (
    extract_params_node,
    run_gee_computation_node,
    generate_report_node,
    gee_recovery_node
)

builder = StateGraph(CanopiqState)

builder.add_node("extract_params", extract_params_node)
builder.add_node("run_gee_computation", run_gee_computation_node)
builder.add_node("generate_report", generate_report_node)
builder.add_node("gee_recovery", gee_recovery_node)

builder.add_edge(START, "extract_params")
builder.add_edge("extract_params", "run_gee_computation")

def route_after_gee(state: CanopiqState) -> str:
    if not state.get("gee_error"):
        return "success"
    return "failure"

builder.add_conditional_edges("run_gee_computation", route_after_gee, {
    "success": "generate_report",
    "failure": "gee_recovery"
})

builder.add_edge("generate_report", END)
builder.add_edge("gee_recovery", END)

checkpointer = InMemorySaver()      # Set graph with short-term memory
graph = builder.compile(checkpointer=checkpointer)
