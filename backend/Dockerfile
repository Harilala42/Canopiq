# ============================================================
# Stage 1: Common base
# ============================================================

FROM python:3.11-slim AS base

WORKDIR /app

RUN --mount=type=cache,target=/var/lib/apt/lists,sharing=locked \
    --mount=type=cache,target=/var/cache/apt,sharing=locked \
    apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_CACHE_DIR=/root/.cache/uv

RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"

COPY requirements.txt .
RUN --mount=type=cache,target=/root/.cache/uv \
    uv pip install -r requirements.txt


# ============================================================
# Stage 2: Worker Service
# ============================================================
FROM base AS worker

COPY . .

CMD ["celery", "-A", "app.worker.celery_app", "worker"]


# ============================================================
# Stage 3: API Service
# ============================================================
FROM base AS api

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.server:app", "--host", "0.0.0.0", "--port", "8000"]
