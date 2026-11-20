"""
FEFO (First-Expiry, First-Out) simulation for medicine batch expiry tracking.

Models daily consumption drawing from the earliest-expiring batch first,
to identify batches at risk of expiring with remaining stock (waste).
Active Pharmaceutical Ingredient expiry is handled upstream by the supplier;
this module focuses on finished medicine batches at health facilities.
"""

from datetime import datetime, date, timedelta
from typing import Any


def _parse_date(d: Any) -> date:
    """Parse a date string or return a date object as-is."""
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    return datetime.strptime(str(d), "%Y-%m-%d").date()


def fefo_simulation(
    batches: list[dict],
    daily_consumption: float,
    reference_date: str | date,
    horizon: int = 90,
) -> list[dict]:
    """
    Simulate FEFO consumption of batches over a horizon.

    Parameters
    ----------
    batches : list[dict]
        Each dict: {batch_id, quantity, expiry_date}.
    daily_consumption : float
        Units consumed per day.
    reference_date : str or date
        Simulation start date.
    horizon : int
        Number of days to simulate.

    Returns
    -------
    list[dict]
        Per-batch result: {batch_id, quantity (original), expiry_date,
        consumed_by_expiry, wasted, fully_consumed_date or None,
        status: "consumed" | "expired_waste" | "active"}
    """
    ref = _parse_date(reference_date)

    # Build working copies sorted by expiry date ascending (FEFO order)
    working = []
    for b in batches:
        bid = b.get("batch_id") or b.get("id") or b.get("batch_number", "BAT")
        expiry = _parse_date(b["expiry_date"])
        # Skip batches already expired before simulation start
        if expiry <= ref:
            working.append(
                {
                    "batch_id": bid,
                    "quantity": float(b["quantity"]),
                    "expiry_date": b["expiry_date"],
                    "remaining": 0.0,
                    "consumed_by_expiry": 0.0,
                    "wasted": float(b["quantity"]),
                    "fully_consumed_date": None,
                    "status": "expired_waste",
                    "_expiry": expiry,
                }
            )
            continue

        working.append(
            {
                "batch_id": bid,
                "quantity": float(b["quantity"]),
                "expiry_date": b["expiry_date"],
                "remaining": float(b["quantity"]),
                "consumed_by_expiry": 0.0,
                "wasted": 0.0,
                "fully_consumed_date": None,
                "status": "active",
                "_expiry": expiry,
            }
        )

    # Sort active batches by expiry ascending
    working.sort(key=lambda x: x["_expiry"])

    # Simulate day by day
    for day_offset in range(horizon):
        current_date = ref + timedelta(days=day_offset + 1)
        remaining_demand = daily_consumption

        for batch in working:
            if batch["status"] != "active":
                continue

            # Check if batch expired (strictly past expiry date)
            if current_date > batch["_expiry"]:
                batch["wasted"] = batch["remaining"]
                batch["status"] = "expired_waste"
                batch["remaining"] = 0.0
                continue

            # Consume from this batch
            if remaining_demand <= 0:
                break

            consume = min(batch["remaining"], remaining_demand)
            batch["remaining"] -= consume
            batch["consumed_by_expiry"] += consume
            remaining_demand -= consume

            if batch["remaining"] <= 0:
                batch["fully_consumed_date"] = str(current_date)
                batch["status"] = "consumed"

    # Build result list
    results = []
    for batch in working:
        results.append(
            {
                "batch_id": batch["batch_id"],
                "quantity": batch["quantity"],
                "expiry_date": batch["expiry_date"],
                "consumed_by_expiry": batch["consumed_by_expiry"],
                "wasted": batch["wasted"],
                "fully_consumed_date": batch["fully_consumed_date"],
                "status": batch["status"],
            }
        )

    return results


def get_expiry_alerts(
    data: dict,
    reference_date: str | date,
    horizon: int = 90,
) -> list[dict]:
    """
    For each facility/medicine, run FEFO simulation and flag batches
    expiring with unused stock (waste).

    Parameters
    ----------
    data : dict
        Seed data with keys: facilities, medicines, batches, consumption.
    reference_date : str or date
        Simulation start date.
    horizon : int
        Days to simulate.

    Returns
    -------
    list[dict]
        Each: {facility_id, medicine_id, alerts: [{batch_id, expiry_date,
        wasted_quantity, status}]}
    """
    # Index batches by (facility_id, medicine_id)
    batch_index: dict[tuple[str, str], list[dict]] = {}
    for batch in data.get("batches", []):
        key = (str(batch["facility_id"]), str(batch["medicine_id"]))
        batch_index.setdefault(key, []).append(batch)

    # Compute average daily consumption
    consumption_index: dict[tuple[str, str], list[float]] = {}
    for record in data.get("consumption", []):
        key = (str(record["facility_id"]), str(record["medicine_id"]))
        consumption_index.setdefault(key, []).append(float(record["quantity"]))

    facility_ids = {str(f.get("facility_id") or f.get("id")) for f in data.get("facilities", [])}
    medicine_ids = {str(m.get("medicine_id") or m.get("id")) for m in data.get("medicines", [])}

    results = []
    for fid in sorted(facility_ids):
        for mid in sorted(medicine_ids):
            key = (fid, mid)
            batches = batch_index.get(key, [])
            if not batches:
                continue

            cons_values = consumption_index.get(key, [])
            daily_consumption = (
                sum(cons_values) / len(cons_values) if cons_values else 0.0
            )

            sim_results = fefo_simulation(
                batches, daily_consumption, reference_date, horizon
            )

            # Flag batches that expired with waste
            alerts = []
            for br in sim_results:
                if br["status"] == "expired_waste" and br["wasted"] > 0:
                    alerts.append(
                        {
                            "batch_id": br["batch_id"],
                            "expiry_date": br["expiry_date"],
                            "wasted_quantity": br["wasted"],
                            "status": br["status"],
                        }
                    )

            if alerts:
                results.append(
                    {
                        "facility_id": fid,
                        "medicine_id": mid,
                        "alerts": alerts,
                    }
                )

    return results
