import pytest
from fastapi.testclient import TestClient
from app.database import init_db
from main import app

@pytest.fixture(autouse=True)
def setup_db():
    init_db()

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["reference_date"] == "2026-11-10"

def test_vehicle_lookup_api():
    res = client.get("/api/vehicles/WB 02 AB 1234")
    assert res.status_code == 200
    data = res.json()
    assert data["registration_number"] == "WB02AB1234"
    assert data["make"] == "Maruti Suzuki"
    assert data["model"] == "Swift"
    assert data["days_to_expiry"] is not None

def test_glossary_api():
    res = client.get("/api/quotes/glossary")
    assert res.status_code == 200
    data = res.json()
    assert len(data["research_sources"]) >= 3
    assert "ZERO_DEP" in data["canonical_glossary"]

def test_mock_endpoints():
    res_a = client.get("/api/mock/provider-a/quotes")
    assert res_a.status_code == 200
    assert "quotes" in res_a.json()

    res_b = client.get("/api/mock/provider-b/quotes?delay=0")
    assert res_b.status_code == 200
    assert "Smart Shield" in res_b.text

    res_d = client.get("/api/mock/provider-d/quotes")
    assert res_d.status_code == 200
    assert "premium_incl_gst" in res_d.text

    # Test 503 simulation
    res_d_fail = client.get("/api/mock/provider-d/quotes?fail=true")
    assert res_d_fail.status_code == 503

def test_policy_crud_and_reminder():
    # 1. Create a policy
    payload = {
        "plan_id": "test_plan_001",
        "registration_number": "WB02AB1234",
        "customer_name": "Test Customer",
        "customer_phone": "+91 99999 88888",
        "provider": "Provider C",
        "plan_name": "C-Shield",
        "coverage_type": "ZERO_DEP",
        "idv": 450000,
        "base_premium": 12000.0,
        "gst_amount": 2160.0,
        "total_premium": 14160.0,
        "addons": ["Zero Depreciation", "Roadside Assistance"],
        "start_date": "2026-11-10",
        "expiry_date": "2026-11-20"  # 10 days left -> expiring soon!
    }
    create_res = client.post("/api/policies", json=payload)
    assert create_res.status_code == 200
    created = create_res.json()
    assert created["registration_number"] == "WB02AB1234"
    assert created["is_expiring_soon"] is True
    policy_id = created["id"]

    # 2. Get policies
    get_res = client.get("/api/policies")
    assert get_res.status_code == 200
    assert any(p["id"] == policy_id for p in get_res.json())

    # 3. Send renewal reminder
    rem_res = client.post(f"/api/policies/{policy_id}/send-reminder")
    assert rem_res.status_code == 200
    rem_data = rem_res.json()
    assert rem_data["status"] == "DELIVERED_SIMULATED"
    assert "expires in 10 days" in rem_data["message"]
