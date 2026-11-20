"""
Consolidated FastAPI Router for PROBAHO AI Service.
Exposes the exact requested routes matching the specification.
"""

from fastapi import APIRouter, HTTPException
from datetime import datetime

from app.schemas.requests import (
    DemandForecastRequest,
    IngredientRequirementsRequest,
    SupplierRiskRequest,
    DisruptionSimulationRequest,
    RedistributionOptimizeRequest,
    ExpiryAnalysisRequest,
    CopilotExplainRequest,
)
from app.risk.supplier_risk import calculate_supplier_risk
from seed.generator import load_data, generate_all
from forecasting.models import (
    naive_forecast,
    moving_average_forecast,
    exponential_smoothing_forecast,
    holt_winters_forecast,
)
from simulator.engine import simulate as run_simulation
from optimizer.engine import optimize_redistribution
from inventory.days_of_cover import get_inventory_status
from inventory.expiry import get_expiry_alerts
from copilot.engine import copilot_query

router = APIRouter()

# ---------------------------------------------------------------------------
# Route: GET /ai/health
# ---------------------------------------------------------------------------
@router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "PROBAHO AI Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }

# ---------------------------------------------------------------------------
# Route: POST /ai/forecast/demand
# ---------------------------------------------------------------------------
@router.post("/forecast/demand")
async def forecast_demand(req: DemandForecastRequest):
    data = load_data()
    consumption = [
        r for r in data["consumption"]
        if r["facility_id"] == req.facility_id and r["medicine_id"] == req.medicine_id
    ]
    if not consumption:
        raise HTTPException(
            status_code=404,
            detail=f"No consumption data for facility={req.facility_id}, medicine={req.medicine_id}",
        )

    consumption.sort(key=lambda r: r["date"])
    history = [r["quantity"] for r in consumption]

    model_map = {
        "naive": naive_forecast,
        "moving_average": moving_average_forecast,
        "exponential_smoothing": exponential_smoothing_forecast,
        "holt_winters": holt_winters_forecast,
    }
    model_fn = model_map[req.model]
    result = model_fn(history, req.horizon)

    return {
        "facility_id": req.facility_id,
        "medicine_id": req.medicine_id,
        "model": req.model,
        "horizon": req.horizon,
        "forecast": result["forecast"],
        "lower": result["lower"],
        "upper": result["upper"],
        "data_label": "Synthetic data",
    }

# ---------------------------------------------------------------------------
# Route: POST /ai/forecast/api-requirements (Active Pharmaceutical Ingredient requirements)
# ---------------------------------------------------------------------------
@router.post("/forecast/api-requirements")
async def forecast_ingredient_requirements(req: IngredientRequirementsRequest):
    data = load_data()
    med = next((m for m in data["medicines"] if (m.get("id") == req.medicine_id or m.get("medicine_id") == req.medicine_id)), None)
    if not med:
        raise HTTPException(status_code=404, detail=f"Medicine {req.medicine_id} not found")

    grams_per_unit = float(med.get("ingredient_per_unit_grams", 0.5))
    total_ingredient_kg = round((req.units_demanded * grams_per_unit) / 1000.0, 3)

    return {
        "medicine_id": req.medicine_id,
        "medicine_name": med.get("name", "Medicine"),
        "ingredient_name": med.get("ingredient_name", "Active Pharmaceutical Ingredient"),
        "ingredient_per_unit_grams": grams_per_unit,
        "finished_units_demanded": req.units_demanded,
        "required_active_pharmaceutical_ingredient_kg": total_ingredient_kg,
        "horizon_days": req.horizon_days,
        "data_label": "Synthetic data",
    }

# ---------------------------------------------------------------------------
# Route: POST /ai/risk/supplier
# ---------------------------------------------------------------------------
@router.post("/risk/supplier")
async def evaluate_supplier_risk(req: SupplierRiskRequest):
    supplier_data = {
        "id": req.supplier_id,
        "delay_ratio": req.delay_ratio,
        "leadtime_variability": req.leadtime_variability,
        "fulfilment_gap": req.fulfilment_gap,
        "route_concentration": req.route_concentration,
        "cover_ratio": req.cover_ratio,
        "weather_risk_score": req.weather_risk_score,
        "route_transit_hours": req.route_transit_hours,
    }
    return calculate_supplier_risk(supplier_data, req.custom_weights)

# ---------------------------------------------------------------------------
# Route: POST /ai/simulate/disruption
# ---------------------------------------------------------------------------
@router.post("/simulate/disruption")
async def simulate_disruption(req: DisruptionSimulationRequest):
    data = load_data()
    total_delay = req.shipment_delay_days + (req.weather_transit_delay_days or 0)
    scenario = {
        "shipment_delay_days": total_delay,
        "supplier_shortfall_pct": req.supplier_shortfall_pct,
        "freight_cost_increase_pct": req.freight_cost_increase_pct,
        "manufacturing_capacity_cut_pct": req.manufacturing_capacity_cut_pct,
    }
    raw_result = run_simulation(
        data=data,
        scenario=scenario,
        reference_date=req.reference_date,
        horizon=req.horizon,
    )
    # Sanitize tuple keys for JSON response
    result = {}
    for k, v in raw_result.items():
        if k in ("baseline", "disrupted") and isinstance(v, dict):
            sub = dict(v)
            if "daily_facility_stock" in sub:
                sub["daily_facility_stock"] = {
                    str(day): {f"{fk[0]}:{fk[1]}": fv for fk, fv in stocks.items()}
                    for day, stocks in sub["daily_facility_stock"].items()
                }
            result[k] = sub
        else:
            result[k] = v
    result["data_label"] = "Synthetic data / Simulated"
    if req.weather_transit_delay_days:
        result["external_weather_transit_delay_applied"] = req.weather_transit_delay_days
        result["weather_source"] = "Open-Meteo"
    return result

# ---------------------------------------------------------------------------
# Route: POST /ai/optimize/redistribution
# ---------------------------------------------------------------------------
@router.post("/optimize/redistribution")
async def optimize_transfers(req: RedistributionOptimizeRequest):
    data = load_data()
    forecasts = {}
    for fac in data["facilities"]:
        fid = fac.get("facility_id") or fac.get("id")
        for med in data["medicines"]:
            mid = med.get("medicine_id") or med.get("id")
            consumption = [
                r for r in data["consumption"]
                if r["facility_id"] == fid and r["medicine_id"] == mid
            ]
            if consumption:
                consumption.sort(key=lambda r: r["date"])
                history = [r["quantity"] for r in consumption]
                fc = holt_winters_forecast(history, 30)
                forecasts[(fid, mid)] = fc

    inventory_status = get_inventory_status(data, forecasts, req.reference_date)
    result = optimize_redistribution(data, inventory_status, req.reference_date)
    result["data_label"] = "Synthetic data / Simulated"
    return result

# ---------------------------------------------------------------------------
# Route: POST /ai/expiry/analyze
# ---------------------------------------------------------------------------
@router.post("/expiry/analyze")
async def analyze_expiry(req: ExpiryAnalysisRequest):
    data = load_data()
    alerts = get_expiry_alerts(data, req.reference_date, horizon=req.horizon)
    return {
        "reference_date": req.reference_date,
        "horizon": req.horizon,
        "data_label": "Synthetic data",
        "expiry_exposure_alerts": alerts,
    }

# ---------------------------------------------------------------------------
# Route: POST /ai/copilot/explain
# ---------------------------------------------------------------------------
@router.post("/copilot/explain")
async def copilot_explain(req: CopilotExplainRequest):
    data = load_data()
    context = req.context_tools or {
        "facilities": data["facilities"],
        "medicines": data["medicines"],
    }
    result = await copilot_query(
        question=req.question,
        language=req.language,
        data=data,
        context_tools=context,
    )
    return {
        "question": req.question,
        "language": req.language,
        "response": result,
        "data_label": "Synthetic data explanation",
    }

# ---------------------------------------------------------------------------
# Route: GET /ai/copilot/prompts — Documentation Addendum v1.1 Prompt Library
# ---------------------------------------------------------------------------
@router.get("/copilot/prompts")
async def list_prompt_library():
    from app.copilot.prompts import PROMPT_CATALOG
    return {
        "prompts": PROMPT_CATALOG,
        "count": len(PROMPT_CATALOG),
        "source": "PROBAHO Documentation Addendum v1.1 (Section C)",
    }

# ---------------------------------------------------------------------------
# Route: POST /ai/copilot/prompts/execute — Execute Standardized Prompt
# ---------------------------------------------------------------------------
@router.post("/copilot/prompts/execute")
async def execute_prompt_library_entry(payload: dict):
    from app.copilot.prompts import execute_prompt
    prompt_id = payload.get("prompt_id")
    if not prompt_id:
        raise HTTPException(status_code=400, detail="prompt_id (C1, C2, or C3) is required")
    input_data = payload.get("input_data", {})
    try:
        result = execute_prompt(prompt_id, input_data)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

