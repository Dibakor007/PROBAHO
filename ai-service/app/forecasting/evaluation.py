"""
Forecasting evaluation utilities.

Provides rolling-origin cross-validation and standard error metrics
(MAE, RMSE, WAPE) for evaluating medicine consumption forecasting models.
"""

import math
from typing import List, Dict, Callable, Any
from collections import defaultdict

from forecasting.models import (
    naive_forecast,
    moving_average_forecast,
    exponential_smoothing_forecast,
    holt_winters_forecast,
)


# ---------------------------------------------------------------------------
# Error metrics
# ---------------------------------------------------------------------------

def compute_mae(actual: List[float], predicted: List[float]) -> float:
    """Mean Absolute Error."""
    if len(actual) != len(predicted) or len(actual) == 0:
        raise ValueError("actual and predicted must be non-empty and equal length")
    return sum(abs(a - p) for a, p in zip(actual, predicted)) / len(actual)


def compute_rmse(actual: List[float], predicted: List[float]) -> float:
    """Root Mean Squared Error."""
    if len(actual) != len(predicted) or len(actual) == 0:
        raise ValueError("actual and predicted must be non-empty and equal length")
    mse = sum((a - p) ** 2 for a, p in zip(actual, predicted)) / len(actual)
    return math.sqrt(mse)


def compute_wape(actual: List[float], predicted: List[float]) -> float:
    """
    Weighted Absolute Percentage Error.
    WAPE = sum(|actual - predicted|) / sum(|actual|)
    Returns 0.0 if sum of actuals is zero.
    """
    if len(actual) != len(predicted) or len(actual) == 0:
        raise ValueError("actual and predicted must be non-empty and equal length")
    total_actual = sum(abs(a) for a in actual)
    if total_actual == 0:
        return 0.0
    return sum(abs(a - p) for a, p in zip(actual, predicted)) / total_actual


# ---------------------------------------------------------------------------
# Rolling-origin cross-validation
# ---------------------------------------------------------------------------

def rolling_origin_cv(
    history: List[float],
    model_fn: Callable,
    min_train: int = 180,
    step: int = 30,
    horizon: int = 30,
) -> List[Dict[str, Any]]:
    """
    Rolling-origin (expanding window) cross-validation.

    Starting with `min_train` observations as the training set, the model
    forecasts `horizon` steps ahead.  The training window expands by `step`
    observations on each fold.

    Returns a list of dicts, one per fold:
        {"train_size": int, "mae": float, "rmse": float, "wape": float}
    """
    results: List[Dict[str, Any]] = []
    n = len(history)

    origin = min_train
    while origin + horizon <= n:
        train = history[:origin]
        actual = history[origin : origin + horizon]

        try:
            pred_result = model_fn(train, horizon)
            predicted = pred_result["forecast"]

            mae = compute_mae(actual, predicted)
            rmse = compute_rmse(actual, predicted)
            wape = compute_wape(actual, predicted)

            results.append(
                {
                    "train_size": origin,
                    "mae": round(mae, 4),
                    "rmse": round(rmse, 4),
                    "wape": round(wape, 4),
                }
            )
        except Exception:
            # Skip folds where the model fails (e.g. insufficient data)
            pass

        origin += step

    return results


# ---------------------------------------------------------------------------
# Evaluate all models across medicines and facilities
# ---------------------------------------------------------------------------

# Registry of all forecasting models to evaluate
MODEL_REGISTRY: Dict[str, Callable] = {
    "naive": naive_forecast,
    "moving_average": moving_average_forecast,
    "exponential_smoothing": exponential_smoothing_forecast,
    "holt_winters": holt_winters_forecast,
}


def evaluate_all_models(
    consumption_data: List[Dict],
    medicines: List[Dict],
    facilities: List[Dict],
) -> Dict[str, Any]:
    """
    Evaluate all four forecasting models for every medicine / facility
    combination using rolling-origin cross-validation.

    Parameters
    ----------
    consumption_data : list of dicts
        Each dict has keys: facility_id, medicine_id, date (YYYY-MM-DD), quantity.
    medicines : list of dicts
        Each dict has at least an "id" key.
    facilities : list of dicts
        Each dict has at least an "id" key.

    Returns
    -------
    dict with structure:
        {
            "results": [
                {
                    "facility_id": str,
                    "medicine_id": str,
                    "model": str,
                    "cv_folds": [ {train_size, mae, rmse, wape}, ... ],
                    "avg_mae": float,
                    "avg_rmse": float,
                    "avg_wape": float,
                },
                ...
            ],
            "summary": {
                "best_model_by_medicine": { medicine_id: model_name },
                "best_model_by_facility": { facility_id: model_name },
            }
        }
    """

    # --- Build time-series per (facility, medicine) ---
    # Group consumption by (facility_id, medicine_id), sorted by date
    grouped: Dict[tuple, List[tuple]] = defaultdict(list)
    for record in consumption_data:
        key = (record["facility_id"], record["medicine_id"])
        grouped[key].append((record["date"], float(record["quantity"])))

    # Sort each group by date and extract quantities
    series: Dict[tuple, List[float]] = {}
    for key in grouped:
        grouped[key].sort(key=lambda x: x[0])
        series[key] = [q for _, q in grouped[key]]

    facility_ids = {f["id"] for f in facilities}
    medicine_ids = {m["id"] for m in medicines}

    results: List[Dict[str, Any]] = []

    # Accumulators for best-model selection
    medicine_scores: Dict[str, Dict[str, List[float]]] = defaultdict(
        lambda: defaultdict(list)
    )
    facility_scores: Dict[str, Dict[str, List[float]]] = defaultdict(
        lambda: defaultdict(list)
    )

    for (fac_id, med_id), history in series.items():
        if fac_id not in facility_ids or med_id not in medicine_ids:
            continue

        for model_name, model_fn in MODEL_REGISTRY.items():
            cv_folds = rolling_origin_cv(history, model_fn)

            if cv_folds:
                avg_mae = sum(f["mae"] for f in cv_folds) / len(cv_folds)
                avg_rmse = sum(f["rmse"] for f in cv_folds) / len(cv_folds)
                avg_wape = sum(f["wape"] for f in cv_folds) / len(cv_folds)
            else:
                avg_mae = avg_rmse = avg_wape = None

            results.append(
                {
                    "facility_id": fac_id,
                    "medicine_id": med_id,
                    "model": model_name,
                    "cv_folds": cv_folds,
                    "avg_mae": round(avg_mae, 4) if avg_mae is not None else None,
                    "avg_rmse": round(avg_rmse, 4) if avg_rmse is not None else None,
                    "avg_wape": round(avg_wape, 4) if avg_wape is not None else None,
                }
            )

            if avg_mae is not None:
                medicine_scores[med_id][model_name].append(avg_mae)
                facility_scores[fac_id][model_name].append(avg_mae)

    # --- Determine best model per medicine and per facility (lowest avg MAE) ---
    best_by_medicine: Dict[str, str] = {}
    for med_id, models in medicine_scores.items():
        best_model = min(
            models.keys(),
            key=lambda m: sum(models[m]) / len(models[m]),
        )
        best_by_medicine[med_id] = best_model

    best_by_facility: Dict[str, str] = {}
    for fac_id, models in facility_scores.items():
        best_model = min(
            models.keys(),
            key=lambda m: sum(models[m]) / len(models[m]),
        )
        best_by_facility[fac_id] = best_model

    return {
        "results": results,
        "summary": {
            "best_model_by_medicine": best_by_medicine,
            "best_model_by_facility": best_by_facility,
        },
    }
