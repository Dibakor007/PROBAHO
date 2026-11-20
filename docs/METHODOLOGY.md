# Methodology — PROBAHO (প্রবাহ)

This document describes the algorithms and analytical methods used in the PROBAHO platform.

---

## 1. Demand Forecasting

### 1.1 Models

PROBAHO implements four time-series forecasting models of increasing sophistication. All operate on daily consumption data per medicine per facility.

#### Naive Forecast

The simplest baseline: the forecast for every future day equals the last observed value.

```
ŷ(t+h) = y(t)   for all h ≥ 1
```

**Use case:** Benchmark — any useful model must beat this.

#### Moving Average (MA)

The forecast is the arithmetic mean of the last *k* observed values (default *k* = 7).

```
ŷ(t+1) = (1/k) Σ y(t-i)   for i = 0, …, k-1
```

**Strengths:** Smooths daily noise. **Weakness:** Cannot capture trend or seasonality.

#### Simple Exponential Smoothing (SES)

Assigns exponentially decreasing weights to older observations. The smoothing parameter α ∈ (0, 1) is optimised by minimising in-sample MSE.

```
ŷ(t+1) = α·y(t) + (1-α)·ŷ(t)
```

**Strengths:** Adapts to level shifts faster than MA. **Weakness:** No trend or seasonal component.

#### Holt-Winters Seasonal (Additive)

The primary production model. Decomposes the series into level (*l*), trend (*b*), and seasonal (*s*) components with period *m* (default *m* = 7 for weekly seasonality).

```
l(t) = α·(y(t) - s(t-m)) + (1-α)·(l(t-1) + b(t-1))
b(t) = β·(l(t) - l(t-1)) + (1-β)·b(t-1)
s(t) = γ·(y(t) - l(t)) + (1-γ)·s(t-m)

ŷ(t+h) = l(t) + h·b(t) + s(t+h-m)
```

Parameters α, β, γ are optimised via maximum likelihood (statsmodels `ExponentialSmoothing`).

**Strengths:** Captures weekly consumption patterns (e.g., clinic days) and trend. This is the model recommended for decision support.

### 1.2 Rolling-Origin Cross-Validation

To avoid overfitting on a single train/test split, PROBAHO uses **rolling-origin** (also called "time-series cross-validation"):

1. Start with a minimum training window (e.g., 60 days).
2. Fit the model on the training window.
3. Forecast *h* steps ahead and record errors.
4. Advance the origin by one step and repeat.
5. Report average metrics across all origins.

This simulates the real-world scenario where the model is periodically retrained as new data arrives.

### 1.3 Metrics

| Metric | Formula | Interpretation |
|--------|---------|----------------|
| MAE | `(1/n) Σ |y - ŷ|` | Average absolute error in original units |
| RMSE | `√((1/n) Σ (y - ŷ)²)` | Penalises large errors more than MAE |
| WAPE | `Σ|y - ŷ| / Σ|y|` | Scale-free percentage error; robust to near-zero actuals |

Metrics are computed per model, per medicine, and per facility, then stored in `evaluation/report.json`.

---

## 2. Days-of-Cover Calculation

Days of cover (DoC) estimates how many days the current usable stock will last at the forecast consumption rate.

```
DoC = usable_stock / forecast_daily_consumption
```

Where:
- **usable_stock** = total batch quantity at the facility, **excluding** batches past their expiry date.
- **forecast_daily_consumption** = the point forecast from the best-performing model (typically Holt-Winters).

### Uncertainty Band

The confidence interval of the forecast translates into a DoC range:

```
DoC_lower = usable_stock / forecast_upper
DoC_upper = usable_stock / forecast_lower
```

This tells the user: "Stock will last between X and Y days, depending on actual demand."

### Colour Coding

| DoC Range | Colour | Meaning |
|-----------|--------|---------|
| > 14 days | 🟢 Green | Adequate |
| 7–14 days | 🟡 Amber | Monitor closely |
| < 7 days | 🔴 Red | Urgent — reorder or redistribute |

---

## 3. Expiry Intelligence (FEFO)

### First-Expiry, First-Out Model

PROBAHO assumes facilities consume batches in **FEFO order** — the batch closest to expiry is consumed first.

**Algorithm:**

1. Sort all batches at a facility for a given medicine by ascending expiry date.
2. For each batch, estimate the number of days to consume it:
   ```
   consumption_days = batch_quantity / forecast_daily_consumption
   ```
3. Accumulate days. If the cumulative days exceed the batch's remaining shelf life, the batch is flagged:
   ```
   days_until_expiry = expiry_date - today
   If cumulative_consumption_days_to_reach_this_batch > days_until_expiry:
       flag batch as "will expire unused"
       waste_quantity = remaining units in batch
   ```
4. Output: list of at-risk batches with estimated waste quantity and days until expiry.

### Integration with Optimizer

Flagged batches feed directly into the redistribution optimizer, which can propose transferring them to facilities with higher consumption rates before they expire.

---

## 4. Disruption Simulation

### 4.1 Model

The simulator runs a **discrete daily simulation** over a configurable horizon (default 180 days). The supply chain is modelled as a linear network:

```
Supplier → Manufacturer → Warehouse → Facilities
```

### 4.2 State Equations

At each time step *t*:

```
ingredient_stock[t+1] = ingredient_stock[t] + arrivals[t] - ingredient_used[t]
production[t]         = min(plan[t], capacity[t], ingredient_stock[t] / ingredient_per_unit)
warehouse[t+1]        = warehouse[t] + production[t - prod_lag] - shipped[t]
facility_stock[t+1]   = facility_stock[t] + received[t] - min(facility_stock[t], demand[t])
```

Where:
- `ingredient_stock` = raw Active Pharmaceutical Ingredient inventory at the manufacturer
- `arrivals` = supplier shipments arriving (subject to delay scenarios)
- `ingredient_used` = Active Pharmaceutical Ingredient consumed in production
- `production` = units manufactured, constrained by plan, capacity, and ingredient availability
- `prod_lag` = manufacturing lead time
- `warehouse` = central warehouse stock
- `shipped` = units dispatched to facilities (allocated by ascending DoC)
- `received` = units arriving at facilities (subject to route lead time)
- `demand` = daily consumption (from forecaster or historical)

### 4.3 Scenario Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `shipment_delay_days` | 0 | Additional days added to all supplier shipment arrivals |
| `supplier_shortfall_pct` | 0 | Percentage reduction in supplier shipment quantities |
| `freight_cost_increase_pct` | 0 | Percentage increase in transport costs |
| `manufacturing_capacity_cut_pct` | 0 | Percentage reduction in daily manufacturing capacity |

### 4.4 Output

- **Baseline timeline:** Stock levels at each node over time, with no disruption.
- **Disrupted timeline:** Stock levels under the configured scenario.
- **Stockout dates:** First day each facility hits zero stock, per medicine.
- **Shortage quantities:** Cumulative unmet demand per facility.
- **Propagation path:** Ordered list of `(node, day, reason)` showing how the disruption cascades through the network.

---

## 5. Redistribution Optimisation

### 5.1 Formulation

The redistribution problem is modelled as a **constrained optimisation** using Google OR-Tools (CP-SAT or linear solver).

#### Decision Variables

`transfer[i][j][m][b]` ∈ ℤ≥0 — quantity of medicine *m*, batch *b*, to move from facility *i* to facility *j*.

#### Objective Function

Minimise:

```
Σ transfer[i][j][m][b] × route_cost[i][j]              (transport cost)
+ Σ max(0, demand[j][m] - stock_after[j][m]) × P_unmet  (unmet demand penalty)
+ Σ waste[i][m][b] × P_waste                             (expiry waste penalty)
+ Σ 𝟙(transfer[i][j][m][b] > 0) × P_transfer            (transfer count penalty)
```

Where `P_unmet >> P_waste >> P_transfer >> route_cost` to prioritise avoiding stockouts.

#### Constraints

1. **Safety stock:** After all transfers, donor facility *i* retains at least `safety_stock[i][m]` units.
   ```
   stock[i][m] - Σⱼ transfer[i][j][m][b] ≥ safety_stock[i][m]
   ```

2. **Capacity:** Recipient facility *j* does not exceed storage capacity.
   ```
   stock[j][m] + Σᵢ transfer[i][j][m][b] ≤ capacity[j][m]
   ```

3. **Shelf-life viability:** Transferred batches must not expire before arrival plus a minimum remaining shelf life.
   ```
   expiry[b] - today ≥ route_lead_time[i][j] + min_shelf_life
   ```

4. **Route availability:** Transfers only occur on defined routes.
   ```
   transfer[i][j][m][b] = 0  if route[i][j] does not exist
   ```

### 5.2 Output

- List of recommended transfers: `{ from, to, medicine, batch, quantity }`.
- Total objective value and component breakdown.
- Days-of-cover before and after redistribution (min and spread across facilities).

---

## 6. AI Copilot — Explain-Only Architecture

### 6.1 Design Principle

The copilot is an **explanation layer**, not a decision maker. It follows a strict separation:

```
Backend tools  →  structured data  →  LLM explains  →  validated response
```

1. **Backend tools** (forecasting, simulation, optimisation) compute all numbers.
2. **Structured data** (JSON) is passed to the LLM as context.
3. **LLM (Gemini)** generates a natural-language explanation of the data.
4. **Number validation:** Every number in the LLM's response is checked against the structured tool output. If any number is not found in the source data, the response is replaced with a deterministic template.

### 6.2 Why This Architecture?

- **Accuracy:** Numbers come from validated algorithms, not LLM generation.
- **Auditability:** Every claim can be traced to a specific tool output.
- **Graceful degradation:** If the Gemini API key is missing or the service is down, the system falls back to template-based explanations with no loss of functionality.
- **Safety:** The LLM never calculates, never approves or rejects recommendations, and never executes actions.

### 6.3 Prompt Safety

- User text is passed to Gemini as a **data field**, never interpolated into the system prompt as instructions.
- The system prompt instructs Gemini to explain the provided data and not to follow instructions embedded in the user's message.
- Supported languages: Bangla (বাংলা) and English. The copilot detects the user's language and responds accordingly.

### 6.4 Fallback Templates

When Gemini is unavailable, the copilot constructs responses from templates:

```python
# Example (English)
f"The forecast for {medicine} at {facility} over the next {horizon} days "
f"is {forecast_avg:.0f} units/day (range: {lower:.0f}–{upper:.0f}). "
f"Current days of cover: {doc:.1f} days."
```

Templates are available in both Bangla and English.
