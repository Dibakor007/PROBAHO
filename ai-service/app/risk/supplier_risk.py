"""
Supplier and shipment risk calculations for imported Active Pharmaceutical Ingredients.
Formula: risk = w1*delay_ratio + w2*leadtime_variability + w3*fulfilment_gap + w4*route_concentration + w5*(1 - cover_ratio)
All results are simulated estimates and transparently explainable.
"""

from typing import Any

DEFAULT_WEIGHTS = {
    "w1_delay_ratio": 0.25,
    "w2_leadtime_variability": 0.20,
    "w3_fulfilment_gap": 0.25,
    "w4_route_concentration": 0.15,
    "w5_cover_deficiency": 0.15,
}

def calculate_supplier_risk(supplier_data: dict[str, Any], custom_weights: dict[str, float] | None = None) -> dict[str, Any]:
    weights = dict(DEFAULT_WEIGHTS)
    if custom_weights:
        weights.update(custom_weights)

    total_weight = sum(weights.values()) or 1.0
    w1 = weights["w1_delay_ratio"] / total_weight
    w2 = weights["w2_leadtime_variability"] / total_weight
    w3 = weights["w3_fulfilment_gap"] / total_weight
    w4 = weights["w4_route_concentration"] / total_weight
    w5 = weights["w5_cover_deficiency"] / total_weight

    delay_ratio = min(1.0, max(0.0, float(supplier_data.get("delay_ratio", 0.0))))
    leadtime_var = min(1.0, max(0.0, float(supplier_data.get("leadtime_variability", 0.0))))
    fulfilment_gap = min(1.0, max(0.0, float(supplier_data.get("fulfilment_gap", 0.0))))
    route_conc = min(1.0, max(0.0, float(supplier_data.get("route_concentration", 0.0))))
    cover_ratio = min(1.0, max(0.0, float(supplier_data.get("cover_ratio", 0.0))))
    cover_deficiency = 1.0 - cover_ratio

    raw_score = (
        (w1 * delay_ratio)
        + (w2 * leadtime_var)
        + (w3 * fulfilment_gap)
        + (w4 * route_conc)
        + (w5 * cover_deficiency)
    )

    # Incorporate external weather observation if present (from Open-Meteo)
    weather_score = supplier_data.get("weather_risk_score")
    weather_adjustment = 0.0
    if weather_score is not None:
        # Weather can contribute up to +15 points under severe monsoon flooding
        weather_adjustment = (float(weather_score) / 100.0) * 0.15
        raw_score = min(1.0, raw_score + weather_adjustment)

    risk_score = round(raw_score * 100.0, 1)

    tier = "LOW"
    if risk_score >= 60.0:
        tier = "HIGH"
    elif risk_score >= 35.0:
        tier = "MEDIUM"

    result = {
        "supplier_id": supplier_data.get("id", "SUP-001"),
        "supplier_name": supplier_data.get("name", "Bengal Active Pharmaceutical Ingredient Imports"),
        "risk_score": risk_score,
        "risk_tier": tier,
        "data_label": "Synthetic data",
        "is_simulated": True,
        "weights": {
            "w1_delay_ratio": round(w1, 2),
            "w2_leadtime_variability": round(w2, 2),
            "w3_fulfilment_gap": round(w3, 2),
            "w4_route_concentration": round(w4, 2),
            "w5_cover_deficiency": round(w5, 2),
        },
        "metrics": {
            "delay_ratio": delay_ratio,
            "leadtime_variability": leadtime_var,
            "fulfilment_gap": fulfilment_gap,
            "route_concentration": route_conc,
            "cover_ratio": cover_ratio,
        }
    }

    if weather_score is not None:
        result["external_weather_observation"] = {
            "weather_risk_score": weather_score,
            "weather_impact_applied": round(weather_adjustment * 100, 1),
            "source": "Open-Meteo",
            "data_label": "External observation"
        }

    return result

