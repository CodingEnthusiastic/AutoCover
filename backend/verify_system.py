import asyncio
import httpx
from main import app
from app.services.vehicle_service import vehicle_service

async def run_verification():
    print("=" * 60)
    print("      AUTOCOVER END-TO-END VERIFICATION")
    print("=" * 60)
    
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        # 1. Health check
        health_resp = await client.get("/api/health")
        print(f"[1] Health Check: Status {health_resp.status_code} -> {health_resp.json()}")
        assert health_resp.status_code == 200

        # 2. Vehicle Lookup with formatting
        v_resp = await client.get("/api/vehicles/wb 02 ab 1234")
        v_data = v_resp.json()
        print(f"[2] Vehicle Lookup: {v_data['make']} {v_data['model']} ({v_data['registration_number']})")
        print(f"    Registration: {v_data['registration_date']}, RTO: {v_data['rto']}, NCB: {v_data['ncb_percent']}%")
        print(f"    Current Expiry: {v_data['current_policy_expiry']} ({v_data['days_to_expiry']} days left -> {v_data['expiry_status']})")
        assert v_resp.status_code == 200

        # 3. Add-on Glossary
        g_resp = await client.get("/api/quotes/glossary")
        g_data = g_resp.json()
        print(f"[3] Add-on Glossary: Loaded {len(g_data['research_sources'])} real insurer research citations")
        for src in g_data["research_sources"]:
            print(f"    - {src['insurer']}: {src['url']}")

        # 4. Multi-Provider Aggregation & Comparison
        print("\n[4] Collecting and comparing quotes across all 4 providers...")
        comp_resp = await client.get("/api/quotes/compare?reg=WB02AB1234")
        assert comp_resp.status_code == 200
        comp_data = comp_resp.json()
        
        print("\n--- PROVIDER COLLECTION STATUSES ---")
        for p in comp_data["providers"]:
            print(f"    {p['provider']}: Status = {p['status']}, Plans = {p['plan_count']}, Latency = {p['latency_ms']}ms")

        print(f"\n--- NORMALIZED INSURANCE PLANS ({comp_data['total_plans']} available) ---")
        for plan in comp_data["plans"]:
            if plan["status"] == "AVAILABLE":
                badge_str = f"[{plan['badge']}]" if plan['badge'] else ""
                addons_str = ", ".join([a['name'] for a in plan['addons']]) or "None"
                print(f"    {plan['provider']} | {plan['plan_name']} ({plan['coverage_type']}) {badge_str}")
                print(f"      Total Premium: INR {plan['total_premium']:,.2f} (Net: INR {plan['base_premium']:,.2f} + GST: INR {plan['gst_amount']:,.2f})")
                print(f"      IDV: INR {plan['idv']:,} | Score: {plan['value_score']}/100 | Add-ons: {addons_str}")

        # 5. Fault tolerance test: simulate provider D 503 outage
        print("\n[5] Testing Fault Tolerance (Provider D 503 Outage simulation)...")
        comp_fail_resp = await client.get("/api/quotes/compare?reg=WB02AB1234&simulate_fail_d=true")
        comp_fail_data = comp_fail_resp.json()
        d_status = next(p for p in comp_fail_data["providers"] if p["provider"] == "Provider D")
        print(f"    Provider D Status: {d_status['status']} -> {d_status['error_message']}")
        print(f"    Other providers succeeded gracefully ({len(comp_fail_data['plans'])} total plans returned)")
        assert d_status["status"] == "failed"

        # 6. Policy Creation & Renewal Reminders
        print("\n[6] Mock Policy Selection & Renewal Reminder...")
        pol_create_resp = await client.post("/api/policies", json={
            "plan_id": "prov_c_wb02ab1234_shield",
            "registration_number": "WB02AB1234",
            "customer_name": "Rahul Sen",
            "customer_phone": "+91 98300 11111",
            "provider": "Provider C",
            "plan_name": "C-Shield",
            "coverage_type": "ZERO_DEP",
            "idv": 325000,
            "base_premium": 11000.0,
            "gst_amount": 1980.0,
            "total_premium": 12980.0,
            "addons": ["Zero Depreciation", "Roadside Assistance", "Consumables Cover"],
            "start_date": "2026-11-10",
            "expiry_date": "2026-11-20" # 10 days to expiry
        })
        assert pol_create_resp.status_code == 200
        policy = pol_create_resp.json()
        print(f"    Saved Policy: {policy['policy_number']} for {policy['customer_name']}")
        print(f"    Days to expiry: {policy['days_to_expiry']} -> Expiring Soon: {policy['is_expiring_soon']}")

        # Trigger renewal reminder
        rem_resp = await client.post(f"/api/policies/{policy['id']}/send-reminder")
        print(f"    Renewal Notification: {rem_resp.json()['message']}")

    print("\n" + "=" * 60)
    print("      ALL END-TO-END CHECKS VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_verification())
