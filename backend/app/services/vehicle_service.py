import json
import re
from datetime import date, datetime
from typing import Optional, Dict
from sqlalchemy.orm import Session
from ..config import settings
from ..models import VehicleOverride
from ..schemas import VehicleModel

def normalize_reg_no(reg_no: str) -> str:
    """
    Standardizes a vehicle registration number:
    - strips spaces, dashes, dots
    - converts to uppercase
    Example: 'WB 02 AB 1234' -> 'WB02AB1234'
    """
    if not reg_no:
        return ""
    return re.sub(r"[^A-Za-z0-9]", "", reg_no).upper()

def parse_date_flexibly(date_str: Optional[str]) -> Optional[date]:
    """
    Parses dates in ISO (YYYY-MM-DD) or Indian standard (DD/MM/YYYY or DD-MM-YYYY).
    """
    if not date_str or not date_str.strip():
        return None
    cleaned = date_str.strip()
    for fmt in ("%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y"):
        try:
            return datetime.strptime(cleaned, fmt).date()
        except ValueError:
            pass
    return None

class VehicleService:
    def __init__(self):
        self._registry: Dict[str, dict] = {}
        self._load_registry()

    def _load_registry(self):
        registry_path = f"{settings.DATA_DIR}/registry.json"
        try:
            with open(registry_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                vehicles = data.get("vehicles", [])
                for v in vehicles:
                    clean_reg = normalize_reg_no(v.get("registration_number", ""))
                    if clean_reg:
                        self._registry[clean_reg] = v
        except Exception as e:
            print(f"Warning: Failed to load registry.json from {registry_path}: {e}")

    def lookup(self, reg_no: str, db: Optional[Session] = None) -> Optional[VehicleModel]:
        clean_reg = normalize_reg_no(reg_no)
        if not clean_reg:
            return None

        # Check for user-defined overrides in database first
        if db:
            override = db.query(VehicleOverride).filter(VehicleOverride.registration_number == clean_reg).first()
            if override:
                return self._build_vehicle_model(
                    {
                        "registration_number": override.registration_number,
                        "make": override.make,
                        "model": override.model,
                        "variant": override.variant,
                        "fuel_type": override.fuel_type,
                        "engine_cc": override.engine_cc,
                        "registration_date": override.registration_date,
                        "rto": override.rto,
                        "ex_showroom_price": override.ex_showroom_price,
                        "current_policy_expiry": override.current_policy_expiry,
                        "claims_last_year": override.claims_last_year,
                        "ncb_percent": override.ncb_percent,
                    },
                    is_registered=True
                )

        # Check static registry
        if clean_reg in self._registry:
            raw = self._registry[clean_reg]
            return self._build_vehicle_model(raw, is_registered=True)

        # Fallback heuristic for vehicles not in registry
        # We allow the user to view a draft vehicle profile and edit/confirm
        return VehicleModel(
            registration_number=clean_reg,
            make="Unknown",
            model="Car",
            variant="Standard",
            fuel_type="Petrol",
            engine_cc=1197,
            registration_date="2023-01-01",
            rto="RTO",
            ex_showroom_price=700000,
            current_policy_expiry=None,
            claims_last_year=0,
            ncb_percent=20,
            is_registered=False,
            days_to_expiry=None,
            expiry_status="UNKNOWN"
        )

    def _build_vehicle_model(self, data: dict, is_registered: bool = True) -> VehicleModel:
        ref_d = settings.ref_date
        expiry_raw = data.get("current_policy_expiry")
        parsed_exp = parse_date_flexibly(expiry_raw)
        
        days_to_expiry = None
        expiry_status = "UNKNOWN"
        if parsed_exp:
            days_to_expiry = (parsed_exp - ref_d).days
            if days_to_expiry < 0:
                expiry_status = "EXPIRED"
            elif days_to_expiry <= 15:
                expiry_status = "EXPIRING_SOON"
            else:
                expiry_status = "ACTIVE"

        fuel = data.get("fuel_type")
        if not fuel:
            # Default missing fuel (like Alto K10 in registry)
            fuel = "Petrol"

        return VehicleModel(
            registration_number=normalize_reg_no(data.get("registration_number", "")),
            make=data.get("make") or "Unknown",
            model=data.get("model") or "Car",
            variant=data.get("variant") or "Standard",
            fuel_type=fuel,
            engine_cc=data.get("engine_cc") or 1197,
            registration_date=data.get("registration_date"),
            rto=data.get("rto") or "Unknown",
            ex_showroom_price=data.get("ex_showroom_price") or 600000,
            current_policy_expiry=expiry_raw,
            claims_last_year=data.get("claims_last_year", 0),
            ncb_percent=data.get("ncb_percent", 0),
            is_registered=is_registered,
            days_to_expiry=days_to_expiry,
            expiry_status=expiry_status
        )

    def save_override(self, vehicle: VehicleModel, db: Session):
        clean_reg = normalize_reg_no(vehicle.registration_number)
        override = db.query(VehicleOverride).filter(VehicleOverride.registration_number == clean_reg).first()
        if not override:
            override = VehicleOverride(registration_number=clean_reg)
            db.add(override)
            
        override.make = vehicle.make
        override.model = vehicle.model
        override.variant = vehicle.variant
        override.fuel_type = vehicle.fuel_type
        override.engine_cc = vehicle.engine_cc
        override.registration_date = vehicle.registration_date
        override.rto = vehicle.rto
        override.ex_showroom_price = vehicle.ex_showroom_price
        override.current_policy_expiry = vehicle.current_policy_expiry
        override.claims_last_year = vehicle.claims_last_year
        override.ncb_percent = vehicle.ncb_percent
        db.commit()

vehicle_service = VehicleService()
