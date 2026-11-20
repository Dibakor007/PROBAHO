# Product Requirements Document — PROBAHO (প্রবাহ)

## 1. Product Overview

**Product Name:** PROBAHO (প্রবাহ — "flow")
**Tagline:** AI Decision Support for Medicine Supply Chain
**Context:** Hackathon prototype targeting Bangladesh's public-health medicine distribution network.

> ⚠️ All data is synthetic. This system has no connection to any government body or national supply chain.

### 1.1 Problem Statement

Bangladesh's public-health supply chain delivers essential medicines from central warehouses to upazila health complexes (UHCs) and community clinics (CCs). Key challenges include:

- **Demand uncertainty** — seasonal spikes (e.g., ORS during monsoon) and facility-level variation make manual planning unreliable.
- **Expiry waste** — medicines expire on shelves while neighbouring facilities face stockouts.
- **Disruption fragility** — supplier delays, freight cost spikes, and capacity cuts propagate unpredictably through the network.
- **Information gaps** — facility managers lack decision-support tools to anticipate shortages or coordinate redistribution.

### 1.2 Solution

PROBAHO provides:

1. AI-powered demand forecasting to predict consumption per medicine per facility.
2. Real-time days-of-cover and expiry alerts.
3. A disruption simulator to stress-test the network against realistic scenarios.
4. An optimisation engine that recommends inter-facility redistributions to minimise stockouts, waste, and cost.
5. An AI copilot that explains all outputs in plain Bangla or English — without ever making autonomous decisions.

### 1.3 Target Users

- **Supply chain managers** at district/upazila level
- **Facility pharmacists** at UHCs and community clinics
- **Hackathon judges** evaluating the prototype

---

## 2. Scope

### 2.1 P0 — Hackathon Prototype (this build)

| # | Feature | Description |
|---|---------|-------------|
| 1 | Demand Forecasting | Naive, Moving Average, Exponential Smoothing, Holt-Winters with rolling-origin validation |
| 2 | Days-of-Cover Dashboard | Per-medicine, per-facility stock coverage |
| 3 | Expiry Intelligence | FEFO modelling; flag batches expiring unused |
| 4 | Disruption Simulator | Daily discrete simulation: supplier shortfall, shipment delay, freight spike, capacity cut |
| 5 | Redistribution Optimizer | OR-Tools solver with multi-objective: cost + unmet demand + waste + transfer count |
| 6 | AI Copilot | Gemini-powered explanations (optional); deterministic fallback; LLM never calculates |
| 7 | Audit Trail | Hash-chained event log with approve/reject and integrity verification |
| 8 | Evaluation Pipeline | MAE / RMSE / WAPE per model/medicine/facility on synthetic data |
| 9 | Seed Data Generator | Deterministic (seed=42) synthetic dataset |
| 10 | Bilingual Interface | Bangla + English in UI and copilot |

### 2.2 P1 — Post-Hackathon (out of scope)

- Multi-user authentication and role-based access
- Real data integration (DGDA, facility systems)
- PostgreSQL / TimescaleDB persistence
- Automated reorder-point triggers
- Mobile-responsive PWA
- Advanced ML models (gradient boosting, LSTM)
- WebSocket-based live updates

---

## 3. User Stories

### 3.1 Forecasting

> *As a supply chain manager, I want to see 7- and 30-day forecasts for each medicine at each facility, so I can plan procurement and distribution.*

**Acceptance criteria:**
- Dashboard shows forecast with confidence interval.
- User can select facility, medicine, and horizon.
- Multiple models are compared; best model is highlighted.

### 3.2 Days of Cover

> *As a facility pharmacist, I want to know how many days my current stock will last, so I can request resupply in time.*

**Acceptance criteria:**
- Days-of-cover displayed per medicine.
- Expired and near-expiry batches excluded from usable stock.
- Colour-coded: green (>14d), amber (7–14d), red (<7d).

### 3.3 Expiry Intelligence

> *As a supply chain manager, I want to know which batches will expire before they are consumed, so I can redistribute them.*

**Acceptance criteria:**
- Batches flagged with estimated days until waste.
- FEFO ordering applied.
- Linked to redistribution optimizer.

### 3.4 Disruption Simulation

> *As a supply chain manager, I want to simulate what happens if the main supplier is delayed by 14 days, so I can prepare contingency plans.*

**Acceptance criteria:**
- User configures: delay days, shortfall %, freight increase %, capacity cut %.
- Output: baseline vs disrupted timeline, stockout dates, shortage quantities.
- Propagation path shown step by step.

### 3.5 Redistribution

> *As a district manager, I want the system to recommend which facility should send stock to which, minimising cost and waste.*

**Acceptance criteria:**
- Optimiser output: list of transfers (from, to, medicine, quantity, batch).
- Donor facility retains safety stock.
- No transfer of batches expiring before arrival + minimum shelf life.

### 3.6 AI Copilot

> *As a facility pharmacist with limited English, I want explanations of forecasts and recommendations in Bangla.*

**Acceptance criteria:**
- Copilot answers in user's language.
- Every number in the response is validated against structured tool output.
- If Gemini API is unavailable, deterministic template text is used.

### 3.7 Audit Trail

> *As an auditor, I want to verify that every recommendation approval is tamper-evident.*

**Acceptance criteria:**
- Each event's hash chains to the previous event.
- Verify endpoint detects any broken link.
- Approve/reject captured with user name, reason, timestamp.

---

## 4. Technical Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full system design.

**Summary:**

```
Browser → React Frontend (Vite + TypeScript) → FastAPI AI Service (Python) → Gemini API (optional)
```

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts.
- **Backend:** FastAPI, pandas, NumPy, statsmodels, scikit-learn, OR-Tools.
- **AI:** Gemini via `google-generativeai` — explanation only.
- **Data:** Synthetic JSON files generated by `seed/generator.py`.

---

## 5. Data Model

### 5.1 Facilities

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique facility identifier |
| name | string | Bangla facility name |
| type | enum | `uhc` or `community_clinic` |
| lat, lon | float | GPS coordinates |
| capacity | object | Max units storable per medicine |

### 5.2 Medicines

| Field | Type | Description |
|-------|------|-------------|
| id | string | Unique medicine identifier |
| name | string | Generic medicine name |
| unit | string | e.g., "tablet", "sachet" |
| shelf_life_days | int | Standard shelf life |

### 5.3 Batches

| Field | Type | Description |
|-------|------|-------------|
| id | string | Batch identifier |
| medicine_id | string | FK to medicine |
| facility_id | string | FK to facility |
| quantity | int | Current units in stock |
| manufactured | date | Manufacturing date |
| expiry | date | Expiry date |

### 5.4 Consumption Records

| Field | Type | Description |
|-------|------|-------------|
| facility_id | string | FK to facility |
| medicine_id | string | FK to medicine |
| date | date | Consumption date |
| quantity | float | Units consumed |

### 5.5 Routes

| Field | Type | Description |
|-------|------|-------------|
| from_id | string | Origin facility |
| to_id | string | Destination facility |
| lead_time_days | int | Transit time |
| cost_per_unit | float | Transport cost per medicine unit |

---

## 6. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| Cold start (HuggingFace free tier) | < 60 seconds |
| Forecast response time | < 2 seconds for single facility |
| Simulation response time | < 5 seconds for 180-day horizon |
| Optimisation response time | < 10 seconds for 6 facilities × 5 medicines |
| Accessibility | Keyboard-navigable, sufficient colour contrast |
| Browser support | Chrome, Firefox, Edge (latest) |

---

## 7. Security & Privacy

- **No patient data** is stored or processed.
- **No clinical advice** is given — the system supports logistics decisions only.
- **LLM isolation:** Gemini runs server-side only, never on the client. User input is treated as data, never as instructions to the model.
- **Audit integrity:** Hash-chained log ensures tamper evidence.
- **P0:** Single-user, no authentication. P1 adds RBAC.

---

## 8. Success Metrics (Hackathon)

| Metric | Target |
|--------|--------|
| Forecast WAPE | < 25% on synthetic data |
| Optimiser feasibility | 100% of solutions satisfy all constraints |
| Audit chain integrity | 100% verified on all test scenarios |
| Copilot number accuracy | 100% — every number validated against tool output |
| Feature completeness | All 10 P0 features functional |

---

## 9. Glossary

| Term | Definition |
|------|-----------|
| Active Pharmaceutical Ingredient | The biologically active compound in a medicine — referred to as "ingredient" in code |
| CC | Community Clinic |
| FEFO | First-Expiry, First-Out — consumption/distribution strategy |
| MAE | Mean Absolute Error |
| RMSE | Root Mean Squared Error |
| UHC | Upazila Health Complex |
| WAPE | Weighted Absolute Percentage Error |
