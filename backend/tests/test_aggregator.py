import pytest
import httpx
from main import app
from app.services.aggregator import InsuranceAggregator
from app.services.vehicle_service import vehicle_service

@pytest.mark.asyncio
async def test_full_aggregation_flow():
    # Test aggregation using ASGITransport so all mock endpoints are resolved in-memory
    vehicle = vehicle_service.lookup("WB02AB1234")
    assert vehicle is not None
    
    agg = InsuranceAggregator(base_url="http://testserver/api/mock")
    transport = httpx.ASGITransport(app=app)
    
    async with httpx.AsyncClient(transport=transport, base_url="http://testserver") as client:
        res_a, stat_a = await agg.fetch_provider_a(client, vehicle)
        res_b, stat_b = await agg.fetch_provider_b(client, vehicle)
        res_c, stat_c = await agg.fetch_provider_c(client, vehicle)
        res_d, stat_d = await agg.fetch_provider_d(client, vehicle, simulate_failure=False)
        
        assert stat_a.status == "success"
        assert len(res_a) == 3
        
        assert stat_b.status == "success"
        assert len(res_b) == 3
        
        assert stat_c.status == "success"
        assert len(res_c) == 2 # C-Standard and C-Shield
        
        assert stat_d.status == "success"
        assert len(res_d) == 2
        
        # Total distinct active plans collected across 4 providers
        total_collected = len(res_a) + len(res_b) + len(res_c) + len(res_d)
        assert total_collected == 10
