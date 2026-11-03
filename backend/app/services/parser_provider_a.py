import re
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..config import settings
from ..schemas import InsurancePlan, VehicleModel
from .glossary import standardize_addons
from .vehicle_service import normalize_reg_no

def parse_provider_a_quotes(json_data: dict, reg_no: str) -> List[InsurancePlan]:
    clean_reg = normalize_reg_no(reg_no)
    ref_d = settings.ref_date
    plans: List[InsurancePlan] = []
    seen_keys = set()
    
    quotes = json_data.get("quotes", [])
    for q in quotes:
        q_reg = normalize_reg_no(q.get("registration", ""))
        if q_reg != clean_reg:
            continue
            
        status = q.get("status", "QUOTED")
        if status == "DECLINED":
            plans.append(InsurancePlan(
                id=f"prov_a_{clean_reg.lower()}_declined",
                provider="Provider A",
                plan_name="Declined",
                coverage_type="UNKNOWN",
                idv=0,
                base_premium=0.0,
                gst_amount=0.0,
                total_premium=0.0,
                status="DECLINED",
                decline_reason=q.get("reason", "Underwriting criteria not met"),
                valid_until=None
            ))
            continue
            
        plan_name = q.get("plan", "Standard Plan")
        coverage = q.get("coverage", "COMPREHENSIVE")
        idv = int(q.get("idv", 0))
        raw_addons = q.get("addons", [])
        valid_until_str = q.get("valid_until")
        
        # Determine base, gst, total premiums
        if q.get("premium_includes_gst") and q.get("premium"):
            total_premium = float(q["premium"])
            base_premium = round(total_premium / 1.18, 2)
            gst_amount = round(total_premium - base_premium, 2)
        elif q.get("base_premium") is not None:
            base_premium = float(q["base_premium"])
            taxes = q.get("taxes", [])
            rate = 0.18
            if taxes and len(taxes) > 0 and "rate" in taxes[0]:
                rate = float(taxes[0]["rate"])
            gst_amount = round(base_premium * rate, 2)
            total_premium = round(base_premium + gst_amount, 2)
        else:
            base_premium = 0.0
            gst_amount = 0.0
            total_premium = 0.0

        # Check quote validity against reference date
        is_expired = False
        if valid_until_str:
            try:
                # Format: "2026-11-30T23:59:00+05:30"
                dt = datetime.fromisoformat(valid_until_str)
                if dt.date() < ref_d:
                    is_expired = True
            except Exception:
                pass

        addons_items = standardize_addons(raw_addons)
        addons_key = tuple(sorted([a.code for a in addons_items]))
        
        # Deduplication key
        dedup_key = (plan_name, coverage, idv, round(total_premium), addons_key)
        if dedup_key in seen_keys:
            continue
        seen_keys.add(dedup_key)

        benefits = ["Instant digital policy issue", "Network cashless garages across India"]
        if any(a.code == "ZERO_DEP" for a in addons_items):
            benefits.append("Full bumper-to-bumper claim without depreciation deduction")
        if any(a.code == "RSA" for a in addons_items):
            benefits.append("24x7 Roadside emergency assistance")

        cov_type = "ZERO_DEP" if any(a.code == "ZERO_DEP" for a in addons_items) else coverage

        plans.append(InsurancePlan(
            id=f"prov_a_{clean_reg.lower()}_{plan_name.lower().replace(' ', '_')}",
            provider="Provider A",
            plan_name=plan_name,
            coverage_type=cov_type,
            idv=idv,
            base_premium=base_premium,
            gst_amount=gst_amount,
            total_premium=total_premium,
            addons=addons_items,
            valid_until=valid_until_str[:10] if valid_until_str else None,
            is_expired=is_expired,
            benefits=benefits,
            status="EXPIRED" if is_expired else "AVAILABLE"
        ))
        
    return plans
