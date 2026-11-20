# PROBAHO (প্রবাহ) — AI Decision Support for Bangladesh Medicine Supply Chain

**Resilient, Data-Driven Pharmaceutical Logistics Decision-Support System**

> ⚠️ **IMPORTANT NOTICE:** All data is synthetic. PROBAHO is an independent decision-support prototype and has **no connection to any government or national system**. Active Pharmaceutical Ingredient (always spelled in full) shipments, warehouse nodes, healthcare facilities, and consumption histories are simulated. The AI Copilot provides explanatory assistance only and **never calculates quantities, approves transfers, or executes clinical decisions**.

---

## 🌟 Executive Summary

**PROBAHO (প্রবাহ — "flow")** is a production-grade hackathon prototype designed to mitigate drug stockouts, expired medicine waste, and Active Pharmaceutical Ingredient import disruption risks across Bangladesh.

From maritime port arrivals of Active Pharmaceutical Ingredients to regional central warehouses, Upazila Health Complexes, and remote Community Clinics, PROBAHO provides:
1. **Disruption Propagation Simulation:** Forecasts downstream stockout impacts 60 days into the future under customs delays, production bottlenecks, and freight spikes.
2. **Demand Forecasting & Days of Cover:** Classical statistical & ML forecasting (Holt-Winters, Exponential Smoothing, Moving Average) with dynamic days-of-cover intelligence excluding expired stock.
3. **FEFO Expiry Risk Detection:** Flags batches at risk of expiring unused before consumption.
4. **Constrained Stock Redistribution:** Mathematical optimization via Google OR-Tools CP-SAT solver balancing unmet demand, transport costs, and geographic safety stock thresholds.
5. **Tamper-Evident Hash-Chained Audit Trail:** SHA-256 cryptographic chaining of all human approvals, adjustments, and rejections.
6. **5 External Public API Integrations:** Real-time weather monitoring (Open-Meteo), routing & distance (OSRM), geocoding (Nominatim), FX procurement conversions (Frankfurter), and global health benchmarks (WHO GHO).
7. **Live `/docs` Module:** Y Combinator–style pitch deck, interactive technical deep dive, auto-synced live system telemetry, and admin-controlled scheduling access.

---

## 🏗️ System Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                            Frontend (React 18 + Vite)                            │
│   Tailwind CSS (Dark Navy #0a1628) · Lucide Icons · Recharts · Bilingual (BN/EN) │
│                                                                                  │
│  [Executive Dashboard]  [Supply Chain Digital Twin]  [Medicine Inventory]       │
│  [AI Forecast Center]   [Disruption Simulator]       [Stock Redistribution]     │
│  [AI Copilot Explainer] [Human Approvals & Audit]    [Live /docs & YC Pitch]    │
└───────────────────────┬──────────────────────────────┬───────────────────────────┘
                        │ HTTP / REST                  │ Direct AI HTTP
                        ▼                              ▼
┌──────────────────────────────────────────┐  ┌────────────────────────────────────┐
│      Node.js Gateway / Business Tier     │  │       FastAPI AI & ML Service      │
│            (Express, Port 5000)          │  │        (Python 3.11, Port 8000)    │
├──────────────────────────────────────────┤  ├────────────────────────────────────┤
│ • RBAC Auth & Middleware                 │  │ • Demand Forecaster (Holt-Winters) │
│ • CSV Upload & Feasibility Validator     │  │ • OR-Tools Redistribution Solver   │
│ • SHA-256 Tamper-Evident Audit Chain     │  │ • Discrete-Event Disruption Engine │
│ • In-Memory / PostgreSQL Persistence     │  │ • FEFO Expiry Intelligence         │
│ • Live /docs Config & Schedule Engine    │  │ • Gemini LLM Copilot (Explanations)│
│ • 5 External API Integrations:           │  │ • Deterministic Seed Generator     │
│   - Open-Meteo (Weather risks)           │  │ • Cross-Validation Evaluation      │
│   - OSRM (Shipment routing)              │  └────────────────────────────────────┘
│   - Nominatim (Geocoding)                │
│   - Frankfurter (USD/EUR to BDT FX)      │
│   - WHO GHO (Public health indicators)   │
└──────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.11 or higher (with `pip`)

### 1. Environment Configuration
Copy the provided `.env.example` file to `.env`:
```bash
cp .env.example .env
```
Default configuration is pre-configured for local development.

### 2. Start AI & Optimization Service (Python FastAPI)
```bash
# Navigate to ai-service
cd ai-service

# Install dependencies
pip install -r requirements.txt

# Run FastAPI service on port 8000
python -m uvicorn main:app --reload --port 8000
```
*Health check:* `http://localhost:8000/ai/health`

### 3. Start Business Gateway (Node.js Express)
```bash
# Navigate to backend in a new terminal
cd backend

# Install dependencies
npm install

# Start Express server on port 5000
npm start
```
*Health check:* `http://localhost:5000/api/health`

### 4. Start Frontend (React + Vite)
```bash
# Navigate to frontend in a new terminal
cd frontend

# Install dependencies
npm install

# Start Vite development server
npm run dev
```
Open your browser to: **`http://localhost:5173`**

---

## 🧪 Testing & Verification

The platform includes full automated test suites across all tiers.

Run all tests from the repository root:
```bash
# Run all backend tests (34 tests, 9 suites)
npm run test:backend

# Run all AI service tests (58 tests)
npm run test:ai

# Test both suites together
npm run test

# Verify production frontend build
npm run build:frontend
```

---

## 📑 Live `/docs` Endpoint & Pitch Deck

Navigate to **`http://localhost:5173/docs`** to view the live documentation module:
- **YC-Style Pitch Deck:** 12 structured slides (Problem, Solution, Why Now, Product Demo, Market Opportunity, Business Model, Traction, Competition, Unique Advantage, Go-To-Market, Team, Vision).
- **Technical Deep Dive:** Interactive architecture diagrams, security specifications, external API integrations, and mathematical formulas (KaTeX).
- **Live System Telemetry:** Real-time data feed showing node counts, inventory status, cryptographic audit verification, and weather corridor risks.
- **Access Control & Scheduling Panel:** Authenticated administrators can toggle public visibility, set date/time availability windows (e.g. for hackathon judging), or grant instant overrides.

---

## 🛡️ External API Attribution & Policies

1. **Open-Meteo:** Open-access weather forecasting API (Non-commercial / CC BY 4.0).
2. **OSRM (Project-OSRM):** Open Source Routing Machine using OpenStreetMap data (ODbL).
3. **Nominatim:** OpenStreetMap search and reverse geocoding under the ODbL licence with proper User-Agent identification and rate-limiting.
4. **Frankfurter:** Open-source exchange rate API tracking the European Central Bank.
5. **WHO Global Health Observatory (GHO):** World Health Organization open data repository for mortality and health indicators.

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
