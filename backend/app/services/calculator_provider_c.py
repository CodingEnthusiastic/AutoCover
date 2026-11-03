import math
from datetime import date
from typing import List, Optional, Tuple
from ..config import settings
from ..schemas import InsurancePlan, AddonItem, VehicleModel
from .glossary import normalize_addon_name

# Model Group definitions extracted directly from Provider C Rate Card (Annexure A)
MODEL_GROUPS = {
    # Group 1
    "SWIFT": 1,
    "I20": 1,
    "BALENO": 1,
    "ALTO": 1,
    "ALTO K10": 1,
    "TIAGO": 1,
    # Group 2
    "NEXON": 2,
    "CITY": 2,
    "SONET": 2,
    # Group 3
    "CRETA": 3,
    "XUV700": 3,
    "INNOVA": 3,
    "INNOVA CRYSTA": 3,
}

# OD rates by [group][age_bracket]
# Age brackets: (0, 3) -> 0, (3, 5) -> 1, (5, 8) -> 2
OD_RATES = {
    1: { "0_3": 0.028, "3_5": 0.031, "5_8": 0.036 },
    2: { "0_3": 0.030, "3_5": 0.034, "5_8": 0.039 },
    3: { "0_3": 0.032, "3_5": 0.036, "5_8": 0.041 },
}

def round_half_up(n: float) -> int:
    """Rounds halves up to nearest integer (e.g. 0.5 -> 1) as specified in rate card."""
    return math.floor(n + 0.5)

def get_model_group(model_name: str) -> int:
    cleaned = (model_name or "").upper().strip()
    for key, group in MODEL_GROUPS.items():
        if key in cleaned:
            return group
    return 1  # Default to Group 1 if not explicitly matched

def calculate_vehicle_age_years(reg_date_str: Optional[str], ref_date: date) -> Tuple[float, int]:
    """Returns (age_in_years, age_in_days)."""
    if not reg_date_str:
        return 3.0, int(3.0 * 365.25)
    
    try:
        from .vehicle_service import parse_date_flexibly
        reg_date = parse_date_flexibly(reg_date_str)
        if not reg_date:
            return 3.0, int(3.0 * 365.25)
        days = (ref_date - reg_date).days
        years = days / 365.25
        return years, days
    except Exception:
        return 3.0, int(3.0 * 365.25)

def compute_depreciation(days: int) -> Optional[float]:
    """
    Computes depreciation based on Provider C Rate Card (India Motor Tariff):
    <= 6 months: 5%
    6m - 1y: 15%
    1 - 2y: 20%
    2 - 3y: 30%
    3 - 4y: 40%
    4 - 5y: 50%
    5 - 8y: 50% plus 5% for each year above 5
    > 8 years: None (not covered)
    """
    half_year = 182.625
    one_year = 365.25
    
    if days <= half_year:
        return 0.05
    elif days <= one_year:
        return 0.15
    elif days <= 2 * one_year:
        return 0.20
    elif days <= 3 * one_year:
        return 0.30
    elif days <= 4 * one_year:
        return 0.40
    elif days <= 5 * one_year:
        return 0.50
    elif days <= 8 * one_year:
        years_above_5 = math.ceil((days - 5 * one_year) / one_year)
        return min(0.65, 0.50 + (0.05 * years_above_5))
    else:
        return None  # Exceeds 8 years: Not covered

def compute_tp_premium(engine_cc: Optional[int]) -> int:
    cc = engine_cc or 1197
    if cc <= 1000:
        return 2094
    elif cc <= 1500:
        return 3416
    else:
        return 7897

def generate_provider_c_quotes(vehicle: VehicleModel) -> List[InsurancePlan]:
    """
    Computes quotes for Provider C from the Rate Card rules.
    """
    ref_d = settings.ref_date
    years, days = calculate_vehicle_age_years(vehicle.registration_date, ref_d)
    
    dep_rate = compute_depreciation(days)
    if dep_rate is None or years > 8.0:
        # Declined
        return [
            InsurancePlan(
                id=f"prov_c_{vehicle.registration_number.lower()}_declined",
                provider="Provider C",
                plan_name="C-Standard",
                coverage_type="COMPREHENSIVE",
                idv=0,
                base_premium=0.0,
                gst_amount=0.0,
                total_premium=0.0,
                status="DECLINED",
                decline_reason="Vehicle age exceeds 8 years (Rate Card limit)",
                valid_until="2026-12-31"
            )
        ]
        
    ex_showroom = vehicle.ex_showroom_price or 650000
    raw_idv = ex_showroom * (1.0 - dep_rate)
    # Round IDV to nearest 1,000 (halves round up)
    idv = round_half_up(raw_idv / 1000.0) * 1000
    
    # Own Damage rate
    group = get_model_group(vehicle.model)
    if years <= 3.0:
        bracket = "0_3"
    elif years <= 5.0:
        bracket = "3_5"
    else:
        bracket = "5_8"
        
    od_rate = OD_RATES[group][bracket]
    od_base = round_half_up(idv * od_rate)
    
    # NCB discount applies to OD premium only
    ncb = max(0, min(50, vehicle.ncb_percent))
    ncb_discount = round_half_up(od_base * (ncb / 100.0))
    od_premium = od_base - ncb_discount
    
    # Third Party premium
    tp_premium = compute_tp_premium(vehicle.engine_cc)
    
    plans: List[InsurancePlan] = []
    
    # 1. C-Standard Plan (OD + TP, no add-ons)
    net_std = od_premium + tp_premium
    gst_std = round_half_up(net_std * 0.18)
    tot_std = net_std + gst_std
    
    plans.append(InsurancePlan(
        id=f"prov_c_{vehicle.registration_number.lower()}_std",
        provider="Provider C",
        plan_name="C-Standard",
        coverage_type="COMPREHENSIVE",
        idv=idv,
        base_premium=float(net_std),
        gst_amount=float(gst_std),
        total_premium=float(tot_std),
        addons=[],
        valid_until="2026-12-31",
        is_expired=False,
        benefits=[
            "Standard Own Damage + Third Party Coverage",
            "Cashless claims across partner garages",
            f"Model Group {group} calibrated pricing"
        ],
        status="AVAILABLE"
    ))
    
    # 2. C-Shield Plan (Offered only for vehicles up to 5 years)
    # OD + TP + Nil Depreciation + Roadside Assistance + Consumables
    if years <= 5.0:
        nil_dep = round_half_up(od_premium * 0.15)
        rsa = 350
        consumables = 600
        addons_total = nil_dep + rsa + consumables
        
        net_shield = od_premium + tp_premium + addons_total
        gst_shield = round_half_up(net_shield * 0.18)
        tot_shield = net_shield + gst_shield
        
        addons_list = [
            normalize_addon_name("Nil Depreciation"),
            normalize_addon_name("Roadside Assistance"),
            normalize_addon_name("Consumables")
        ]
        
        plans.append(InsurancePlan(
            id=f"prov_c_{vehicle.registration_number.lower()}_shield",
            provider="Provider C",
            plan_name="C-Shield",
            coverage_type="ZERO_DEP",
            idv=idv,
            base_premium=float(net_shield),
            gst_amount=float(gst_shield),
            total_premium=float(tot_shield),
            addons=addons_list,
            valid_until="2026-12-31",
            is_expired=False,
            benefits=[
                "Nil Depreciation (100% claim without depreciation deduction)",
                "24x7 Roadside Assistance & Towing",
                "Consumable expenses covered during repairs",
                "Cashless repair network"
            ],
            status="AVAILABLE"
        ))
        
    return plans
