import json
import random
from datetime import date, datetime, timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..config import settings
from ..database import get_db
from ..models import Policy
from ..schemas import PolicyCreate, PolicyResponse, ReminderResponse
from ..services.vehicle_service import normalize_reg_no, parse_date_flexibly

router = APIRouter(prefix="/api/policies", tags=["Policies"])

def generate_policy_number() -> str:
    rnd = random.randint(1000, 9999)
    return f"AC-2026-{rnd}"

def model_to_response(p: Policy) -> PolicyResponse:
    ref_d = settings.ref_date
    expiry_d = p.expiry_date
    days_to_expiry = (expiry_d - ref_d).days
    
    addons_list = []
    if p.addons:
        try:
            addons_list = json.loads(p.addons)
        except Exception:
            addons_list = [p.addons]
            
    return PolicyResponse(
        id=p.id,
        policy_number=p.policy_number,
        registration_number=p.registration_number,
        customer_name=p.customer_name,
        customer_phone=p.customer_phone,
        provider=p.provider,
        plan_name=p.plan_name,
        coverage_type=p.coverage_type,
        idv=p.idv,
        base_premium=p.base_premium,
        gst_amount=p.gst_amount,
        total_premium=p.total_premium,
        addons=addons_list,
        start_date=p.start_date.isoformat(),
        expiry_date=p.expiry_date.isoformat(),
        make=p.make,
        model=p.model,
        variant=p.variant,
        fuel_type=p.fuel_type,
        days_to_expiry=days_to_expiry,
        is_expiring_soon=(0 <= days_to_expiry <= 15),
        is_expired=(days_to_expiry < 0),
        reminder_sent=p.reminder_sent or False,
        created_at=p.created_at.isoformat() if p.created_at else datetime.utcnow().isoformat()
    )

@router.post("", response_model=PolicyResponse)
def create_policy(payload: PolicyCreate, db: Session = Depends(get_db)):
    clean_reg = normalize_reg_no(payload.registration_number)
    
    # Calculate start and expiry dates (default 1 year policy starting today)
    start_d = parse_date_flexibly(payload.start_date) or settings.ref_date
    expiry_d = parse_date_flexibly(payload.expiry_date) or (start_d + timedelta(days=365))
    
    policy_num = generate_policy_number()
    new_policy = Policy(
        policy_number=policy_num,
        registration_number=clean_reg,
        customer_name=payload.customer_name,
        customer_phone=payload.customer_phone,
        provider=payload.provider,
        plan_name=payload.plan_name,
        coverage_type=payload.coverage_type,
        idv=payload.idv,
        base_premium=payload.base_premium,
        gst_amount=payload.gst_amount,
        total_premium=payload.total_premium,
        addons=json.dumps(payload.addons),
        start_date=start_d,
        expiry_date=expiry_d,
        make=payload.make,
        model=payload.model,
        variant=payload.variant,
        fuel_type=payload.fuel_type,
        reminder_sent=False
    )
    db.add(new_policy)
    db.commit()
    db.refresh(new_policy)
    
    return model_to_response(new_policy)

@router.get("", response_model=List[PolicyResponse])
def get_policies(db: Session = Depends(get_db)):
    policies = db.query(Policy).order_by(Policy.created_at.desc()).all()
    return [model_to_response(p) for p in policies]

@router.get("/expiring-soon", response_model=List[PolicyResponse])
def get_expiring_soon(db: Session = Depends(get_db)):
    ref_d = settings.ref_date
    policies = db.query(Policy).all()
    expiring = []
    for p in policies:
        days = (p.expiry_date - ref_d).days
        if 0 <= days <= 15:
            expiring.append(model_to_response(p))
    return expiring

@router.post("/{policy_id}/send-reminder", response_model=ReminderResponse)
def send_renewal_reminder(policy_id: str, db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.id == policy_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found.")
        
    ref_d = settings.ref_date
    days = (policy.expiry_date - ref_d).days
    
    policy.reminder_sent = True
    db.commit()
    
    msg = (
        f"Mock WhatsApp / SMS Alert sent to {policy.customer_phone}: "
        f"Hi {policy.customer_name}, your car insurance policy {policy.policy_number} for {policy.registration_number} "
        f"expires in {days} days on {policy.expiry_date}. Renew today on AutoCover to protect your NCB!"
    )
    
    return ReminderResponse(
        policy_id=policy.id,
        policy_number=policy.policy_number,
        customer_name=policy.customer_name,
        customer_phone=policy.customer_phone,
        days_remaining=days,
        status="DELIVERED_SIMULATED",
        message=msg
    )
