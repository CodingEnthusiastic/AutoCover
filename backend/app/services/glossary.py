"""
AutoCover Add-on Glossary Service

Maps disparate provider-specific add-on terminology to industry-standard canonical concepts.

Public Insurer Research Citations:
1. Acko General Insurance:
   https://www.acko.com/car-insurance/add-on-covers/
   Terms: Zero Depreciation, Roadside Assistance, Engine Protection Cover, Key Protect, Invoice Cover, Consumables Cover

2. HDFC ERGO General Insurance:
   https://www.hdfcergo.com/car-insurance/add-on-covers
   Terms: Zero Depreciation, Emergency Assistance / RSA, Engine & Gearbox Protector, Cost of Consumables, Return to Invoice

3. Digit Insurance (Go Digit):
   https://www.godigit.com/motor-insurance/car-insurance/add-ons
   Terms: Bumper to Bumper Cover (Zero Dep), Breakdown Assistance, Engine and Gearbox Protection, Return to Invoice

4. ICICI Lombard General Insurance:
   https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers
   Terms: Nil Depreciation, Roadside Assistance, Key Protect, Engine Protect Plus
"""

from typing import Dict, List, Optional
from ..schemas import AddonItem

RESEARCH_SOURCES = [
    {
        "insurer": "Acko General Insurance",
        "url": "https://www.acko.com/car-insurance/add-on-covers/",
        "retrieved_date": "2026-11-03",
        "key_concepts_verified": ["Zero Depreciation", "Roadside Assistance", "Engine Protection", "Invoice Cover", "Key Protect"]
    },
    {
        "insurer": "HDFC ERGO General Insurance",
        "url": "https://www.hdfcergo.com/car-insurance/add-on-covers",
        "retrieved_date": "2026-11-03",
        "key_concepts_verified": ["Zero Depreciation", "Emergency Assistance", "Engine & Gearbox Protector", "Cost of Consumables", "Return to Invoice"]
    },
    {
        "insurer": "Digit Insurance",
        "url": "https://www.godigit.com/motor-insurance/car-insurance/add-ons",
        "retrieved_date": "2026-11-03",
        "key_concepts_verified": ["Bumper to Bumper (Zero Dep)", "Breakdown Assistance (RSA)", "Engine & Gearbox", "Return to Invoice"]
    },
    {
        "insurer": "ICICI Lombard",
        "url": "https://www.icicilombard.com/motor-insurance/car-insurance/add-on-covers",
        "retrieved_date": "2026-11-03",
        "key_concepts_verified": ["Nil Depreciation", "Roadside Assistance", "Key Protect", "Engine Protect Plus"]
    }
]

CANONICAL_GLOSSARY: Dict[str, dict] = {
    "ZERO_DEP": {
        "name": "Zero Depreciation",
        "description": "Covers 100% of repair & replacement costs for metal, fiber, and rubber parts without depreciation deduction (often called Bumper to Bumper or Nil Dep).",
        "aliases": [
            "zero_dep", "zero dep", "nil depreciation", "nil_dep", "bumper to bumper", "bumper-to-bumper",
            "0 dep", "zero depreciation", "depreciation cover"
        ]
    },
    "RSA": {
        "name": "Roadside Assistance",
        "description": "24x7 emergency assistance for towing, jump start, flat tyre, emergency fuel delivery, and minor on-spot repairs.",
        "aliases": [
            "rsa", "roadside assistance", "24x7 roadside assistance", "breakdown assistance",
            "emergency assistance", "roadside support"
        ]
    },
    "ENGINE_PROTECT": {
        "name": "Engine & Gearbox Protection",
        "description": "Covers repair and replacement costs of engine, crankshaft, and gearbox damaged due to water ingression (hydrostatic lock) or oil leakage.",
        "aliases": [
            "engine protect", "engine_protect", "engine & gearbox protection", "engine protection",
            "engine and gearbox protection", "engine & gearbox protector", "engine protect plus"
        ]
    },
    "RETURN_TO_INVOICE": {
        "name": "Return to Invoice",
        "description": "Pays the gap between the vehicle's Insured Declared Value (IDV) and original purchase invoice price (including road tax) in case of theft or total loss.",
        "aliases": [
            "return to invoice", "return_to_invoice", "rti", "total cover", "invoice cover"
        ]
    },
    "CONSUMABLES": {
        "name": "Consumables Cover",
        "description": "Reimburses the cost of consumables like engine oil, gearbox oil, nuts & bolts, coolant, and washers required during claim repairs.",
        "aliases": [
            "consumables", "cost of consumables", "consumable cover", "consumable"
        ]
    },
    "KEY_REPLACEMENT": {
        "name": "Key Replacement",
        "description": "Reimburses the cost of replacing car keys and lock-cylinder mechanism if keys are lost, misplaced, or stolen.",
        "aliases": [
            "key replacement", "key protect", "key replacement cover", "key_replacement"
        ]
    }
}

def normalize_addon_name(raw_name: str) -> AddonItem:
    """
    Given an arbitrary provider add-on string, resolves it to a canonical AddonItem.
    """
    clean = raw_name.strip().lower()
    
    for code, info in CANONICAL_GLOSSARY.items():
        if clean == code.lower() or any(alias in clean for alias in info["aliases"]):
            return AddonItem(
                code=code,
                name=info["name"],
                raw_name=raw_name.strip(),
                description=info["description"]
            )
            
    # Fallback for unrecognized custom addon
    slug = clean.replace(" ", "_").upper()
    return AddonItem(
        code=slug,
        name=raw_name.strip().title(),
        raw_name=raw_name.strip(),
        description="Optional add-on protection"
    )

def standardize_addons(raw_addons: List[str]) -> List[AddonItem]:
    """
    Normalizes a list of provider-specific addon strings, deduplicating them.
    """
    seen_codes = set()
    standardized = []
    
    for raw in raw_addons:
        if not raw or not raw.strip():
            continue
        item = normalize_addon_name(raw)
        if item.code not in seen_codes:
            seen_codes.add(item.code)
            standardized.append(item)
            
    return standardized
