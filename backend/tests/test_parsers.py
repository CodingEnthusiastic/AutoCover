import os
import json
import pytest
from app.config import settings
from app.services.parser_provider_a import parse_provider_a_quotes
from app.services.parser_provider_b import parse_provider_b_html
from app.services.parser_provider_d import parse_provider_d_csv

@pytest.fixture
def provider_a_data():
    path = os.path.join(settings.DATA_DIR, "provider_a.json")
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)

@pytest.fixture
def provider_b_html_text():
    path = os.path.join(settings.DATA_DIR, "provider_b.html")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

@pytest.fixture
def provider_d_csv_text():
    path = os.path.join(settings.DATA_DIR, "provider_d.csv")
    with open(path, "r", encoding="utf-8") as f:
        return f.read()

def test_provider_a_parsing(provider_a_data):
    # WB02AB1234 has duplicate Comprehensive Plus quotes in raw file
    plans = parse_provider_a_quotes(provider_a_data, "WB02AB1234")
    assert len(plans) == 3 # Essential, Comprehensive Plus (deduped), Third Party Only
    plan_names = [p.plan_name for p in plans]
    assert "Essential" in plan_names
    assert "Comprehensive Plus" in plan_names
    assert "Third Party Only" in plan_names
    
    # Check GST calculation
    comp_plus = next(p for p in plans if p.plan_name == "Comprehensive Plus")
    assert comp_plus.base_premium == 11346.0
    assert comp_plus.gst_amount == round(11346.0 * 0.18, 2)

    # Check declined vehicle in Provider A (WB06CD5678 age > 10 yrs)
    declined_plans = parse_provider_a_quotes(provider_a_data, "WB06CD5678")
    assert len(declined_plans) == 1
    assert declined_plans[0].status == "DECLINED"

    # Check expired quote (KL07DE3030 has valid_until 2026-11-05, before 2026-11-10)
    kl_plans = parse_provider_a_quotes(provider_a_data, "KL07DE3030")
    for p in kl_plans:
        assert p.is_expired is True
        assert p.status == "EXPIRED"

def test_provider_b_parsing(provider_b_html_text):
    # WB-02-AB-1234
    plans = parse_provider_b_html(provider_b_html_text, "WB02AB1234")
    assert len(plans) == 3
    plan_names = [p.plan_name for p in plans]
    assert "Smart Shield" in plan_names
    assert "Smart Shield Max" in plan_names
    assert "Smart Basic" in plan_names

    # Check IDV conversion from "3.1 L" -> 310,000
    p101 = next(p for p in plans if p.plan_name == "Smart Shield")
    assert p101.idv == 310000
    assert p101.total_premium == 12830.0

    # Check disabled vehicle (> 8 years in B, e.g. WB06CD5678)
    declined_b = parse_provider_b_html(provider_b_html_text, "WB06CD5678")
    assert len(declined_b) == 1
    assert declined_b[0].status == "DECLINED"

def test_provider_d_parsing(provider_d_csv_text):
    # KL 07 DE 3030 has duplicate Gold plan in raw CSV
    plans = parse_provider_d_csv(provider_d_csv_text, "KL07DE3030")
    assert len(plans) == 2 # Basic and Gold (deduped)
    
    # Check dl3cab0042 expired quote (15/10/2026 is before 2026-11-10)
    dl_plans = parse_provider_d_csv(provider_d_csv_text, "DL3CAB0042")
    basic_dl = next(p for p in dl_plans if p.plan_name == "Basic")
    assert basic_dl.is_expired is True
    assert basic_dl.status == "EXPIRED"
