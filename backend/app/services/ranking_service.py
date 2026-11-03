from typing import List, Optional
from ..schemas import InsurancePlan

def calculate_value_scores(plans: List[InsurancePlan]) -> List[InsurancePlan]:
    """
    Computes a multi-dimensional value score (0 to 100) for each plan:
    - IDV efficiency (IDV coverage per rupee of premium)
    - Add-on completeness (Zero Dep, RSA, Engine Protect, Consumables, RTI)
    - Active validity bonus
    - Assigns intelligent badges: 'Best Value', 'Lowest Price', 'Maximum Coverage'
    """
    if not plans:
        return plans

    active_plans = [p for p in plans if p.status == "AVAILABLE" and p.total_premium > 0]
    
    if not active_plans:
        return plans

    # Compute min/max for normalization
    min_prem = min(p.total_premium for p in active_plans)
    max_prem = max(p.total_premium for p in active_plans)
    min_idv = min(p.idv for p in active_plans)
    max_idv = max(p.idv for p in active_plans)
    
    prem_range = (max_prem - min_prem) if max_prem > min_prem else 1.0
    idv_range = (max_idv - min_idv) if max_idv > min_idv else 1.0

    scored_plans = []
    for plan in plans:
        if plan.status != "AVAILABLE" or plan.total_premium <= 0:
            plan.value_score = 10.0 if plan.status == "EXPIRED" else 0.0
            plan.badge = "Expired Quote" if plan.status == "EXPIRED" else "Declined"
            scored_plans.append(plan)
            continue

        # 1. Price affordability score (up to 35 pts)
        price_norm = 1.0 - ((plan.total_premium - min_prem) / prem_range)
        price_score = price_norm * 35.0

        # 2. IDV coverage strength (up to 30 pts)
        idv_norm = (plan.idv - min_idv) / idv_range if plan.idv > 0 else 0.0
        idv_score = idv_norm * 30.0

        # 3. Add-on richness (up to 30 pts)
        addon_codes = set(a.code for a in plan.addons)
        addon_score = 0.0
        if "ZERO_DEP" in addon_codes:
            addon_score += 12.0
        if "ENGINE_PROTECT" in addon_codes:
            addon_score += 7.0
        if "RSA" in addon_codes:
            addon_score += 5.0
        if "RETURN_TO_INVOICE" in addon_codes:
            addon_score += 4.0
        if "CONSUMABLES" in addon_codes:
            addon_score += 2.0
        addon_score = min(30.0, addon_score)

        # 4. Base validity & brand reliability (5 pts)
        base_score = 5.0

        total_score = round(price_score + idv_score + addon_score + base_score, 1)
        plan.value_score = min(99.0, max(15.0, total_score))
        scored_plans.append(plan)

    # Assign Badges among available active plans
    if active_plans:
        # Lowest price
        cheapest = min(active_plans, key=lambda p: p.total_premium)
        cheapest.badge = "Lowest Price"

        # Best value (highest score, prioritizing plans with Zero Dep)
        best_val = max(active_plans, key=lambda p: p.value_score)
        if best_val.id != cheapest.id:
            best_val.badge = "Best Value"
        else:
            best_val.badge = "Best Value & Lowest Price"

        # Maximum coverage (most addons & highest IDV)
        max_cov = max(active_plans, key=lambda p: (len(p.addons), p.idv))
        if max_cov.id != best_val.id and max_cov.id != cheapest.id and len(max_cov.addons) > 0:
            max_cov.badge = "Maximum Coverage"

    return scored_plans
