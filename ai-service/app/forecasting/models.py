"""
Forecasting models for medicine consumption prediction.

Each model takes a list of daily consumption values and a forecast horizon (days),
and returns a dict with:
  - "forecast": list of floats (point forecasts)
  - "lower": list of floats (lower confidence bound)
  - "upper": list of floats (upper confidence bound)
"""

import math
from typing import List, Dict

import numpy as np


def _confidence_bands(
    forecast: List[float], residual_std: float, z: float = 1.96
) -> tuple:
    """Compute symmetric confidence bands around a point forecast."""
    lower = [max(0.0, f - z * residual_std) for f in forecast]
    upper = [f + z * residual_std for f in forecast]
    return lower, upper


def _residual_std(history: List[float], fitted: List[float]) -> float:
    """Root-mean-square of in-sample residuals."""
    if len(fitted) == 0:
        return 0.0
    residuals = [h - f for h, f in zip(history[-len(fitted):], fitted)]
    return math.sqrt(sum(r ** 2 for r in residuals) / len(residuals))


# ---------------------------------------------------------------------------
# Model 1: Naive forecast – repeats the last observed value
# ---------------------------------------------------------------------------

def naive_forecast(
    history: List[float], horizon: int
) -> Dict[str, List[float]]:
    """Repeat the last observed value for every step in the horizon."""
    if not history:
        raise ValueError("history must not be empty")

    last = float(history[-1])
    forecast = [last] * horizon

    # Residual std from naive in-sample (each day predicted by previous day)
    if len(history) > 1:
        residuals = [history[i] - history[i - 1] for i in range(1, len(history))]
        std = math.sqrt(sum(r ** 2 for r in residuals) / len(residuals))
    else:
        std = 0.0

    lower, upper = _confidence_bands(forecast, std)
    return {"forecast": forecast, "lower": lower, "upper": upper}


# ---------------------------------------------------------------------------
# Model 2: Moving average forecast
# ---------------------------------------------------------------------------

def moving_average_forecast(
    history: List[float], horizon: int, window: int = 7
) -> Dict[str, List[float]]:
    """Forecast using the mean of the last `window` observations."""
    if not history:
        raise ValueError("history must not be empty")

    effective_window = min(window, len(history))
    avg = float(np.mean(history[-effective_window:]))
    forecast = [avg] * horizon

    # In-sample residual std using rolling window
    fitted = []
    for i in range(effective_window, len(history)):
        fitted.append(float(np.mean(history[i - effective_window : i])))
    std = _residual_std(history, fitted) if fitted else 0.0

    lower, upper = _confidence_bands(forecast, std)
    return {"forecast": forecast, "lower": lower, "upper": upper}


# ---------------------------------------------------------------------------
# Model 3: Simple exponential smoothing
# ---------------------------------------------------------------------------

def exponential_smoothing_forecast(
    history: List[float], horizon: int, alpha: float = 0.3
) -> Dict[str, List[float]]:
    """Simple exponential smoothing (SES) forecast."""
    if not history:
        raise ValueError("history must not be empty")

    # Fit: level updates
    level = float(history[0])
    fitted = []
    for obs in history[1:]:
        fitted.append(level)  # one-step-ahead prediction
        level = alpha * float(obs) + (1 - alpha) * level

    forecast = [level] * horizon

    std = _residual_std(history, fitted) if fitted else 0.0
    lower, upper = _confidence_bands(forecast, std)
    return {"forecast": forecast, "lower": lower, "upper": upper}


# ---------------------------------------------------------------------------
# Model 4: Holt-Winters seasonal forecast (additive trend + season)
# ---------------------------------------------------------------------------

def holt_winters_forecast(
    history: List[float], horizon: int, seasonal_periods: int = 30
) -> Dict[str, List[float]]:
    """
    Holt-Winters seasonal forecast using statsmodels ExponentialSmoothing
    with additive trend and additive seasonality.

    Falls back to simple exponential smoothing if Holt-Winters fails
    (e.g. insufficient data for the seasonal period).
    """
    if not history:
        raise ValueError("history must not be empty")

    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing

        # Need at least 2 full seasonal cycles for additive seasonality
        if len(history) < 2 * seasonal_periods:
            raise ValueError("Not enough data for Holt-Winters seasonal model")

        model = ExponentialSmoothing(
            history,
            trend="add",
            seasonal="add",
            seasonal_periods=seasonal_periods,
        )
        fit = model.fit(optimized=True, use_brute=True)
        forecast_values = fit.forecast(horizon)
        forecast = [max(0.0, float(v)) for v in forecast_values]

        # In-sample residuals for confidence bands
        residuals = fit.resid
        std = float(np.std(residuals))

        lower, upper = _confidence_bands(forecast, std)
        return {"forecast": forecast, "lower": lower, "upper": upper}

    except Exception:
        # Fallback to simple exponential smoothing
        return exponential_smoothing_forecast(history, horizon)
