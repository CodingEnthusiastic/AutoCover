from typing import List, Optional, Any
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict

# --- Vehicle Schemas ---
class VehicleModel(BaseModel):
    registration_number: str
    make: str
    model: str
    variant: Optional[str] = "Standard"
    fuel_type: Optional[str] = "Petrol"
    engine_cc: Optional[int] = 1197
    registration_date: Optional[str] = None
    rto: Optional[str] = "Unknown"
    ex_showroom_price: Optional[int] = 600000
    current_policy_expiry: Optional[str] = None
    claims_last_year: int = 0
    ncb_percent: int = 0
    is_registered: bool = True
    days_to_expiry: Optional[int] = None
    expiry_status: Optional[str] = None  # "EXPIRED", "EXPIRING_SOON", "ACTIVE", "UNKNOWN"

class VehicleUpdateRequest(BaseModel):
    registration_number: str
    make: str
    model: str
    variant: Optional[str] = None
    fuel_type: Optional[str] = None
    engine_cc: Optional[int] = None
    registration_date: Optional[str] = None
    rto: Optional[str] = None
    ex_showroom_price: Optional[int] = None
    current_policy_expiry: Optional[str] = None
    claims_last_year: int = 0
    ncb_percent: int = 0

# --- Add-on & Plan Schemas ---
class AddonItem(BaseModel):
    code: str
    name: str
    raw_name: str
    description: Optional[str] = ""

class InsurancePlan(BaseModel):
    id: str
    provider: str
    plan_name: str
    coverage_type: str  # "COMPREHENSIVE", "THIRD_PARTY", "ZERO_DEP"
    idv: int
    base_premium: float
    gst_amount: float
    total_premium: float
    addons: List[AddonItem] = []
    valid_until: Optional[str] = None
    is_expired: bool = False
    benefits: List[str] = []
    value_score: float = 0.0
    badge: Optional[str] = None  # e.g., "Best Value", "Lowest Price", "Most Comprehensive"
    status: str = "AVAILABLE"  # "AVAILABLE", "EXPIRED", "DECLINED"
    decline_reason: Optional[str] = None

class ProviderStatus(BaseModel):
    provider: str
    status: str  # "success", "failed", "timeout", "declined"
    latency_ms: int = 0
    plan_count: int = 0
    error_message: Optional[str] = None

class QuoteComparisonResponse(BaseModel):
    registration_number: str
    reference_date: str
    vehicle: Optional[VehicleModel] = None
    providers: List[ProviderStatus] = []
    plans: List[InsurancePlan] = []
    total_plans: int = 0
    cheapest_plan_id: Optional[str] = None
    best_value_plan_id: Optional[str] = None

# --- Policy Schemas ---
class PolicyCreate(BaseModel):
    plan_id: str
    registration_number: str
    customer_name: str
    customer_phone: str
    provider: str
    plan_name: str
    coverage_type: str
    idv: int
    base_premium: float
    gst_amount: float
    total_premium: float
    addons: List[str] = []
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    fuel_type: Optional[str] = None

class PolicyResponse(BaseModel):
    id: str
    policy_number: str
    registration_number: str
    customer_name: str
    customer_phone: str
    provider: str
    plan_name: str
    coverage_type: str
    idv: int
    base_premium: float
    gst_amount: float
    total_premium: float
    addons: List[str] = []
    start_date: str
    expiry_date: str
    make: Optional[str] = None
    model: Optional[str] = None
    variant: Optional[str] = None
    fuel_type: Optional[str] = None
    days_to_expiry: int
    is_expiring_soon: bool  # within 15 days
    is_expired: bool
    reminder_sent: bool
    created_at: str

    model_config = ConfigDict(from_attributes=True)

class ReminderResponse(BaseModel):
    policy_id: str
    policy_number: str
    customer_name: str
    customer_phone: str
    days_remaining: int
    status: str
    message: str
