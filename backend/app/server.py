import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.auth.router import router as auth_router, public_router
from app.geo_analysis.router import router as geo_analysis_router
from app.chat.router import router as chat_router
from app.job.router import router as job_router

app = FastAPI(
    title="Canopiq",
    description="Collaborative GeoSpatial AI Agent 🛰️ for Carbon Sequestration Estimation 🌱",
    version="1.0.0"
)

# Health Check Endpoint
@app.get("/health", tags=["system"])
def health_check():
    return {"status": "ok", "message": "Canopiq service is running"}

origins = [
    os.getenv("FRONDEND_URL")
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
app.include_router(job_router, prefix="/api/v1", tags=["job"])

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
