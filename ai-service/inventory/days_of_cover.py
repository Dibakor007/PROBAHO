"""
Days-of-cover calculation for medicine inventory.

Computes how many days of demand the current usable stock can satisfy,
using forecast daily consumption. Excludes expired batches.
Active Pharmaceutical Ingredient stock is tracked separately from
finished medicine stock in the supply chain.
"""

from datetime import datetime, date
from typing import Any


def _parse_date(d: Any) -> date:
    """Parse a date string or return a date object as-is."""
    if isinstance(d, date) and not isinstance(d, datetime):
        return d
    if isinstance(d, datetime):
        return d.date()
    return datetime.strptime(str(d), "%Y-%m-%d").date()


def calculate_days_of_cover(
    batches: list[dict],
    forecast_daily: float,
    reference_date: str | date,
    forecast_lower: float | None = None,
    forecast_upper: float | None = None,
) -> dict:
    """
    Calculate days of cover for a set of batches.

    Parameters
    ----------
    batches : list[dict]
        Each dict has at least {batch_id, quantity, expiry_date}.
    forecast_daily : float
        Forecasted daily consumption (point estimate).
    reference_date : str or date
        Date to evaluate against; batches expiring on or before this are expired.
    forecast_lower : float, optional
        Lower bound of forecast confidence interval.
    forecast_upper : float, optional
        Upper bound of forecast confidence interval.

    Returns
    -------
    dict with keys: usable_stock, expired_stock, forecast_daily,
        days_of_cover, lower_bound, upper_bound
    """
    ref = _parse_date(reference_date)

    usable_stock = 0.0
    expired_stock = 0.0

    for batch in batches:
        expiry = _parse_date(batch["expiry_date"])
        qty = float(batch["quantity"])
        if expiry > ref:
            usable_stock += qty
        else:
            expired_stock += qty

    # Days of cover from point forecast
    if forecast_daily > 0:
        days_of_cover = usable_stock / forecast_daily
    else:
        days_of_cover = float("inf")

    # Bounds from confidence interval
    # Higher consumption → fewer days (lower bound of days)
    # Lower consumption → more days (upper bound of days)
    if forecast_upper is not None and forecast_upper > 0:
        lower_bound = usable_stock / forecast_upper
    else:
        lower_bound = days_of_cover

    if forecast_lower is not None and forecast_lower > 0:
        upper_bound = usable_stock / forecast_lower
    else:
        upper_bound = days_of_cover

    return {
        "usable_stock": usable_stock,
        "expired_stock": expired_stock,
        "forecast_daily": forecast_daily,
        "days_of_cover": days_of_cover,
        "lower_bound": lower_bound,
        "upper_bound": upper_bound,
    }


def get_inventory_status(
    data: dict,
    forecasts: dict | None,
    reference_date: str | date,
) -> list[dict]:
    """
    Compute inventory status for every facility / medicine combination.

    Parameters
    ----------
    data : dict
        Seed data with keys: facilities, medicines, batches, consumption, etc.
    forecasts : dict or None
        Mapping of (facility_id, medicine_id) -> {forecast_daily, forecast_lower,
        forecast_upper}. If None, average consumption from data is used.
    reference_date : str or date
        Evaluation date.

    Returns
    -------
    list[dict]
        Each dict: facility_id, medicine_id, usable_stock, expired_stock,
        forecast_daily, days_of_cover, lower_bound, upper_bound, alert, alert_message
    """
    ref = _parse_date(reference_date)
    LOW_STOCK_THRESHOLD_DAYS = 14

    # Index batches by (facility_id, medicine_id)
    batch_index: dict[tuple[str, str], list[dict]] = {}
    for batch in data.get("batches", []):
        key = (str(batch["facility_id"]), str(batch["medicine_id"]))
        batch_index.setdefault(key, []).append(batch)

    # Compute average daily consumption from historical data if no forecasts
    consumption_index: dict[tuple[str, str], list[float]] = {}
    for record in data.get("consumption", []):
        key = (str(record["facility_id"]), str(record["medicine_id"]))
        consumption_index.setdefault(key, []).append(float(record["quantity"]))

    # Build all facility/medicine combos
    facility_ids = {str(f.get("facility_id") or f.get("id")) for f in data.get("facilities", [])}
    medicine_ids = {str(m.get("medicine_id") or m.get("id")) for m in data.get("medicines", [])}

    results = []
    for fid in sorted(facility_ids):
        for mid in sorted(medicine_ids):
            key = (fid, mid)
            batches = batch_index.get(key, [])

            # Determine forecast
            if forecasts and key in forecasts:
                fc = forecasts[key]
                forecast_daily = fc.get("forecast_daily", 0.0)
                forecast_lower = fc.get("forecast_lower")
                forecast_upper = fc.get("forecast_upper")
            else:
                # Fall back to average daily consumption
                cons_values = consumption_index.get(key, [])
                forecast_daily = (
                    sum(cons_values) / len(cons_values) if cons_values else 0.0
                )
                forecast_lower = None
                forecast_upper = None

            doc = calculate_days_of_cover(
                batches, forecast_daily, ref, forecast_lower, forecast_upper
            )

            alert = doc["days_of_cover"] < LOW_STOCK_THRESHOLD_DAYS
            alert_message = None
            if alert:
                alert_message = (
                    f"Low stock: {doc['days_of_cover']:.1f} days of cover "
                    f"(threshold: {LOW_STOCK_THRESHOLD_DAYS} days)"
                )

            results.append(
                {
                    "facility_id": fid,
                    "medicine_id": mid,
                    **doc,
                    "alert": alert,
                    "alert_message": alert_message,
                }
            )

    return results
