import os
from datetime import date
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "AutoCover API"
    PORT: int = 8000
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./autocover.db")
    REFERENCE_DATE: str = os.getenv("REFERENCE_DATE", "2026-11-10")
    MOCK_SERVICE_URL: str = os.getenv("MOCK_SERVICE_URL", "http://127.0.0.1:8000/api/mock")
    
    # Provider simulation configs
    PROVIDER_B_LATENCY_SECONDS: float = float(os.getenv("PROVIDER_B_LATENCY_SECONDS", "1.5"))
    PROVIDER_D_FAILURE_RATE: float = float(os.getenv("PROVIDER_D_FAILURE_RATE", "0.0")) # 0.0 to 1.0
    
    # Path to original data files (relative to project root)
    DATA_DIR: str = os.getenv("DATA_DIR", os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "data")))

    @property
    def ref_date(self) -> date:
        return date.fromisoformat(self.REFERENCE_DATE)

settings = Settings()
