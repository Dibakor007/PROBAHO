"""
Property-based tests for the redistribution optimizer.

Verifies:
- No donor goes below safety stock after optimisation
- No facility exceeds capacity
- All transfers use existing routes
- Total cost is non-negative
"""

from __future__ import annotations

import pytest

from optimizer.engine import optimize_redistribution


# ------------------------------------------------------------------
# Shared fixture: minimal but realistic seed data
# ------------------------------------------------------------------

def _make_data():
    """Build a small seed-data dict and matching inventory_status."""
    facilities = [
        {"facility_id": "F1", "capacity": 500},
        {"facility_id": "F2", "capacity": 500},
        {"facility_id": "F3", "capacity": 500},
    ]
    medicines = [
        {"medicine_id": "M1"},
        {"medicine_id": "M2"},
    ]
    # F1 has surplus M1; F2 needs M1; F3 is balanced
    batches = [
        {"facility_id": "F1", "medicine_id": "M1", "quantity": 200, "expiry_date": "2025-12-31"},
        {"facility_id": "F1", "medicine_id": "M2", "quantity": 100, "expiry_date": "2025-12-31"},
        {"facility_id": "F2", "medicine_id": "M1", "quantity": 10, "expiry_date": "2025-12-31"},
        {"facility_id": "F2", "medicine_id": "M2", "quantity": 80, "expiry_date": "2025-12-31"},
        {"facility_id": "F3", "medicine_id": "M1", "quantity": 60, "expiry_date": "2025-12-31"},
        {"facility_id": "F3", "medicine_id": "M2", "quantity": 60, "expiry_date": "2025-12-31"},
    ]
    routes = [
        {"from_id": "F1", "to_id": "F2", "cost_per_unit": 2.0, "lead_time_days": 1},
        {"from_id": "F2", "to_id": "F1", "cost_per_unit": 2.0, "lead_time_days": 1},
        {"from_id": "F1", "to_id": "F3", "cost_per_unit": 3.0, "lead_time_days": 2},
        {"from_id": "F3", "to_id": "F1", "cost_per_unit": 3.0, "lead_time_days": 2},
        {"from_id": "F2", "to_id": "F3", "cost_per_unit": 2.5, "lead_time_days": 1},
        {"from_id": "F3", "to_id": "F2", "cost_per_unit": 2.5, "lead_time_days": 1},
    ]
    safety_stock = [
        {"facility_id": "F1", "medicine_id": "M1", "safety_stock": 30},
        {"facility_id": "F1", "medicine_id": "M2", "safety_stock": 20},
        {"facility_id": "F2", "medicine_id": "M1", "safety_stock": 30},
        {"facility_id": "F2", "medicine_id": "M2", "safety_stock": 20},
        {"facility_id": "F3", "medicine_id": "M1", "safety_stock": 30},
        {"facility_id": "F3", "medicine_id": "M2", "safety_stock": 20},
    ]

    data = {
        "facilities": facilities,
        "medicines": medicines,
        "batches": batches,
        "routes": routes,
        "safety_stock": safety_stock,
    }

    inventory_status = [
        {"facility_id": "F1", "medicine_id": "M1", "days_of_cover": 20.0, "usable_stock": 200, "forecast_daily": 10.0},
        {"facility_id": "F1", "medicine_id": "M2", "days_of_cover": 10.0, "usable_stock": 100, "forecast_daily": 10.0},
        {"facility_id": "F2", "medicine_id": "M1", "days_of_cover": 1.0, "usable_stock": 10, "forecast_daily": 10.0},
        {"facility_id": "F2", "medicine_id": "M2", "days_of_cover": 8.0, "usable_stock": 80, "forecast_daily": 10.0},
        {"facility_id": "F3", "medicine_id": "M1", "days_of_cover": 6.0, "usable_stock": 60, "forecast_daily": 10.0},
        {"facility_id": "F3", "medicine_id": "M2", "days_of_cover": 6.0, "usable_stock": 60, "forecast_daily": 10.0},
    ]
    return data, inventory_status


@pytest.fixture
def result():
    """Run the optimizer once and return the result dict."""
    data, inv = _make_data()
    return optimize_redistribution(data, inv, reference_date="2025-07-15")


@pytest.fixture
def data_and_inv():
    return _make_data()


# ------------------------------------------------------------------
# Property tests
# ------------------------------------------------------------------

class TestOptimizerProperties:
    """Invariants that must hold for any valid solution."""

    def test_solver_finds_solution(self, result: dict) -> None:
        assert result["solver_status"] in ("OPTIMAL", "FEASIBLE")

    def test_no_donor_below_safety_stock(self, result: dict, data_and_inv) -> None:
        """After transfers, no facility's stock for any medicine drops below safety."""
        data, inv = data_and_inv
        safety_map = {
            (s["facility_id"], s["medicine_id"]): s["safety_stock"]
            for s in data["safety_stock"]
        }
        stock_map = {
            (e["facility_id"], e["medicine_id"]): e["usable_stock"]
            for e in inv
        }
        # Apply transfers
        for t in result["transfers"]:
            stock_map[(t["from_id"], t["medicine_id"])] -= t["quantity"]
            key_to = (t["to_id"], t["medicine_id"])
            stock_map[key_to] = stock_map.get(key_to, 0) + t["quantity"]

        for key, remaining in stock_map.items():
            ss = safety_map.get(key, 0)
            assert remaining >= ss, (
                f"Facility {key[0]} medicine {key[1]}: "
                f"remaining {remaining} < safety {ss}"
            )

    def test_no_facility_exceeds_capacity(self, result: dict, data_and_inv) -> None:
        """Total stock at each facility must not exceed capacity."""
        data, inv = data_and_inv
        cap = {f["facility_id"]: f["capacity"] for f in data["facilities"]}
        stock_map = {
            (e["facility_id"], e["medicine_id"]): e["usable_stock"]
            for e in inv
        }
        for t in result["transfers"]:
            stock_map[(t["from_id"], t["medicine_id"])] -= t["quantity"]
            key_to = (t["to_id"], t["medicine_id"])
            stock_map[key_to] = stock_map.get(key_to, 0) + t["quantity"]

        # Sum per facility
        facility_totals: dict[str, int] = {}
        for (fid, _), qty in stock_map.items():
            facility_totals[fid] = facility_totals.get(fid, 0) + qty

        for fid, total in facility_totals.items():
            assert total <= cap[fid], (
                f"Facility {fid}: total {total} > capacity {cap[fid]}"
            )

    def test_all_transfers_use_existing_routes(self, result: dict, data_and_inv) -> None:
        """Every transfer must correspond to a defined route."""
        data, _ = data_and_inv
        valid_routes = {
            (r["from_id"], r["to_id"]) for r in data["routes"]
        }
        for t in result["transfers"]:
            pair = (t["from_id"], t["to_id"])
            assert pair in valid_routes, (
                f"Transfer {pair} not in routes: {valid_routes}"
            )

    def test_total_cost_non_negative(self, result: dict) -> None:
        """Total cost must be >= 0."""
        assert result["total_cost"] >= 0

    def test_transfers_have_required_fields(self, result: dict) -> None:
        """Each transfer dict must contain the specified keys."""
        required = {"from_id", "to_id", "medicine_id", "quantity", "cost", "route_lead_time"}
        for t in result["transfers"]:
            assert required.issubset(t.keys()), f"Missing keys in {t}"

    def test_days_of_cover_reported(self, result: dict) -> None:
        """Result must include days-of-cover metrics."""
        assert "days_of_cover_before" in result
        assert "days_of_cover_after" in result
        assert "min_days_of_cover" in result
        assert "spread_days_of_cover" in result
