import csv
import io
import re
from typing import List
from ..config import settings
from ..schemas import InsurancePlan
from .glossary import standardize_addons
from .vehicle_service import normalize_reg_no, parse_date_flexibly

def parse_idv_value(idv_str: str) -> int:
    if not idv_str:
        return 0
    cleaned = idv_str.strip().lower()
    lakh_match = re.search(r"([\d\.]+)\s*(?:lakh|lakhs|l)", cleaned)
    if lakh_match:
        return int(float(lakh_match.group(1)) * 100000)
    digits = re.sub(r"[^\d]", "", cleaned)
    return int(digits) if digits else 0

def parse_csv_premium(prem_str: str) -> float:
    if not prem_str:
        return 0.0
    digits = re.sub(r"[^\d\.]", "", prem_str)
    try:
        return float(digits)
    except ValueError:
        return 0.0

def parse_provider_d_csv(csv_text: str, reg_no: str) -> List[InsurancePlan]:
    clean_reg = normalize_reg_no(reg_no)
    ref_d = settings.ref_date
    plans: List[InsurancePlan] = []
    seen_dedup = set()
    
    reader = csv.DictReader(io.StringIO(csv_text))
    for row in reader:
        row_reg = normalize_reg_no(row.get("reg_no", ""))
        if row_reg != clean_reg:
            continue
            
        plan_name = row.get("plan", "Standard").strip()
        premium_str = row.get("premium_incl_gst", "0")
        total_premium = parse_csv_premium(premium_str)
        idv = parse_idv_value(row.get("idv", "0"))
        
        raw_addons_str = row.get("addons", "")
        raw_addons = [a.strip() for a in raw_addons_str.split("|") if a.strip()] if raw_addons_str else []
        standardized_addons = standardize_addons(raw_addons)
        
        valid_till_str = row.get("valid_till", "").strip()
        parsed_valid = parse_date_flexibly(valid_till_str)
        is_expired = False
        if parsed_valid and parsed_valid < ref_d:
            is_expired = True
            
        # Deduplication key
        addons_key = tuple(sorted([a.code for a in standardized_addons]))
        dedup_key = (plan_name, round(total_premium), idv, addons_key)
        if dedup_key in seen_dedup:
            continue
        seen_dedup.add(dedup_key)
        
        base_premium = round(total_premium / 1.18, 2)
        gst_amount = round(total_premium - base_premium, 2)
        
        cov_type = "ZERO_DEP" if any(a.code == "ZERO_DEP" for a in standardized_addons) else "COMPREHENSIVE"
        
        benefits = ["Instant digital policy documents", "Dedicated claim assistance manager"]
        if any(a.code == "ZERO_DEP" for a in standardized_addons):
            benefits.append("Zero Depreciation protection on claims")
        if any(a.code == "ENGINE_PROTECT" for a in standardized_addons):
            benefits.append("Engine & Gearbox hydrostatic lock coverage")

        plans.append(InsurancePlan(
            id=f"prov_d_{clean_reg.lower()}_{plan_name.lower()}",
            provider="Provider D",
            plan_name=plan_name,
            coverage_type=cov_type,
            idv=idv,
            base_premium=base_premium,
            gst_amount=gst_amount,
            total_premium=total_premium,
            addons=standardized_addons,
            valid_until=parsed_valid.isoformat() if parsed_valid else valid_till_str,
            is_expired=is_expired,
            benefits=benefits,
            status="EXPIRED" if is_expired else "AVAILABLE"
        ))

    return plans
