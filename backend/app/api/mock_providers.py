import os
import asyncio
import random
from fastapi import APIRouter, HTTPException, Query, Response
from fastapi.responses import JSONResponse, HTMLResponse, FileResponse, PlainTextResponse
from ..config import settings

router = APIRouter(prefix="/api/mock", tags=["Mock Insurance Providers"])

@router.get("/provider-a/quotes")
async def get_provider_a():
    """Serves Provider A quote API JSON response."""
    file_path = os.path.join(settings.DATA_DIR, "provider_a.json")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="provider_a.json not found")
    with open(file_path, "r", encoding="utf-8") as f:
        import json
        data = json.load(f)
    return JSONResponse(content=data)

@router.get("/provider-b/quotes")
async def get_provider_b(delay: float = Query(None, description="Custom simulated delay in seconds")):
    """
    Serves Provider B quotes HTML page.
    Simulates a SLOW provider with latency (1.2 - 2.0s).
    """
    latency = delay if delay is not None else settings.PROVIDER_B_LATENCY_SECONDS
    if latency > 0:
        await asyncio.sleep(latency)
        
    file_path = os.path.join(settings.DATA_DIR, "provider_b.html")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="provider_b.html not found")
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()
    return HTMLResponse(content=html)

@router.get("/provider-c/ratecard")
async def get_provider_c():
    """Serves Provider C Rate Card PDF."""
    file_path = os.path.join(settings.DATA_DIR, "provider_c.pdf")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="provider_c.pdf not found")
    return FileResponse(file_path, media_type="application/pdf", filename="provider_c_ratecard.pdf")

@router.get("/provider-d/quotes")
async def get_provider_d(
    fail: bool = Query(False, description="Explicitly trigger 503 simulation for testing fault tolerance")
):
    """
    Serves Provider D quotes CSV export.
    Simulates INTERMITTENT FAILURE (503 Service Unavailable).
    """
    if fail or (settings.PROVIDER_D_FAILURE_RATE > 0 and random.random() < settings.PROVIDER_D_FAILURE_RATE):
        raise HTTPException(
            status_code=503,
            detail="Provider D Gateway Timeout: Service temporarily unavailable. Please retry."
        )
        
    file_path = os.path.join(settings.DATA_DIR, "provider_d.csv")
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="provider_d.csv not found")
    with open(file_path, "r", encoding="utf-8") as f:
        csv_text = f.read()
    return PlainTextResponse(content=csv_text, media_type="text/csv")
