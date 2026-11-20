"""
Disruption simulator for the PROBAHO medicine supply chain.

Daily discrete-event simulation over a configurable horizon (default 90 days).
Models the full pipeline from Active Pharmaceutical Ingredient arrivals through
manufacturing, warehousing, and facility-level dispensing.

Terminology note: "Active Pharmaceutical Ingredient" is always written in full
in comments and documentation. "ingredient" is used in code identifiers.
"API" refers only to software REST APIs, never to pharmaceutical ingredients.
"""

from datetime import datetime, date, timedelta
from typing import Any
import copy


def _parse_date(d: Any) -> date:
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    return datetime.strptime(str(d), "%Y-%m-%d").date()


def _default_scenario() -> dict:
    return {
        "shipment_delay_days": 0,
        "supplier_shortfall_pct": 0.0,
        "freight_cost_increase_pct": 0.0,
        "manufacturing_capacity_cut_pct": 0.0,
    }


def _compute_avg_demand(data: dict) -> dict[tuple[str, str], float]:
    """Return average daily demand per (facility_id, medicine_id)."""
    consumption_sums: dict[tuple[str, str], list[float]] = {}
    for rec in data.get("consumption", []):
        key = (str(rec["facility_id"]), str(rec["medicine_id"]))
        consumption_sums.setdefault(key, []).append(float(rec["quantity"]))
    return {
        k: sum(v) / len(v) if v else 0.0 for k, v in consumption_sums.items()
    }


def _initial_facility_stock(data: dict, ref: date) -> dict[tuple[str, str], float]:
    """Sum usable batch quantities per (facility_id, medicine_id)."""
    stock: dict[tuple[str, str], float] = {}
    for batch in data.get("batches", []):
        expiry = _parse_date(batch["expiry_date"])
        if expiry <= ref:
            continue
        key = (str(batch["facility_id"]), str(batch["medicine_id"]))
        stock[key] = stock.get(key, 0.0) + float(batch["quantity"])
    return stock


def _run_simulation(
    data: dict,
    scenario: dict,
    reference_date: date,
    horizon: int,
) -> dict:
    """
    Run a single simulation pass with the given scenario parameters.

    Returns a dict with:
      - daily_facility_stock: nested dict of stock levels
      - stockout_dates: {facility_id: {medicine_id: first_stockout_day or None}}
      - shortage_quantities: {facility_id: {medicine_id: total_unmet_demand}}
      - propagation_path: list of event dicts ordered by day
    """
    ref = reference_date

    # Scenario parameters
    shipment_delay = scenario.get("shipment_delay_days", 0)
    supplier_shortfall = scenario.get("supplier_shortfall_pct", 0.0)
    capacity_cut = scenario.get("manufacturing_capacity_cut_pct", 0.0)

    # Extract facility and medicine IDs
    facility_ids = sorted({str(f.get("facility_id") or f.get("id")) for f in data.get("facilities", [])})
    medicine_ids = sorted({str(m.get("medicine_id") or m.get("id")) for m in data.get("medicines", [])})

    # Average daily demand per (facility, medicine)
    avg_demand = _compute_avg_demand(data)

    # Initial facility stock from batches
    facility_stock = _initial_facility_stock(data, ref)

    # Manufacturing parameters
    BASE_INGREDIENT_ARRIVAL = 5000.0  # units/day of Active Pharmaceutical Ingredient
    INGREDIENT_PER_UNIT = 1.0  # ingredient units per finished medicine unit
    PROD_LAG = 2  # days from production to warehouse availability
    BASE_CAPACITY = 10000.0  # manufacturing capacity units/day

    # Total daily demand across all facilities (for production planning)
    total_daily_demand = sum(
        avg_demand.get((fid, mid), 0.0)
        for fid in facility_ids
        for mid in medicine_ids
    )

    # State
    ingredient_stock = BASE_INGREDIENT_ARRIVAL * 10  # starting ingredient buffer
    warehouse_stock: dict[str, float] = {mid: 2000.0 for mid in medicine_ids}
    production_pipeline: list[tuple[int, dict[str, float]]] = []  # (ready_day, {mid: qty})

    # Shipment pipeline: list of (arrival_day, facility_id, medicine_id, qty)
    shipment_pipeline: list[tuple[int, str, str, float]] = []

    # Tracking
    stockout_dates: dict[str, dict[str, int | None]] = {
        fid: {mid: None for mid in medicine_ids} for fid in facility_ids
    }
    shortage_quantities: dict[str, dict[str, float]] = {
        fid: {mid: 0.0 for mid in medicine_ids} for fid in facility_ids
    }
    propagation_path: list[dict] = []
    daily_facility_stock: dict[int, dict[tuple[str, str], float]] = {}

    for day in range(horizon):
        current_date = ref + timedelta(days=day)

        # --- 1. Active Pharmaceutical Ingredient arrivals ---
        daily_arrival = BASE_INGREDIENT_ARRIVAL * (1.0 - supplier_shortfall)
        ingredient_stock += daily_arrival

        if supplier_shortfall > 0 and day == 0:
            propagation_path.append({
                "node_id": "supplier",
                "day": day,
                "event": "ingredient_shortfall",
                "reason": f"Active Pharmaceutical Ingredient supply reduced by {supplier_shortfall*100:.0f}%",
            })

        # --- 2. Production planning ---
        plan = total_daily_demand  # plan to meet total demand
        effective_capacity = BASE_CAPACITY * (1.0 - capacity_cut)
        ingredient_available_units = ingredient_stock / INGREDIENT_PER_UNIT
        actual_production = min(plan, effective_capacity, ingredient_available_units)

        # Consume ingredient for production
        ingredient_used = actual_production * INGREDIENT_PER_UNIT
        ingredient_stock -= ingredient_used

        if capacity_cut > 0 and day == 0:
            propagation_path.append({
                "node_id": "manufacturer",
                "day": day,
                "event": "capacity_cut",
                "reason": f"Manufacturing capacity reduced by {capacity_cut*100:.0f}%",
            })

        if actual_production < plan and day > 0:
            if ingredient_available_units < plan:
                propagation_path.append({
                    "node_id": "manufacturer",
                    "day": day,
                    "event": "production_limited",
                    "reason": "Active Pharmaceutical Ingredient stock insufficient for planned production",
                })

        # Distribute production evenly across medicines
        production_per_med: dict[str, float] = {}
        if medicine_ids:
            per_med = actual_production / len(medicine_ids)
            for mid in medicine_ids:
                production_per_med[mid] = per_med

        # Add to pipeline with lag
        ready_day = day + PROD_LAG
        production_pipeline.append((ready_day, production_per_med))

        # --- 3. Warehouse receives production from pipeline ---
        for rday, prod_batch in production_pipeline:
            if rday == day:
                for mid, qty in prod_batch.items():
                    warehouse_stock[mid] = warehouse_stock.get(mid, 0.0) + qty

        # --- 4. Warehouse ships to facilities ---
        # Compute current days-of-cover for allocation priority
        facility_doc: list[tuple[float, str, str]] = []
        for fid in facility_ids:
            for mid in medicine_ids:
                key = (fid, mid)
                demand = avg_demand.get(key, 0.0)
                stock = facility_stock.get(key, 0.0)
                doc = stock / demand if demand > 0 else float("inf")
                facility_doc.append((doc, fid, mid))

        # Sort ascending by days-of-cover (neediest first)
        facility_doc.sort(key=lambda x: x[0])

        for doc_val, fid, mid in facility_doc:
            demand = avg_demand.get((fid, mid), 0.0)
            if demand <= 0:
                continue
            # Ship enough for ~7 days or what's available
            desired_shipment = demand * 7
            available = warehouse_stock.get(mid, 0.0)
            ship_qty = min(desired_shipment, available)
            if ship_qty > 0:
                warehouse_stock[mid] -= ship_qty
                arrival_day = day + 1 + shipment_delay
                shipment_pipeline.append((arrival_day, fid, mid, ship_qty))

                if shipment_delay > 0 and day == 0:
                    propagation_path.append({
                        "node_id": "warehouse",
                        "day": day,
                        "event": "shipment_delayed",
                        "reason": f"Shipments delayed by {shipment_delay} days",
                    })

        # --- 5. Facilities receive shipments ---
        for arrival_day, fid, mid, qty in shipment_pipeline:
            if arrival_day == day:
                key = (fid, mid)
                facility_stock[key] = facility_stock.get(key, 0.0) + qty

        # --- 6. Facility consumption ---
        for fid in facility_ids:
            for mid in medicine_ids:
                key = (fid, mid)
                demand = avg_demand.get(key, 0.0)
                stock = facility_stock.get(key, 0.0)
                consumed = min(stock, demand)
                facility_stock[key] = stock - consumed
                unmet = demand - consumed

                if unmet > 0:
                    shortage_quantities[fid][mid] += unmet

                    if stockout_dates[fid][mid] is None:
                        stockout_dates[fid][mid] = day
                        propagation_path.append({
                            "node_id": fid,
                            "day": day,
                            "event": "stockout",
                            "reason": f"Facility stock depleted for medicine {mid}",
                        })

        # Record daily stock snapshot
        daily_facility_stock[day] = dict(facility_stock)

    # Sort propagation path by day
    propagation_path.sort(key=lambda x: x["day"])

    return {
        "daily_facility_stock": daily_facility_stock,
        "stockout_dates": stockout_dates,
        "shortage_quantities": shortage_quantities,
        "propagation_path": propagation_path,
    }


def simulate(
    data: dict,
    scenario: dict | None = None,
    reference_date: str = "2025-07-15",
    horizon: int = 90,
) -> dict:
    """
    Run baseline and disrupted simulations, returning comparative results.

    Parameters
    ----------
    data : dict
        Seed data from load_data(): facilities, medicines, batches, consumption, routes.
    scenario : dict, optional
        Disruption parameters: shipment_delay_days, supplier_shortfall_pct,
        freight_cost_increase_pct, manufacturing_capacity_cut_pct.
    reference_date : str
        Simulation start date (YYYY-MM-DD).
    horizon : int
        Number of days to simulate.

    Returns
    -------
    dict with keys:
        - baseline: full baseline simulation result
        - disrupted: full disrupted simulation result
        - stockout_dates: from disrupted run
        - shortage_quantities: from disrupted run
        - propagation_path: from disrupted run
    """
    ref = _parse_date(reference_date)
    effective_scenario = _default_scenario()
    if scenario:
        effective_scenario.update(scenario)

    # Baseline: no disruption
    baseline_scenario = _default_scenario()
    baseline = _run_simulation(data, baseline_scenario, ref, horizon)

    # Disrupted: with scenario parameters
    disrupted = _run_simulation(data, effective_scenario, ref, horizon)

    return {
        "baseline": baseline,
        "disrupted": disrupted,
        "stockout_dates": disrupted["stockout_dates"],
        "shortage_quantities": disrupted["shortage_quantities"],
        "propagation_path": disrupted["propagation_path"],
    }
