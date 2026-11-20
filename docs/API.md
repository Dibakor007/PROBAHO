# PROBAHO (প্রবাহ) — REST API Specification

## 1. Node.js Gateway & Business API (`/api/*`)
All privileged requests are authenticated via JWT and authorized by role (`admin`, `approver`, `facility`, `analyst`) before invoking the AI service.

| Method | Endpoint | Allowed Roles | Description |
|---|---|---|---|
| `POST` | `/api/auth/login` | Public | Authenticates user; returns JWT token |
| `GET` | `/api/dashboard/summary` | All | Returns national overview KPIs, availability, and alerts |
| `GET` | `/api/facilities` | All | Lists healthcare facilities with type, capacity, and coordinates |
| `GET` | `/api/medicines` | All | Lists tracer medicines with Active Pharmaceutical Ingredient specs |
| `GET` | `/api/inventory` | All | Returns batch inventory and days of cover per facility |
| `POST` | `/api/inventory` | `facility`, `admin` | Records physical stock adjustments with audit logging |
| `POST` | `/api/inventory/upload-csv` | `facility`, `analyst`, `admin` | Validates bulk CSV stock batches (duplicates & date checks) |
| `GET` | `/api/suppliers` | `analyst`, `admin`, `approver` | Retrieves supplier risk metrics and delay ratios |
| `GET` | `/api/shipments` | All | Returns Active Pharmaceutical Ingredient shipment statuses |
| `POST` | `/api/scenarios` | `analyst`, `approver`, `admin` | Runs upstream disruption simulation via AI service |
| `GET` | `/api/recommendations` | All | Lists pending redistribution recommendations |
| `POST` | `/api/recommendations/:id/approve` | `approver`, `admin` | Authorizes stock transfer with required reason |
| `POST` | `/api/recommendations/:id/reject` | `approver`, `admin` | Rejects stock transfer with required reason |
| `GET` | `/api/audit-logs` | All | Returns complete audit trail |
| `GET` | `/api/audit/verify` | All | Validates cryptographic hash chain integrity |
| `POST` | `/api/copilot/chat` | All | Queries grounded copilot in Bangla or English |
| `GET` | `/api/external/weather` | All | Live Open-Meteo weather and monsoon flood hazard score |
| `GET` | `/api/external/weather/corridors` | All | Weather risk across all 7 Bangladesh supply corridors |
| `GET` | `/api/external/route` | All | OSRM road distance, transit duration, and GeoJSON geometry |
| `GET` | `/api/external/geocode` | All | Nominatim facility and clinic search for Bangladesh |
| `GET` | `/api/external/currency/rates` | All | Frankfurter ECB exchange rates and BDT benchmarks |
| `POST` | `/api/external/currency/convert` | All | Converts Active Pharmaceutical Ingredient procurement cost to BDT |
| `GET` | `/api/external/public-health` | All | WHO Global Health Observatory essential medicine targets |
| `GET` | `/api/docs/access` | All | Checks public / scheduled access permissions for `/docs` |
| `GET` | `/api/docs/team` | All | Retrieves official team members list and profile data |
| `GET` | `/api/docs/live-stats` | All | Live auto-synced system metrics for documentation |
| `PUT` | `/api/docs/config` | `admin` | Updates public visibility, scheduling windows, and team |

## 2. FastAPI AI Decision Engine (`/ai/*`)
Stateless machine learning and mathematical optimization endpoints:

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/ai/forecast/demand` | Generates demand forecasts and 80% confidence bands |
| `POST` | `/ai/forecast/api-requirements` | Computes raw Active Pharmaceutical Ingredient requirements from finished medicine forecasts |
| `POST` | `/ai/risk/supplier` | Computes interpretable weighted supplier risk scores |
| `POST` | `/ai/simulate/disruption` | Runs discrete daily propagation simulation from port to clinic |
| `POST` | `/ai/optimize/redistribution` | Solves constrained stock transfer multi-objective integer program |
| `POST` | `/ai/expiry/analyze` | Evaluates FEFO batch consumption and identifies expiring waste |
| `POST` | `/ai/copilot/explain` | Generates plain-language grounded explanations (Bangla / English) |
| `GET` | `/ai/health` | Service health check and uptime monitor |
| `GET` | `/ai/evaluation-report` | Returns rolling-origin cross-validation metrics (MAE, RMSE, WAPE) |

