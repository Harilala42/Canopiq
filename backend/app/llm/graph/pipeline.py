import httpx
from datetime import timedelta
from langgraph.graph import StateGraph, START, END
from langgraph.types import RetryPolicy, default_retry_on
from app.llm.graph.state import CanopiqState
from app.llm.graph.nodes import (
    extract_params_node,
    run_gee_computation_node,
    generate_report_node,
    handle_error_recovery
)

builder = StateGraph(CanopiqState)

RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}

def llm_retry_on(exc: BaseException) -> bool:
    # 1. httpx HTTP status errors — only retry transient codes
    if isinstance(exc, httpx.HTTPStatusError):
        return exc.response.status_code in RETRYABLE_STATUS_CODES

    # 2. httpx network-level errors
    if isinstance(exc, (
        httpx.ConnectError,
        httpx.ConnectTimeout,
        httpx.ReadTimeout,
        httpx.WriteTimeout,
        httpx.PoolTimeout,
        httpx.RemoteProtocolError,
        httpx.NetworkError,
    )):
        return True

    return default_retry_on(exc)

LLM_RETRY_POLICY = RetryPolicy(
    max_attempts=3,
    initial_interval=1.0,   
    backoff_factor=2.0,     # Retry with exponential backoff
    max_interval=10.0,      
    jitter=True,
    retry_on=llm_retry_on
)

GEE_RETRY_POLICY = RetryPolicy(
    max_attempts=3,
    initial_interval=5.0,   # Give GEE more breathing room before retrying
    backoff_factor=2.0,     # Retry with exponential backoff
    max_interval=30.0,      
    jitter=True
)

builder.add_node(
    "extract_params", 
    extract_params_node, 
    timeout=15,
    retry_policy=LLM_RETRY_POLICY,
    error_handler=handle_error_recovery
)
builder.add_node(
    "run_gee_computation",
    run_gee_computation_node,
    timeout=timedelta(minutes=3),
    retry_policy=GEE_RETRY_POLICY,
    error_handler=handle_error_recovery
)
builder.add_node(
    "generate_report", 
    generate_report_node, 
    timeout=30,
    retry_policy=LLM_RETRY_POLICY,
    error_handler=handle_error_recovery
)

builder.add_edge(START, "extract_params")
builder.add_edge("extract_params", "run_gee_computation")
builder.add_edge("run_gee_computation", "generate_report")
builder.add_edge("generate_report", END)

graph = builder.compile()
