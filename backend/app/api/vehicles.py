from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..schemas import VehicleModel, VehicleUpdateRequest
from ..services.vehicle_service import vehicle_service, normalize_reg_no

router = APIRouter(prefix="/api/vehicles", tags=["Vehicles"])

@router.get("/{reg_no}", response_model=VehicleModel)
def get_vehicle(reg_no: str, db: Session = Depends(get_db)):
    clean_reg = normalize_reg_no(reg_no)
    if not clean_reg:
        raise HTTPException(status_code=400, detail="Invalid registration number format.")
        
    vehicle = vehicle_service.lookup(clean_reg, db=db)
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found in registry.")
    return vehicle

@router.post("/update", response_model=VehicleModel)
def update_vehicle(payload: VehicleUpdateRequest, db: Session = Depends(get_db)):
    clean_reg = normalize_reg_no(payload.registration_number)
    if not clean_reg:
        raise HTTPException(status_code=400, detail="Invalid registration number.")
        
    vehicle_model = VehicleModel(
        registration_number=clean_reg,
        make=payload.make,
        model=payload.model,
        variant=payload.variant or "Standard",
        fuel_type=payload.fuel_type or "Petrol",
        engine_cc=payload.engine_cc or 1197,
        registration_date=payload.registration_date,
        rto=payload.rto or "RTO",
        ex_showroom_price=payload.ex_showroom_price or 600000,
        current_policy_expiry=payload.current_policy_expiry,
        claims_last_year=payload.claims_last_year,
        ncb_percent=payload.ncb_percent,
        is_registered=True
    )
    vehicle_service.save_override(vehicle_model, db=db)
    return vehicle_service.lookup(clean_reg, db=db)
