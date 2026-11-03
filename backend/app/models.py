import uuid
from datetime import datetime, date
from sqlalchemy import Column, String, Integer, Float, Date, DateTime, Boolean, Text
from .database import Base

class Policy(Base):
    __tablename__ = "policies"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    policy_number = Column(String(32), unique=True, nullable=False, index=True)
    registration_number = Column(String(20), nullable=False, index=True)
    customer_name = Column(String(100), nullable=False)
    customer_phone = Column(String(30), nullable=False)
    
    # Provider & Plan Details
    provider = Column(String(50), nullable=False)
    plan_name = Column(String(100), nullable=False)
    coverage_type = Column(String(50), nullable=False)
    idv = Column(Integer, nullable=False)
    base_premium = Column(Float, nullable=False)
    gst_amount = Column(Float, nullable=False)
    total_premium = Column(Float, nullable=False)
    addons = Column(Text, default="[]")  # JSON encoded list of strings
    
    # Policy Validity
    start_date = Column(Date, nullable=False, default=date.today)
    expiry_date = Column(Date, nullable=False)
    
    # Vehicle snapshot
    make = Column(String(50), nullable=True)
    model = Column(String(50), nullable=True)
    variant = Column(String(50), nullable=True)
    fuel_type = Column(String(20), nullable=True)
    
    # Status & Reminders
    reminder_sent = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class VehicleOverride(Base):
    __tablename__ = "vehicle_overrides"

    registration_number = Column(String(20), primary_key=True, index=True)
    make = Column(String(50), nullable=False)
    model = Column(String(50), nullable=False)
    variant = Column(String(50), nullable=True)
    fuel_type = Column(String(20), nullable=True)
    engine_cc = Column(Integer, nullable=True)
    registration_date = Column(String(20), nullable=True)
    rto = Column(String(50), nullable=True)
    ex_showroom_price = Column(Integer, nullable=True)
    current_policy_expiry = Column(String(20), nullable=True)
    claims_last_year = Column(Integer, default=0)
    ncb_percent = Column(Integer, default=0)
    updated_at = Column(DateTime, default=datetime.utcnow)
