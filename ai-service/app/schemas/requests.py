"""
Pydantic schemas for PROBAHO FastAPI endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Any

class DemandForecastRequest(BaseModel):
    facility_id: str
    medicine_id: str
    horizon: int = Field(default=30, ge=1, le=365)
    model: str = Field(default="holt_winters", pattern="^(naive|moving_average|exponential_smoothing|holt_winters)$")

class IngredientRequirementsRequest(BaseModel):
    medicine_id: str
    units_demanded: float = Field(ge=0.0)
    horizon_days: int = Field(default=30, ge=1, le=365)

class SupplierRiskRequest(BaseModel):
    supplier_id: str
    delay_ratio: float = Field(default=0.25, ge=0.0, le=1.0)
    leadtime_variability: float = Field(default=0.20, ge=0.0, le=1.0)
    fulfilment_gap: float = Field(default=0.15, ge=0.0, le=1.0)
    route_concentration: float = Field(default=0.60, ge=0.0, le=1.0)
    cover_ratio: float = Field(default=0.70, ge=0.0, le=1.0)
    custom_weights: Optional[dict[str, float]] = None
    weather_risk_score: Optional[float] = Field(default=None, ge=0.0, le=100.0)
    route_transit_hours: Optional[float] = Field(default=None, ge=0.0)

class DisruptionSimulationRequest(BaseModel):
    shipment_delay_days: int = Field(default=0, ge=0)
    weather_transit_delay_days: Optional[int] = Field(default=0, ge=0)
    supplier_shortfall_pct: float = Field(default=0.0, ge=0.0, le=1.0)
    freight_cost_increase_pct: float = Field(default=0.0, ge=0.0)
    manufacturing_capacity_cut_pct: float = Field(default=0.0, ge=0.0, le=1.0)
    reference_date: str = "2025-07-15"
    horizon: int = Field(default=60, ge=1, le=365)
    external_weather_observation: Optional[dict[str, Any]] = None
    external_route_observation: Optional[dict[str, Any]] = None

class RedistributionOptimizeRequest(BaseModel):
    reference_date: str = "2025-07-15"

class ExpiryAnalysisRequest(BaseModel):
    reference_date: str = "2025-07-15"
    horizon: int = Field(default=90, ge=1, le=365)

class CopilotExplainRequest(BaseModel):
    question: str
    language: str = Field(default="en", pattern="^(en|bn)$")
    context_tools: Optional[dict[str, Any]] = None

