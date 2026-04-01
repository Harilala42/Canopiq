from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router, public_router
from app.llm.router import router as llm_router

app = FastAPI(
    title="Canopiq",
    description="Collaborative GeoSpatial AI Agent 🛰️ for Environmental Research 🌱",
    version="1.0.0"
)

origins = [
    "http://localhost:3000"
]

# CORS Origin Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allow_headers=["Content-Type", "Authorization"]
)

PUBLIC_ROUTES=[
    "/docs",
    "/openapi.json",
    "/api/v1/auth/register",
    "/api/v1/auth/login",
]

app.include_router(public_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(llm_router, prefix="/api/v1", tags=["llm"])
