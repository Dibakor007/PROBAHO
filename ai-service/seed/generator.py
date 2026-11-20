"""
Seed data generator for PROBAHO (প্রবাহ).

Generates synthetic supply-chain data for demonstration and pipeline
validation.  Every run with the same *seed* (default 42) produces
bit-identical JSON files so that downstream tests are deterministic.

Terminology note
~~~~~~~~~~~~~~~~
"Active Pharmaceutical Ingredient" is always written in full in prose.
In code identifiers we use ``ingredient`` (e.g. ``ingredient_stock``,
``ingredient_per_unit``) to keep names concise without the ambiguous
abbreviation "API", which we reserve for software REST APIs.
"""

from __future__ import annotations

import json
import math
import os
import random
from datetime import date, timedelta
from pathlib import Path
from typing import Any

import numpy as np

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
SEED = 42
REFERENCE_DATE = date(2025, 7, 15)
CONSUMPTION_START = date(2024, 7, 15)
CONSUMPTION_DAYS = 365
DATA_DIR = Path(__file__).resolve().parent.parent / "data"


# ---------------------------------------------------------------------------
# Node definitions
# ---------------------------------------------------------------------------

def _supplier() -> dict:
    return {
        "id": "SUP-001",
        "name": "Dhaka Pharma Ingredients Ltd",
        "location": "Dhaka",
        "coords": [23.8103, 90.4125],
        "type": "supplier",
    }


def _manufacturer() -> dict:
    return {
        "id": "MFG-001",
        "name": "Bengal Pharma Manufacturing",
        "location": "Gazipur",
        "coords": [24.0, 90.43],
        "type": "manufacturer",
        "capacity_units_per_day": 10000,
        "production_lag_days": 2,
        "ingredient_per_unit": 0.5,
    }


def _warehouse() -> dict:
    return {
        "id": "WH-001",
        "name": "Central Medical Store Depot",
        "location": "Dhaka",
        "coords": [23.78, 90.40],
        "type": "warehouse",
    }


def _facilities() -> list[dict]:
    uhcs = [
        {
            "id": "FAC-001",
            "name": "সাভার উপজেলা স্বাস্থ্য কমপ্লেক্স",
            "name_en": "Savar Upazila Health Complex",
            "location": "Savar",
            "coords": [23.8583, 90.2567],
            "type": "facility",
            "subtype": "upazila_health_complex",
            "capacity": 5000,
        },
        {
            "id": "FAC-002",
            "name": "দোহার উপজেলা স্বাস্থ্য কমপ্লেক্স",
            "name_en": "Dohar Upazila Health Complex",
            "location": "Dohar",
            "coords": [23.59, 90.13],
            "type": "facility",
            "subtype": "upazila_health_complex",
            "capacity": 5000,
        },
        {
            "id": "FAC-003",
            "name": "কেরানীগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স",
            "name_en": "Keraniganj Upazila Health Complex",
            "location": "Keraniganj",
            "coords": [23.70, 90.34],
            "type": "facility",
            "subtype": "upazila_health_complex",
            "capacity": 5000,
        },
    ]
    ccs = [
        {
            "id": "FAC-004",
            "name": "হাসনাবাদ কমিউনিটি ক্লিনিক",
            "name_en": "Hasnabad Community Clinic",
            "location": "Hasnabad",
            "coords": [23.87, 90.26],
            "type": "facility",
            "subtype": "community_clinic",
            "capacity": 2000,
        },
        {
            "id": "FAC-005",
            "name": "নবাবগঞ্জ কমিউনিটি ক্লিনিক",
            "name_en": "Nabagram Community Clinic",
            "location": "Nabagram",
            "coords": [23.58, 90.12],
            "type": "facility",
            "subtype": "community_clinic",
            "capacity": 2000,
        },
        {
            "id": "FAC-006",
            "name": "তেঘরিয়া কমিউনিটি ক্লিনিক",
            "name_en": "Teghoria Community Clinic",
            "location": "Teghoria",
            "coords": [23.71, 90.35],
            "type": "facility",
            "subtype": "community_clinic",
            "capacity": 2000,
        },
    ]
    return uhcs + ccs


# ---------------------------------------------------------------------------
# Medicines
# ---------------------------------------------------------------------------

MEDICINES: list[dict] = [
    {"id": "MED-001", "name": "Paracetamol 500mg", "form": "tablet"},
    {"id": "MED-002", "name": "Amoxicillin 500mg", "form": "capsule"},
    {"id": "MED-003", "name": "Metformin 500mg", "form": "tablet"},
    {"id": "MED-004", "name": "Omeprazole 20mg", "form": "capsule"},
    {"id": "MED-005", "name": "ORS Sachets", "form": "sachet"},
]


# Base daily consumption ranges: {medicine_id: {subtype: (low, high)}}
_BASE_CONSUMPTION: dict[str, dict[str, tuple[int, int]]] = {
    "MED-001": {"upazila_health_complex": (40, 80), "community_clinic": (15, 30)},
    "MED-002": {"upazila_health_complex": (20, 40), "community_clinic": (8, 15)},
    "MED-003": {"upazila_health_complex": (15, 30), "community_clinic": (5, 12)},
    "MED-004": {"upazila_health_complex": (10, 20), "community_clinic": (4, 8)},
    "MED-005": {"upazila_health_complex": (15, 30), "community_clinic": (5, 15)},
}


# ---------------------------------------------------------------------------
# Batch generation
# ---------------------------------------------------------------------------

def _generate_batches(
    rng: random.Random,
    np_rng: np.random.Generator,
    facilities: list[dict],
    medicines: list[dict],
) -> list[dict]:
    """Create 3-5 batches per medicine per facility, qty 100-500."""
    batches: list[dict] = []
    batch_counter = 0
    for fac in facilities:
        for med in medicines:
            n_batches = rng.randint(3, 5)
            for _ in range(n_batches):
                batch_counter += 1
                qty = rng.randint(100, 500)

                # Expiry: most 1-2 years out, some within 30 days, some already expired
                expiry_bucket = rng.random()
                if expiry_bucket < 0.10:
                    # Already expired (1-60 days ago)
                    days_offset = -rng.randint(1, 60)
                elif expiry_bucket < 0.25:
                    # Expires within 30 days
                    days_offset = rng.randint(1, 30)
                else:
                    # 1-2 years out
                    days_offset = rng.randint(365, 730)

                expiry = REFERENCE_DATE + timedelta(days=days_offset)

                batches.append({
                    "id": f"BAT-{batch_counter:04d}",
                    "medicine_id": med["id"],
                    "facility_id": fac["id"],
                    "quantity": qty,
                    "manufacture_date": str(expiry - timedelta(days=rng.randint(365, 730))),
                    "expiry_date": str(expiry),
                })
    return batches


# ---------------------------------------------------------------------------
# Consumption generation (365 days with seasonality & noise)
# ---------------------------------------------------------------------------

def _seasonality_factor(d: date, medicine_id: str) -> float:
    """Return a multiplicative seasonality factor for a given date/medicine."""
    month = d.month
    if medicine_id == "MED-005":
        # ORS: 2× during monsoon Jun-Sep
        if 6 <= month <= 9:
            return 2.0
    if medicine_id == "MED-002":
        # Amoxicillin: slight winter bump (Nov-Feb)
        if month in (11, 12, 1, 2):
            return 1.25
    return 1.0


def _generate_consumption(
    rng: random.Random,
    np_rng: np.random.Generator,
    facilities: list[dict],
    medicines: list[dict],
) -> list[dict]:
    """Generate 365 days of daily consumption records with seasonality and noise."""
    records: list[dict] = []
    for fac in facilities:
        subtype = fac["subtype"]
        for med in medicines:
            low, high = _BASE_CONSUMPTION[med["id"]][subtype]
            base_mean = (low + high) / 2.0
            noise_std = base_mean * 0.10  # 10% Gaussian noise

            for day_offset in range(CONSUMPTION_DAYS):
                current_date = CONSUMPTION_START + timedelta(days=day_offset)
                seasonal = _seasonality_factor(current_date, med["id"])
                value = base_mean * seasonal + np_rng.normal(0, noise_std)
                value = max(0.0, value)  # clip >= 0
                records.append({
                    "facility_id": fac["id"],
                    "medicine_id": med["id"],
                    "date": str(current_date),
                    "quantity": round(value, 2),
                })
    return records


# ---------------------------------------------------------------------------
# Safety stock
# ---------------------------------------------------------------------------

def _generate_safety_stock(
    facilities: list[dict],
    medicines: list[dict],
    consumption: list[dict],
) -> list[dict]:
    """Safety stock = 14 days × average daily consumption."""
    # Build lookup of average daily consumption
    from collections import defaultdict
    totals: dict[tuple[str, str], list[float]] = defaultdict(list)
    for rec in consumption:
        totals[(rec["facility_id"], rec["medicine_id"])].append(rec["quantity"])

    safety: list[dict] = []
    for fac in facilities:
        for med in medicines:
            key = (fac["id"], med["id"])
            vals = totals.get(key, [])
            avg_daily = sum(vals) / len(vals) if vals else 0.0
            rounded_avg = round(avg_daily, 2)
            safety.append({
                "facility_id": fac["id"],
                "medicine_id": med["id"],
                "average_daily_consumption": rounded_avg,
                "safety_stock_days": 14,
                "safety_stock_quantity": round(rounded_avg * 14, 2),
            })
    return safety


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

def _generate_routes(
    rng: random.Random,
    facilities: list[dict],
) -> list[dict]:
    """
    Routes from warehouse to each facility, plus some inter-facility routes.
    UHC lead time 1-2 days, CC lead time 2-3 days.
    """
    routes: list[dict] = []
    route_counter = 0

    # Warehouse → each facility
    for fac in facilities:
        route_counter += 1
        if fac["subtype"] == "upazila_health_complex":
            lead = rng.randint(1, 2)
        else:
            lead = rng.randint(2, 3)
        routes.append({
            "id": f"RT-{route_counter:03d}",
            "from_id": "WH-001",
            "to_id": fac["id"],
            "lead_time_days": lead,
            "cost_per_unit": round(rng.uniform(0.5, 2.0), 2),
        })

    # Inter-facility routes (some pairs, 1-3 day lead time)
    pairs = [
        ("FAC-001", "FAC-004"),  # Savar UHC ↔ Hasnabad CC
        ("FAC-002", "FAC-005"),  # Dohar UHC ↔ Nabagram CC
        ("FAC-003", "FAC-006"),  # Keraniganj UHC ↔ Teghoria CC
        ("FAC-001", "FAC-002"),  # Savar ↔ Dohar
    ]
    for src, dst in pairs:
        route_counter += 1
        routes.append({
            "id": f"RT-{route_counter:03d}",
            "from_id": src,
            "to_id": dst,
            "lead_time_days": rng.randint(1, 3),
            "cost_per_unit": round(rng.uniform(0.5, 2.0), 2),
        })

    return routes


# ---------------------------------------------------------------------------
# Public entry-points
# ---------------------------------------------------------------------------

def generate_all(seed: int = SEED, data_dir: Path | None = None) -> dict[str, Any]:
    """
    Generate every dataset and write JSON files to *data_dir*.

    Returns the full data dict keyed by dataset name.
    """
    data_dir = data_dir or DATA_DIR
    data_dir.mkdir(parents=True, exist_ok=True)

    # Seed both stdlib random and numpy for reproducibility
    rng = random.Random(seed)
    np_rng = np.random.default_rng(seed)

    # --- build nodes ---
    supplier = _supplier()
    manufacturer = _manufacturer()
    warehouse = _warehouse()
    facilities = _facilities()

    all_nodes = [supplier, manufacturer, warehouse] + facilities
    medicines = list(MEDICINES)

    # --- dependent datasets ---
    batches = _generate_batches(rng, np_rng, facilities, medicines)
    consumption = _generate_consumption(rng, np_rng, facilities, medicines)
    safety_stock = _generate_safety_stock(facilities, medicines, consumption)
    routes = _generate_routes(rng, facilities)

    datasets: dict[str, Any] = {
        "facilities": all_nodes,
        "medicines": medicines,
        "batches": batches,
        "consumption": consumption,
        "routes": routes,
        "safety_stock": safety_stock,
    }

    for name, payload in datasets.items():
        path = data_dir / f"{name}.json"
        with open(path, "w", encoding="utf-8") as fh:
            json.dump(payload, fh, indent=2, ensure_ascii=False)

    return datasets


def load_data(data_dir: Path | None = None) -> dict[str, Any]:
    """
    Load previously generated JSON files from *data_dir*.

    If the files do not exist, calls :func:`generate_all` first.
    """
    data_dir = data_dir or DATA_DIR
    names = ["facilities", "medicines", "batches", "consumption", "routes", "safety_stock"]

    # Auto-generate if missing
    if not all((data_dir / f"{n}.json").exists() for n in names):
        return generate_all(data_dir=data_dir)

    result: dict[str, Any] = {}
    for name in names:
        with open(data_dir / f"{name}.json", "r", encoding="utf-8") as fh:
            result[name] = json.load(fh)
    return result


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    datasets = generate_all()
    for name, payload in datasets.items():
        count = len(payload) if isinstance(payload, list) else 1
        print(f"  {name}: {count} records → data/{name}.json")
    print("Seed data generation complete.")
