"""
Integration tests for the modular API routes matching the specification.
Verifies:
- GET /ai/health
- POST /ai/forecast/demand
- POST /ai/forecast/api-requirements
- POST /ai/risk/supplier
- POST /ai/simulate/disruption
- POST /ai/optimize/redistribution
- POST /ai/expiry/analyze
"""

import pytest
from httpx import ASGITransport, AsyncClient
from main import app

@pytest.mark.asyncio
async def test_health_check():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        res = await ac.get("/ai/health")
        assert res.status_code == 200
        assert res.json()["status"] == "healthy"

@pytest.mark.asyncio
async def test_forecast_demand():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "facility_id": "FAC-001",
            "medicine_id": "MED-001",
            "horizon": 15,
            "model": "moving_average"
        }
        res = await ac.post("/ai/forecast/demand", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert len(data["forecast"]) == 15
        assert data["data_label"] == "Synthetic data"

@pytest.mark.asyncio
async def test_api_requirements_forecast():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "medicine_id": "MED-001",
            "units_demanded": 10000,
            "horizon_days": 30
        }
        res = await ac.post("/ai/forecast/api-requirements", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert data["finished_units_demanded"] == 10000
        assert data["required_active_pharmaceutical_ingredient_kg"] > 0

@pytest.mark.asyncio
async def test_supplier_risk():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "supplier_id": "SUP-001",
            "delay_ratio": 0.4,
            "leadtime_variability": 0.3,
            "fulfilment_gap": 0.2,
            "route_concentration": 0.7,
            "cover_ratio": 0.6
        }
        res = await ac.post("/ai/risk/supplier", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert 0 <= data["risk_score"] <= 100
        assert data["risk_tier"] in ("LOW", "MEDIUM", "HIGH")

@pytest.mark.asyncio
async def test_disruption_simulation():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "shipment_delay_days": 7,
            "supplier_shortfall_pct": 0.2,
            "manufacturing_capacity_cut_pct": 0.1,
            "freight_cost_increase_pct": 0.3,
            "horizon": 30
        }
        res = await ac.post("/ai/simulate/disruption", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "baseline" in data
        assert "disrupted" in data
        assert "propagation_path" in data

@pytest.mark.asyncio
async def test_redistribution_optimization():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "reference_date": "2025-07-15"
        }
        res = await ac.post("/ai/optimize/redistribution", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "transfers" in data
        assert "days_of_cover_before" in data
        assert "days_of_cover_after" in data

@pytest.mark.asyncio
async def test_expiry_analysis():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        payload = {
            "reference_date": "2025-07-15",
            "horizon": 60
        }
        res = await ac.post("/ai/expiry/analyze", json=payload)
        assert res.status_code == 200
        data = res.json()
        assert "expiry_exposure_alerts" in data

