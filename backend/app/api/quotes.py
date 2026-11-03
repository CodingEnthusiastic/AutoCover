from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import QuoteComparisonResponse
from ..services.vehicle_service import vehicle_service, normalize_reg_no
from ..services.aggregator import aggregator
from ..services.glossary import RESEARCH_SOURCES, CANONICAL_GLOSSARY

router = APIRouter(prefix="/api/quotes", tags=["Insurance Quotes"])

@router.get("/compare", response_model=QuoteComparisonResponse)
async def compare_quotes(
    reg: str = Query(..., description="Vehicle registration number"),
    simulate_fail_d: bool = Query(False, description="Simulate provider D 503 outage"),
    db: Session = Depends(get_db)
):
    clean_reg = normalize_reg_no(reg)
    if not clean_reg:
        raise HTTPException(status_code=400, detail="Invalid registration number.")
        
    vehicle = vehicle_service.lookup(clean_reg, db=db)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found in registry.")

    comparison = await aggregator.collect_quotes(vehicle, simulate_fail_d=simulate_fail_d)
    return comparison

@router.get("/glossary")
def get_add_on_glossary():
    """
    Returns the real-world insurer research sources and canonical add-on mapping.
    """
    return {
        "research_sources": RESEARCH_SOURCES,
        "canonical_glossary": CANONICAL_GLOSSARY
    }
