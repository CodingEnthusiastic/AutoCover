import re
import json
from bs4 import BeautifulSoup
from datetime import datetime
from typing import List, Optional
from ..config import settings
from ..schemas import InsurancePlan
from .glossary import standardize_addons
from .vehicle_service import normalize_reg_no, parse_date_flexibly

def parse_idv_cover_str(cover_str: str) -> int:
    """
    Parses '3.1 L', '6.7 L', '12.5 L', '310000', etc. to integer IDV.
    """
    if not cover_str:
        return 0
    cleaned = cover_str.strip().upper()
    lakh_match = re.search(r"([\d\.]+)\s*(?:L|LAKH|LAKHS)", cleaned)
    if lakh_match:
        val = float(lakh_match.group(1))
        return int(val * 100000)
    
    num_match = re.sub(r"[^\d]", "", cleaned)
    if num_match:
        return int(num_match)
    return 0

def parse_price_str(price_str: str) -> float:
    """
    Parses '₹12,830' -> 12830.0
    """
    if not price_str:
        return 0.0
    digits = re.sub(r"[^\d\.]", "", price_str)
    try:
        return float(digits)
    except ValueError:
        return 0.0

def parse_provider_b_html(html_content: str, reg_no: str) -> List[InsurancePlan]:
    clean_reg = normalize_reg_no(reg_no)
    ref_d = settings.ref_date
    plans: List[InsurancePlan] = []
    
    # 1. Extract hydrate JSON data from <script>
    script_match = re.search(r"window\.__QUOTE_DATA__\s*=\s*(\{.*?\});", html_content, re.DOTALL)
    quote_data = {}
    if script_match:
        try:
            quote_data = json.loads(script_match.group(1))
        except Exception as e:
            print(f"Error parsing Provider B JSON quote data: {e}")

    # 2. Parse HTML DOM
    soup = BeautifulSoup(html_content, "html.parser")
    vehicle_sections = soup.find_all("section", class_="vehicle")
    
    target_section = None
    for sec in vehicle_sections:
        sec_reg = normalize_reg_no(sec.get("data-reg", ""))
        if sec_reg == clean_reg:
            target_section = sec
            break
            
    if not target_section:
        return plans

    # Check for disabled / not available cards
    disabled_card = target_section.find("div", class_="plan-card disabled")
    if disabled_card:
        reason_p = disabled_card.find("p")
        reason = reason_p.text.strip() if reason_p else "Vehicle not eligible for coverage"
        plans.append(InsurancePlan(
            id=f"prov_b_{clean_reg.lower()}_declined",
            provider="Provider B",
            plan_name="Declined",
            coverage_type="UNKNOWN",
            idv=0,
            base_premium=0.0,
            gst_amount=0.0,
            total_premium=0.0,
            status="DECLINED",
            decline_reason=reason,
            valid_until=None
        ))
        return plans

    plan_cards = target_section.find_all("div", class_="plan-card")
    for card in plan_cards:
        plan_id = card.get("data-plan-id")
        if not plan_id:
            continue
            
        h3 = card.find("h3")
        plan_name = h3.text.strip() if h3 else f"Plan {plan_id}"
        
        # Addons
        raw_addons = []
        addons_ul = card.find("ul", class_="addons")
        if addons_ul:
            for li in addons_ul.find_all("li"):
                raw_addons.append(li.text.strip())
                
        standardized_addons = standardize_addons(raw_addons)
        
        # Hydrated price and cover
        q_meta = quote_data.get(plan_id, {})
        total_premium = parse_price_str(q_meta.get("total", "0"))
        idv = parse_idv_cover_str(q_meta.get("cover", "0"))
        valid_till_str = q_meta.get("valid_till")
        
        base_premium = round(total_premium / 1.18, 2)
        gst_amount = round(total_premium - base_premium, 2)
        
        is_expired = False
        parsed_valid = parse_date_flexibly(valid_till_str)
        if parsed_valid and parsed_valid < ref_d:
            is_expired = True

        cov_type = "ZERO_DEP" if any(a.code == "ZERO_DEP" for a in standardized_addons) else "COMPREHENSIVE"
        
        benefits = ["Paperless claim settlement", "Nationwide towing & spot repair"]
        if any(a.code == "ZERO_DEP" for a in standardized_addons):
            benefits.append("Bumper to Bumper (Nil Depreciation) replacement")
        if any(a.code == "KEY_REPLACEMENT" for a in standardized_addons):
            benefits.append("Lost key and lockset replacement coverage")
        if any(a.code == "RETURN_TO_INVOICE" for a in standardized_addons):
            benefits.append("Return to Invoice (Total Cover) protection")

        plans.append(InsurancePlan(
            id=f"prov_b_{clean_reg.lower()}_{plan_id.lower()}",
            provider="Provider B",
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
