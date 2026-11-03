import time
import httpx
from typing import List, Tuple, Optional
from ..config import settings
from ..schemas import InsurancePlan, ProviderStatus, QuoteComparisonResponse, VehicleModel
from .parser_provider_a import parse_provider_a_quotes
from .parser_provider_b import parse_provider_b_html
from .calculator_provider_c import generate_provider_c_quotes
from .parser_provider_d import parse_provider_d_csv
from .ranking_service import calculate_value_scores

class InsuranceAggregator:
    def __init__(self, base_url: Optional[str] = None):
        self.base_url = (base_url or settings.MOCK_SERVICE_URL).rstrip("/")

    async def fetch_provider_a(self, client: httpx.AsyncClient, vehicle: VehicleModel) -> Tuple[List[InsurancePlan], ProviderStatus]:
        t0 = time.time()
        try:
            try:
                resp = await client.get(f"{self.base_url}/provider-a/quotes", timeout=5.0)
                data = resp.json()
            except (httpx.ConnectError, httpx.ConnectTimeout):
                # Resilient fallback to direct mock handler
                from ..api.mock_providers import get_provider_a
                resp_json = await get_provider_a()
                import json
                data = json.loads(resp_json.body.decode())

            latency = int((time.time() - t0) * 1000)
            plans = parse_provider_a_quotes(data, vehicle.registration_number)
            status = "declined" if any(p.status == "DECLINED" for p in plans) else "success"
            return plans, ProviderStatus(
                provider="Provider A",
                status=status,
                latency_ms=latency,
                plan_count=len([p for p in plans if p.status != "DECLINED"])
            )
        except Exception as e:
            latency = int((time.time() - t0) * 1000)
            return [], ProviderStatus(
                provider="Provider A",
                status="failed",
                latency_ms=latency,
                error_message=str(e)
            )

    async def fetch_provider_b(self, client: httpx.AsyncClient, vehicle: VehicleModel) -> Tuple[List[InsurancePlan], ProviderStatus]:
        t0 = time.time()
        try:
            # Provider B simulates slower response
            try:
                resp = await client.get(f"{self.base_url}/provider-b/quotes", timeout=8.0)
                html_text = resp.text
            except (httpx.ConnectError, httpx.ConnectTimeout):
                from ..api.mock_providers import get_provider_b
                resp_html = await get_provider_b(delay=0.1)
                html_text = resp_html.body.decode()

            latency = int((time.time() - t0) * 1000)
            plans = parse_provider_b_html(html_text, vehicle.registration_number)
            status = "declined" if any(p.status == "DECLINED" for p in plans) else "success"
            return plans, ProviderStatus(
                provider="Provider B",
                status=status,
                latency_ms=latency,
                plan_count=len([p for p in plans if p.status != "DECLINED"])
            )
        except httpx.TimeoutException:
            latency = int((time.time() - t0) * 1000)
            return [], ProviderStatus(
                provider="Provider B",
                status="timeout",
                latency_ms=latency,
                error_message="Gateway timeout: Provider B took too long to respond."
            )
        except Exception as e:
            latency = int((time.time() - t0) * 1000)
            return [], ProviderStatus(
                provider="Provider B",
                status="failed",
                latency_ms=latency,
                error_message=str(e)
            )

    async def fetch_provider_c(self, client: httpx.AsyncClient, vehicle: VehicleModel) -> Tuple[List[InsurancePlan], ProviderStatus]:
        t0 = time.time()
        try:
            try:
                await client.get(f"{self.base_url}/provider-c/ratecard", timeout=5.0)
            except (httpx.ConnectError, httpx.ConnectTimeout):
                pass
            latency = int((time.time() - t0) * 1000)
            
            # Generate quotes using our rate card calculation engine
            plans = generate_provider_c_quotes(vehicle)
            status = "declined" if any(p.status == "DECLINED" for p in plans) else "success"
            return plans, ProviderStatus(
                provider="Provider C",
                status=status,
                latency_ms=latency,
                plan_count=len([p for p in plans if p.status != "DECLINED"])
            )
        except Exception as e:
            latency = int((time.time() - t0) * 1000)
            return [], ProviderStatus(
                provider="Provider C",
                status="failed",
                latency_ms=latency,
                error_message=str(e)
            )

    async def fetch_provider_d(
        self,
        client: httpx.AsyncClient,
        vehicle: VehicleModel,
        simulate_failure: bool = False
    ) -> Tuple[List[InsurancePlan], ProviderStatus]:
        t0 = time.time()
        try:
            if simulate_failure:
                return [], ProviderStatus(
                    provider="Provider D",
                    status="failed",
                    latency_ms=120,
                    error_message="503 Service Unavailable: Provider D quote server is temporarily down."
                )

            url = f"{self.base_url}/provider-d/quotes"
            try:
                resp = await client.get(url, timeout=5.0)
                csv_text = resp.text
                status_code = resp.status_code
            except (httpx.ConnectError, httpx.ConnectTimeout):
                from ..api.mock_providers import get_provider_d
                resp_d = await get_provider_d(fail=False)
                csv_text = resp_d.body.decode()
                status_code = 200

            latency = int((time.time() - t0) * 1000)
            
            if status_code == 200:
                plans = parse_provider_d_csv(csv_text, vehicle.registration_number)
                return plans, ProviderStatus(
                    provider="Provider D",
                    status="success",
                    latency_ms=latency,
                    plan_count=len(plans)
                )
            elif status_code == 503:
                return [], ProviderStatus(
                    provider="Provider D",
                    status="failed",
                    latency_ms=latency,
                    error_message="503 Service Unavailable: Provider D quote server is temporarily down."
                )
            else:
                return [], ProviderStatus(
                    provider="Provider D",
                    status="failed",
                    latency_ms=latency,
                    error_message=f"HTTP {status_code}"
                )
        except Exception as e:
            latency = int((time.time() - t0) * 1000)
            return [], ProviderStatus(
                provider="Provider D",
                status="failed",
                latency_ms=latency,
                error_message=str(e)
            )

    async def collect_quotes(
        self,
        vehicle: VehicleModel,
        simulate_fail_d: bool = False
    ) -> QuoteComparisonResponse:
        import asyncio
        async with httpx.AsyncClient() as client:
            tasks = [
                self.fetch_provider_a(client, vehicle),
                self.fetch_provider_b(client, vehicle),
                self.fetch_provider_c(client, vehicle),
                self.fetch_provider_d(client, vehicle, simulate_failure=simulate_fail_d),
            ]
            results = await asyncio.gather(*tasks)

        all_plans: List[InsurancePlan] = []
        statuses: List[ProviderStatus] = []

        for plans, status in results:
            all_plans.extend(plans)
            statuses.append(status)

        # Apply value scoring & smart badges
        scored_plans = calculate_value_scores(all_plans)

        active_plans = [p for p in scored_plans if p.status == "AVAILABLE" and p.total_premium > 0]
        cheapest_id = min(active_plans, key=lambda p: p.total_premium).id if active_plans else None
        best_val_id = max(active_plans, key=lambda p: p.value_score).id if active_plans else None

        return QuoteComparisonResponse(
            registration_number=vehicle.registration_number,
            reference_date=settings.REFERENCE_DATE,
            vehicle=vehicle,
            providers=statuses,
            plans=scored_plans,
            total_plans=len([p for p in scored_plans if p.status == "AVAILABLE"]),
            cheapest_plan_id=cheapest_id,
            best_value_plan_id=best_val_id
        )

aggregator = InsuranceAggregator()
