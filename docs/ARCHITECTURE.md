# Architecture — PROBAHO (প্রবাহ)

## 1. System Overview

PROBAHO follows a two-tier architecture: a React single-page application communicates over REST with a Python FastAPI service. An optional Gemini connection provides natural-language explanations.

```
┌──────────────────────────────────────────────────────────────────┐
│                       Browser (User)                             │
│                   Bangla / English UI                             │
└──────────────────────┬───────────────────────────────────────────┘
                       │  HTTPS
┌──────────────────────▼───────────────────────────────────────────┐
│            React + Vite Frontend  (Vercel)                       │
│                                                                  │
│  ┌────────────┐ ┌────────────┐ ┌───────────┐ ┌───────────────┐  │
│  │ Dashboard  │ │ Forecast   │ │ Simulator │ │  Copilot Chat │  │
│  │  (DoC,     │ │  Charts    │ │   Panel   │ │  (Bangla/EN)  │  │
│  │  Expiry)   │ │            │ │           │ │               │  │
│  └────────────┘ └────────────┘ └───────────┘ └───────────────┘  │
│  ┌────────────┐ ┌────────────┐                                   │
│  │ Optimizer  │ │ Audit Log  │                                   │
│  │  Results   │ │  Viewer    │                                   │
│  └────────────┘ └────────────┘                                   │
└──────────────────────┬───────────────────────────────────────────┘
                       │  REST API  /ai/*
┌──────────────────────▼───────────────────────────────────────────┐
│          FastAPI AI Service  (HuggingFace Spaces)                │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │ forecasting/ │  │  simulator/  │  │     optimizer/        │  │
│  │  naive       │  │  engine.py   │  │  OR-Tools CP-SAT /    │  │
│  │  moving_avg  │  │  daily step  │  │  linear solver        │  │
│  │  exp_smooth  │  │  propagation │  │  multi-objective      │  │
│  │  holt_winters│  │              │  │                       │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  inventory/  │  │   copilot/   │  │      audit/           │  │
│  │  days_cover  │  │  Gemini call │  │  hash-chained log     │  │
│  │  expiry.py   │  │  fallback    │  │  approve / reject     │  │
│  │  FEFO logic  │  │  validation  │  │  verify integrity     │  │
│  └──────────────┘  └──────────────┘  └───────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐                              │
│  │    seed/     │  │  evaluation/ │                              │
│  │  generator   │  │  metrics     │                              │
│  │  data/*.json │  │  report.json │                              │
│  └──────────────┘  └──────────────┘                              │
│                                                                  │
│  main.py  — FastAPI app, CORS, all /ai/* routes                  │
└──────────────────────┬───────────────────────────────────────────┘
                       │  (optional, server-side only)
┌──────────────────────▼───────────────────────────────────────────┐
│                    Gemini API                                     │
│           Explanation generation only                             │
│    LLM never calculates, approves, or executes                   │
└──────────────────────────────────────────────────────────────────┘
```

## 2. Component Descriptions

### 2.1 Frontend (`frontend/`)

| Component | Responsibility |
|-----------|---------------|
| Dashboard | Displays days-of-cover heatmap, expiry alerts, facility overview |
| Forecast Charts | Time-series visualisation with confidence bands; model comparison |
| Simulator Panel | User inputs disruption parameters; displays baseline vs disrupted timelines |
| Optimizer Results | Shows recommended transfers as a table and flow diagram |
| Copilot Chat | Conversational interface; relays user questions to `/ai/copilot` |
| Audit Log Viewer | Paginated event list with chain-verification status |

**Tech:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts.

### 2.2 AI Service (`ai-service/`)

#### `forecasting/`

Multiple time-series models trained on historical consumption data:

- **Naive** — last observed value repeated.
- **Moving Average** — configurable window (default 7 days).
- **Exponential Smoothing** — single-parameter smoothing.
- **Holt-Winters** — additive seasonal model (statsmodels `ExponentialSmoothing`).

Each model is evaluated via rolling-origin cross-validation producing MAE, RMSE, and WAPE.

#### `simulator/engine.py`

Discrete daily simulation with state variables:

```
ingredient_stock[t+1] = ingredient_stock[t] + arrivals[t] - ingredient_used[t]
production[t]         = min(plan[t], capacity[t], ingredient_stock[t] / ingredient_per_unit)
warehouse[t+1]        = warehouse[t] + production[t - prod_lag] - shipped[t]
facility_stock[t+1]   = facility_stock[t] + received[t] - min(facility_stock[t], demand[t])
```

Warehouse shipments are allocated by ascending days-of-cover. Scenario inputs control delay, shortfall, freight cost, and capacity.

#### `optimizer/engine.py`

Google OR-Tools CP-SAT or linear solver:

**Objective:** Minimise `transport_cost + unmet_demand_penalty + expiry_waste_penalty + transfer_count_penalty`

**Constraints:**
- Donor retains safety stock after transfer.
- Recipient capacity is not exceeded.
- Transferred batches must not expire before `arrival_date + minimum_shelf_life`.
- Only available routes are used.

#### `inventory/`

- **Days of Cover:** `usable_stock / forecast_daily_consumption`, excluding expired batches. Uncertainty bands derived from forecast confidence intervals.
- **Expiry Intelligence:** FEFO consumption model identifies batches that will expire unused at current rates.

#### `copilot/`

- Calls Gemini via `google-generativeai` using the model specified in `GEMINI_MODEL`.
- If `GEMINI_API_KEY` is absent or the call fails, falls back to deterministic template text.
- **Validation:** Every number in the LLM response must appear in the structured tool output; otherwise the response is replaced with the fallback.
- User text is treated as data, never as instructions to the model.

#### `audit/`

- **Hash chain:** `event_hash = SHA256(previous_hash + canonical_json(event))`
- Events: recommendation generated, approved, rejected — each with `user_name`, `reason`, `timestamp`.
- Verification endpoint walks the chain and returns the first broken link (if any).
- P0 storage: in-memory list + JSON file.

#### `seed/generator.py`

Deterministic generator (seed=42) producing:
- 6 facilities (3 UHC, 3 CC) with Bangla names and GPS coordinates.
- 5 tracer medicines (Paracetamol, Amoxicillin, Metformin, Omeprazole, ORS).
- Batches with varied expiry dates (some near-expiry).
- 12 months of daily consumption with seasonality (ORS monsoon spike) and noise.
- Safety-stock levels, facility capacities, route lead times.

Output: `data/*.json`.

#### `evaluation/`

Runs all forecasting models over the synthetic dataset, computes per-model / per-medicine / per-facility metrics, and writes `evaluation/report.json`.

## 3. Data Flow per Feature

### 3.1 Forecasting

```
Frontend (select facility + medicine + horizon)
  → POST /ai/forecast
  → forecasting/ loads consumption data, fits models, runs rolling-origin CV
  → returns { predictions[], confidence_intervals[], metrics{} }
  → Frontend renders chart + metric comparison table
```

### 3.2 Days of Cover & Expiry

```
Frontend (open Dashboard)
  → GET /ai/inventory
  → inventory/ loads batches + forecasts, computes DoC, runs FEFO analysis
  → returns { days_of_cover[], expiry_alerts[] }
  → Frontend renders heatmap + alert list
```

### 3.3 Disruption Simulation

```
Frontend (configure scenario parameters)
  → POST /ai/simulate
  → simulator/ runs daily loop for N days, baseline + disrupted
  → returns { baseline_timeline[], disrupted_timeline[], propagation_path[] }
  → Frontend renders comparison chart + propagation table
```

### 3.4 Redistribution Optimisation

```
Frontend (request optimisation)
  → POST /ai/optimize
  → optimizer/ builds model from current stock + forecasts + routes, solves
  → returns { transfers[], objective_value, days_of_cover_after{} }
  → audit/ logs the recommendation event
  → Frontend renders transfer list + before/after DoC comparison
```

### 3.5 Copilot

```
Frontend (user types question)
  → POST /ai/copilot { message, context }
  → copilot/ calls relevant backend tools for structured data
  → copilot/ sends data + question to Gemini (or fallback)
  → copilot/ validates numbers in response
  → returns { response, sources[], validated: bool }
  → Frontend renders chat bubble
```

### 3.6 Audit

```
Frontend (approve/reject recommendation)
  → POST /ai/approve { recommendation_id, action, user_name, reason }
  → audit/ appends hash-chained event
  → returns { event_hash }

Frontend (view audit log)
  → GET /ai/audit → audit/ returns all events
  → GET /ai/verify-audit → audit/ walks chain, returns integrity status
```

## 4. P0 vs P1 Scope

| Concern | P0 (This Build) | P1 (Future) |
|---------|-----------------|-------------|
| Data | Synthetic JSON files | Real data connectors (DGDA) |
| Storage | In-memory + JSON files | PostgreSQL / TimescaleDB |
| Auth | None (single user) | JWT + RBAC |
| Models | Classical time-series | Gradient boosting, LSTM |
| Deployment | Free-tier (Vercel + HF Spaces) | Dedicated cloud infrastructure |
| Updates | Request/response | WebSocket live updates |
| Mobile | Desktop-first responsive | Full PWA |

## 5. Security Considerations

1. **LLM never on client.** All Gemini calls are server-side. The API key is never exposed to the browser.
2. **No patient data.** The system processes logistics data only — medicine quantities, facility locations, consumption volumes. No personally identifiable information.
3. **Input sanitisation.** User copilot messages are treated as opaque data strings, never interpolated into prompts as instructions.
4. **Audit integrity.** The hash-chained log provides tamper evidence for all recommendation decisions.
5. **CORS.** The FastAPI service restricts origins to the frontend domain.
6. **Free-tier exposure.** The HuggingFace Spaces deployment is public. No sensitive data is stored. Environment secrets are managed via HF's secret store.
