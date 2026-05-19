from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router, public_router
from app.geo_analysis.router import router as geo_analysis_router
from app.chat.router import router as chat_router

app = FastAPI(
    title="Canopiq",
    description="Collaborative GeoSpatial AI Agent 🛰️ for Carbon Sequestration Estimation 🌱",
    version="1.0.0"
)

origins = [
    "http://localhost:3000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allow_headers=["Content-Type", "Authorization"]
)

app.include_router(public_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1", tags=["auth"])
app.include_router(chat_router, prefix="/api/v1", tags=["chat"])
app.include_router(geo_analysis_router, prefix="/api/v1", tags=["geo-analysis"])
