# PROBAHO (প্রবাহ) — External APIs Integration Guide

This document describes the 5 external public APIs integrated into the PROBAHO pharmaceutical supply chain resilience platform, their purpose, caching policy, rate limiting, attribution, and AI integration architecture.

---

## 1. Overview of Integrated APIs

| Service | Provider & Endpoint | Supply Chain Function | Attribution / License |
|---|---|---|---|
| **Open-Meteo** | `https://api.open-meteo.com/v1/forecast` | Real-time weather, monsoon rainfall, and flood hazard index across Bangladesh transport corridors | *Weather data by Open-Meteo.com under CC BY 4.0* |
| **OSRM** | `https://router.project-osrm.org/route/v1/driving` | Road network driving distance (km), freight travel duration (hours/mins), and route geometry between facilities | *Routing data © OpenStreetMap contributors, OSRM* |
| **Nominatim** | `https://nominatim.openstreetmap.org/search` | Geocoding of health complexes, warehouses, and clinics across Bangladesh with boundary filtering | *Data © OpenStreetMap contributors, ODbL 1.0* |
| **Frankfurter** | `https://api.frankfurter.app/latest?from=USD` | Currency conversion of imported Active Pharmaceutical Ingredient procurement costs (USD, EUR, INR, CNY) into BDT | *Exchange rates from European Central Bank via Frankfurter.app* |
| **WHO GHO** | `https://ghoapi.azureedge.net/api` | Public health benchmarks (e.g. WHO 80% Essential Medicines Availability target) for Bangladesh | *World Health Organization Global Health Observatory (WHO GHO)* |

---

## 2. Architectural Design & Resilience Principles

### 2.1 Decoupled Service Modules
All external calls are encapsulated within `backend/src/services/external/`:
- `cache.js`: In-memory TTL cache with stale fallback and timestamps.
- `openMeteoService.js`: Weather corridor monitoring and flood hazard scoring.
- `osrmService.js`: Road driving calculations and Haversine logistics fallback.
- `nominatimService.js`: Geocoding with custom `User-Agent` and local facility database fallback.
- `frankfurterService.js`: Currency conversion with statutory customs duty calculation.
- `whoGhoService.js`: Public health indicators and targets.

### 2.2 Stale Fallback & Offline Resilience
If an external API service experiences an outage or network timeout:
1. The backend automatically returns **stale cached data** if available, flagged with `is_stale: true`.
2. If no cache exists, it activates a **deterministic baseline fallback** (e.g., local facility database for Nominatim, road tortuosity model for OSRM, Bangladesh Bank interbank rates for Frankfurter).
3. The application **never crashes** due to an external network failure.

### 2.3 Nominatim Usage Policy Compliance
- **Custom User-Agent:** `PROBAHO-SupplyChain-Platform/1.0 (contact@probaho.bd)` is sent on all requests.
- **Rate Limiting:** Live requests are throttled to a minimum interval of 1.1 seconds.
- **Search Bounding:** Searches are bounded to Bangladesh using `countrycodes=bd`.
- **Caching:** Responses are cached for 7 days.

---

## 3. API Endpoints (`/api/external/*`)

### 3.1 Weather Risk Monitoring
- **`GET /api/external/weather?lat=23.81&lon=90.41`**
  - Returns current temperature, precipitation, wind speed, composite flood risk score (0-100), risk tier (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and expected logistics transit delay.
- **`GET /api/external/weather/corridors`**
  - Returns weather risk for all key logistics hubs: Dhaka CMSD, Chittagong Port, Gazipur Manufacturing Zone, Rangpur Upazila Corridor, Sylhet, Barishal, and Khulna.

### 3.2 OSRM Route Calculation
- **`GET /api/external/route?from_lat=...&from_lon=...&to_lat=...&to_lon=...`** (or `from_id` / `to_id`)
  - Returns driving distance in km, duration in hours and minutes, and GeoJSON LineString geometry.

### 3.3 Nominatim Geocoding
- **`GET /api/external/geocode?q=Savar`**
  - Searches for healthcare facilities, upazilas, or warehouses in Bangladesh.
- **`GET /api/external/reverse-geocode?lat=23.81&lon=90.41`**
  - Reverse geocodes coordinates to display address.

### 3.4 Frankfurter Currency Conversion
- **`GET /api/external/currency/rates`**
  - Returns latest European Central Bank reference rates and derived BDT rates.
- **`POST /api/external/currency/convert`**
  - Body: `{ amount, from, quantity_kg, ingredient_name }`
  - Returns total cost in BDT, cost per kg in BDT, 5% statutory concessional import duty, and landed cost.

### 3.5 WHO GHO Public Health Indicators
- **`GET /api/external/public-health`**
  - Returns Bangladesh essential medicine target benchmarks (e.g. WHO 80% target availability).

---

## 4. AI Service Integration

The FastAPI AI service consumes external data to ground its simulations and risk evaluations:
- **Supplier Risk (`POST /ai/risk/supplier`)**: Accepts `weather_risk_score` from Open-Meteo to adjust operational transit delay exposure.
- **Disruption Simulation (`POST /ai/simulate/disruption`)**: Accepts `weather_transit_delay_days` (derived from monsoon rainfall) to dynamically extend downstream port-to-clinic lead times.
- **Copilot (`POST /ai/copilot/explain`)**: Incorporates corridor weather and foreign procurement rates into plain-language explanations.

All data labels clearly distinguish:
- **`External observation`**: Raw measurements from Open-Meteo, OSRM, Nominatim, Frankfurter, or WHO GHO.
- **`Database record`**: Internal system records.
- **`Simulated data`**: Model forecasts and optimizer outputs.

