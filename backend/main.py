from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
import json
from app.config import settings
from app.database import init_db, SessionLocal
from app.models import Policy
from app.api import mock_providers, vehicles, quotes, policies

# Initialize DB tables on import
init_db()

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    # Seed initial sample policies if database is empty so dashboard has test demonstration
    db = SessionLocal()
    try:
        count = db.query(Policy).count()
        if count == 0:
            ref_d = settings.ref_date
            sample_policy = Policy(
                policy_number="AC-2026-1042",
                registration_number="WB02AB1234",
                customer_name="Rahul Sen",
                customer_phone="+91 98300 11111",
                provider="Provider A",
                plan_name="Comprehensive Plus",
                coverage_type="ZERO_DEP",
                idv=325000,
                base_premium=11346.0,
                gst_amount=2042.28,
                total_premium=13388.28,
                addons=json.dumps(["Zero Depreciation", "Roadside Assistance"]),
                start_date=ref_d - timedelta(days=355),
                expiry_date=ref_d + timedelta(days=10), # Expiring in 10 days!
                make="Maruti Suzuki",
                model="Swift",
                variant="VXi",
                fuel_type="Petrol",
                reminder_sent=False
            )
            db.add(sample_policy)
            db.commit()
    except Exception as e:
        print(f"Startup warning during seeding: {e}")
    finally:
        db.close()
    yield

app = FastAPI(
    title=settings.APP_NAME,
    description="AutoCover - Smart Vehicle Insurance Comparison & Policy Management Platform",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(mock_providers.router)
app.include_router(vehicles.router)
app.include_router(quotes.router)
app.include_router(policies.router)

@app.get("/api/health")
def health():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "reference_date": settings.REFERENCE_DATE
    }

# Mount built frontend if available for seamless single-service local execution
import os
from fastapi.staticfiles import StaticFiles

frontend_dist_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))
if os.path.exists(frontend_dist_path):
    app.mount("/", StaticFiles(directory=frontend_dist_path, html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
