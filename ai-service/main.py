"""
PROBAHO (প্রবাহ) - Medicine Supply Chain Decision-Support Platform
AI Service - FastAPI Main Application

Active Pharmaceutical Ingredient suppliers, manufacturers, warehouses, and health
facilities are modeled as nodes in the supply chain network.
"""

import os
import json
from datetime import date, datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Load environment variables
load_dotenv()

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------

app = FastAPI(
    title="PROBAHO AI Service",
    description=(
        "প্রবাহ — Medicine supply chain decision-support platform for Bangladesh. "
        "Provides forecasting, disruption simulation, redistribution optimization, "
        "inventory intelligence, and an AI copilot."
    ),
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include structured app API routes matching specification
from app.api.routes import router as modular_api_router
app.include_router(modular_api_router, prefix="/ai")

# ---------------------------------------------------------------------------
# Lazy-loaded singletons
# ---------------------------------------------------------------------------

_data_cache = None
_audit_log = None


def _get_data():
    """Load seed data, generating if files don't exist."""
    global _data_cache
    if _data_cache is None:
        from seed.generator import generate_all, load_data

        data_dir = os.path.join(os.path.dirname(__file__), "data")
        if not os.path.exists(os.path.join(data_dir, "facilities.json")):
            generate_all()
        _data_cache = load_data()
    return _data_cache


def _get_audit_log():
    """Get or create the audit log singleton."""
    global _audit_log
    if _audit_log is None:
        from audit.engine import AuditLog

        audit_path = os.path.join(os.path.dirname(__file__), "data", "audit_log.json")
        if os.path.exists(audit_path):
            _audit_log = AuditLog.load(audit_path)
        else:
            _audit_log = AuditLog()
    return _audit_log


def _save_audit_log():
    """Persist audit log to disk."""
    audit = _get_audit_log()
    audit_path = os.path.join(os.path.dirname(__file__), "data", "audit_log.json")
    os.makedirs(os.path.dirname(audit_path), exist_ok=True)
    audit.save(audit_path)


# ---------------------------------------------------------------------------
# Request / Response models
# ---------------------------------------------------------------------------


class ForecastRequest(BaseModel):
    facility_id: str
    medicine_id: str
    horizon: int = Field(default=30, ge=1, le=365)
    model: str = Field(default="holt_winters", pattern="^(naive|moving_average|exponential_smoothing|holt_winters)$")


class SimulationRequest(BaseModel):
    shipment_delay_days: int = Field(default=0, ge=0)
    supplier_shortfall_pct: float = Field(default=0.0, ge=0.0, le=1.0)
    freight_cost_increase_pct: float = Field(default=0.0, ge=0.0)
    manufacturing_capacity_cut_pct: float = Field(default=0.0, ge=0.0, le=1.0)
    reference_date: str = "2025-07-15"
    horizon: int = Field(default=90, ge=1, le=365)


class OptimizeRequest(BaseModel):
    reference_date: str = "2025-07-15"


class CopilotRequest(BaseModel):
    question: str
    language: str = Field(default="en", pattern="^(en|bn)$")


class ApproveRequest(BaseModel):
    recommendation_id: str
    action: str = Field(pattern="^(approve|reject)$")
    user_name: str
    reason: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@app.get("/ai/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "PROBAHO AI Service",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/ai/seed-data")
async def get_seed_data():
    """Return all seed data (facilities, medicines, etc.)."""
    data = _get_data()
    return {
        "facilities": data["facilities"],
        "medicines": data["medicines"],
        "batches": data["batches"],
        "routes": data["routes"],
        "safety_stock": data["safety_stock"],
        "consumption_records": len(data["consumption"]),
    }


@app.post("/ai/forecast")
async def forecast(request: ForecastRequest):
    """Generate demand forecast for a facility/medicine pair."""
    data = _get_data()

    # Filter consumption for this facility/medicine
    consumption = [
        r for r in data["consumption"]
        if r["facility_id"] == request.facility_id
        and r["medicine_id"] == request.medicine_id
    ]
    if not consumption:
        raise HTTPException(
            status_code=404,
            detail=f"No consumption data for facility={request.facility_id}, medicine={request.medicine_id}",
        )

    # Sort by date and extract quantities
    consumption.sort(key=lambda r: r["date"])
    history = [r["quantity"] for r in consumption]

    from forecasting.models import (
        naive_forecast,
        moving_average_forecast,
        exponential_smoothing_forecast,
        holt_winters_forecast,
    )

    model_map = {
        "naive": naive_forecast,
        "moving_average": moving_average_forecast,
        "exponential_smoothing": exponential_smoothing_forecast,
        "holt_winters": holt_winters_forecast,
    }

    model_fn = model_map[request.model]
    result = model_fn(history, request.horizon)

    return {
        "facility_id": request.facility_id,
        "medicine_id": request.medicine_id,
        "model": request.model,
        "horizon": request.horizon,
        "forecast": result["forecast"],
        "lower": result["lower"],
        "upper": result["upper"],
    }


@app.post("/ai/simulate")
async def simulate(request: SimulationRequest):
    """Run disruption simulation."""
    data = _get_data()

    from simulator.engine import simulate as run_simulation

    scenario = {
        "shipment_delay_days": request.shipment_delay_days,
        "supplier_shortfall_pct": request.supplier_shortfall_pct,
        "freight_cost_increase_pct": request.freight_cost_increase_pct,
        "manufacturing_capacity_cut_pct": request.manufacturing_capacity_cut_pct,
    }

    result = run_simulation(
        data=data,
        scenario=scenario,
        reference_date=request.reference_date,
        horizon=request.horizon,
    )

    # Log simulation event
    audit = _get_audit_log()
    audit.log_event("simulation_run", {
        "scenario": scenario,
        "reference_date": request.reference_date,
        "horizon": request.horizon,
    })
    _save_audit_log()

    return result


@app.post("/ai/optimize")
async def optimize(request: OptimizeRequest):
    """Run redistribution optimization."""
    data = _get_data()

    from inventory.days_of_cover import get_inventory_status
    from forecasting.models import holt_winters_forecast
    from optimizer.engine import optimize_redistribution

    # Build forecasts for inventory status
    forecasts = {}
    for fac in data["facilities"]:
        if fac.get("type") != "facility":
            continue
        for med in data["medicines"]:
            consumption = [
                r for r in data["consumption"]
                if r["facility_id"] == fac["id"]
                and r["medicine_id"] == med["id"]
            ]
            if consumption:
                consumption.sort(key=lambda r: r["date"])
                history = [r["quantity"] for r in consumption]
                fc = holt_winters_forecast(history, 30)
                forecasts[(fac["id"], med["id"])] = fc

    inventory_status = get_inventory_status(data, forecasts, request.reference_date)
    result = optimize_redistribution(data, inventory_status, request.reference_date)

    # Log optimization event
    audit = _get_audit_log()
    audit.log_event("optimization_run", {
        "reference_date": request.reference_date,
        "num_transfers": len(result.get("transfers", [])),
        "total_cost": result.get("total_cost", 0),
    })
    _save_audit_log()

    return result


@app.get("/ai/inventory")
async def inventory(reference_date: str = "2025-07-15"):
    """Get inventory status: days of cover and expiry alerts."""
    data = _get_data()

    from inventory.days_of_cover import get_inventory_status
    from inventory.expiry import get_expiry_alerts
    from forecasting.models import holt_winters_forecast

    # Build forecasts
    forecasts = {}
    for fac in data["facilities"]:
        if fac.get("type") != "facility":
            continue
        for med in data["medicines"]:
            consumption = [
                r for r in data["consumption"]
                if r["facility_id"] == fac["id"]
                and r["medicine_id"] == med["id"]
            ]
            if consumption:
                consumption.sort(key=lambda r: r["date"])
                history = [r["quantity"] for r in consumption]
                fc = holt_winters_forecast(history, 30)
                forecasts[(fac["id"], med["id"])] = fc

    inventory_status = get_inventory_status(data, forecasts, reference_date)
    expiry_alerts = get_expiry_alerts(data, reference_date)

    return {
        "reference_date": reference_date,
        "inventory_status": inventory_status,
        "expiry_alerts": expiry_alerts,
    }


@app.post("/ai/copilot")
async def copilot(request: CopilotRequest):
    """AI copilot for supply chain queries."""
    data = _get_data()

    from copilot.engine import copilot_query
    from inventory.days_of_cover import get_inventory_status
    from inventory.expiry import get_expiry_alerts
    from forecasting.models import holt_winters_forecast

    # Build context from tools
    reference_date = "2025-07-15"
    forecasts = {}
    for fac in data["facilities"]:
        if fac.get("type") != "facility":
            continue
        for med in data["medicines"]:
            consumption = [
                r for r in data["consumption"]
                if r["facility_id"] == fac["id"]
                and r["medicine_id"] == med["id"]
            ]
            if consumption:
                consumption.sort(key=lambda r: r["date"])
                history = [r["quantity"] for r in consumption]
                fc = holt_winters_forecast(history, 30)
                forecasts[(fac["id"], med["id"])] = fc

    inventory_status = get_inventory_status(data, forecasts, reference_date)
    expiry_alerts = get_expiry_alerts(data, reference_date)

    # Build tool outputs context
    context_tools = {
        "inventory_status": inventory_status[:10],  # limit for prompt size
        "expiry_alerts": expiry_alerts[:10],
        "facilities": [
            {"id": f["id"], "name": f["name"], "type": f.get("type")}
            for f in data["facilities"]
        ],
        "medicines": data["medicines"],
    }

    result = await copilot_query(
        question=request.question,
        language=request.language,
        data=data,
        context_tools=context_tools,
    )

    # Log copilot query
    audit = _get_audit_log()
    audit.log_event("copilot_query", {
        "question": request.question[:200],
        "language": request.language,
    })
    _save_audit_log()

    return {"question": request.question, "language": request.language, "response": result}


@app.post("/ai/approve")
async def approve_action(request: ApproveRequest):
    """Approve or reject a recommendation."""
    audit = _get_audit_log()

    if request.action == "approve":
        audit.approve(request.recommendation_id, request.user_name, request.reason)
    else:
        audit.reject(request.recommendation_id, request.user_name, request.reason)

    _save_audit_log()

    return {
        "status": "recorded",
        "action": request.action,
        "recommendation_id": request.recommendation_id,
        "user_name": request.user_name,
        "timestamp": datetime.utcnow().isoformat(),
    }


@app.get("/ai/audit")
async def get_audit_log():
    """Return all audit events."""
    audit = _get_audit_log()
    return {"events": audit.get_events()}


@app.get("/ai/verify-audit")
async def verify_audit():
    """Verify the integrity of the audit chain."""
    audit = _get_audit_log()
    result = audit.verify_chain()
    return result


@app.get("/ai/evaluation-report")
async def evaluation_report():
    """Return the forecasting evaluation report."""
    report_path = os.path.join(os.path.dirname(__file__), "evaluation", "report.json")
    if not os.path.exists(report_path):
        raise HTTPException(
            status_code=404,
            detail="Evaluation report not found. Run scripts/run_evaluation.py first.",
        )

    with open(report_path, "r") as f:
        report = json.load(f)
    return report
