import pytest
from app.services.vehicle_service import normalize_reg_no, parse_date_flexibly, vehicle_service
from app.services.glossary import normalize_addon_name, standardize_addons
from app.services.calculator_provider_c import (
    get_model_group, compute_depreciation, compute_tp_premium, generate_provider_c_quotes
)
from app.schemas import VehicleModel

def test_registration_normalization():
    assert normalize_reg_no("WB 02 AB 1234") == "WB02AB1234"
    assert normalize_reg_no("kl-07-de-3030") == "KL07DE3030"
    assert normalize_reg_no("  mh12 ef 4321  ") == "MH12EF4321"
    assert normalize_reg_no("DL 3C AB 0042") == "DL3CAB0042"

def test_flexible_date_parsing():
    d1 = parse_date_flexibly("2026-11-20")
    assert d1 is not None and d1.year == 2026 and d1.month == 11 and d1.day == 20

    d2 = parse_date_flexibly("15/12/2026")
    assert d2 is not None and d2.year == 2026 and d2.month == 12 and d2.day == 15

    d3 = parse_date_flexibly("30-11-2026")
    assert d3 is not None and d3.year == 2026 and d3.month == 11 and d3.day == 30

def test_vehicle_lookup():
    v = vehicle_service.lookup("WB02AB1234")
    assert v is not None
    assert v.make == "Maruti Suzuki"
    assert v.model == "Swift"
    assert v.is_registered is True
    assert v.ncb_percent == 35

def test_addon_glossary_mapping():
    # Provider B terms
    item_b2b = normalize_addon_name("Bumper to Bumper")
    assert item_b2b.code == "ZERO_DEP"
    assert item_b2b.name == "Zero Depreciation"

    item_rsa = normalize_addon_name("24x7 Roadside Assistance")
    assert item_rsa.code == "RSA"

    item_tot = normalize_addon_name("Total Cover")
    assert item_tot.code == "RETURN_TO_INVOICE"

    # Provider C terms
    item_nil = normalize_addon_name("Nil Depreciation")
    assert item_nil.code == "ZERO_DEP"

    item_cons = normalize_addon_name("Consumables")
    assert item_cons.code == "CONSUMABLES"

    # Provider D terms
    item_eng = normalize_addon_name("Engine Protect")
    assert item_eng.code == "ENGINE_PROTECT"

    # Deduplication in standardize_addons
    raw_list = ["Bumper to Bumper", "Zero Dep", "24x7 Roadside Assistance", "RSA"]
    std = standardize_addons(raw_list)
    assert len(std) == 2
    codes = [a.code for a in std]
    assert "ZERO_DEP" in codes and "RSA" in codes

def test_provider_c_rate_card_logic():
    # Test model groups
    assert get_model_group("Swift") == 1
    assert get_model_group("Nexon") == 2
    assert get_model_group("Creta") == 3

    # Test TP by CC
    assert compute_tp_premium(998) == 2094
    assert compute_tp_premium(1197) == 3416
    assert compute_tp_premium(2184) == 7897

    # Test vehicle quote generation for young car
    v = VehicleModel(
        registration_number="WB02AB1234",
        make="Maruti Suzuki",
        model="Swift",
        variant="VXi",
        fuel_type="Petrol",
        engine_cc=1197,
        registration_date="2022-08-14", # ~4.2 years old on 2026-11-10
        ex_showroom_price=650000,
        ncb_percent=35
    )
    quotes = generate_provider_c_quotes(v)
    assert len(quotes) == 2 # Both C-Standard and C-Shield (under 5 years)
    plan_names = [q.plan_name for q in quotes]
    assert "C-Standard" in plan_names
    assert "C-Shield" in plan_names

    # Test vehicle older than 8 years (e.g. 2014)
    v_old = VehicleModel(
        registration_number="WB06CD5678",
        make="Hyundai",
        model="i20",
        registration_date="2014-03-02",
        ex_showroom_price=740000
    )
    old_quotes = generate_provider_c_quotes(v_old)
    assert len(old_quotes) == 1
    assert old_quotes[0].status == "DECLINED"
