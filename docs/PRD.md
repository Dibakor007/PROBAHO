# PROBAHO (প্রবাহ) — Product Requirements Document (PRD)

## 1. Executive Summary
PROBAHO is an AI-powered decision-support platform for Bangladesh's pharmaceutical supply chain. It connects imported Active Pharmaceutical Ingredient shipments through manufacturing and central distribution down to upazila health complexes and community clinics.

> ⚠️ **Synthetic Data Notice:** All data used across PROBAHO is synthetic and explicitly labeled as such in the UI. PROBAHO is not connected to any government or national system and provides no clinical advice, prescribing, or medicine substitution.

## 2. Core Capabilities (P0 Scope)
1. **Supply Chain Digital Twin:** Interactive network from raw Active Pharmaceutical Ingredient supplier to last-mile clinic shelf.
2. **Demand Forecasting & Days of Cover:** Rolling-origin validated models (Naive, Moving Average, Exponential Smoothing, Holt-Winters) with 80% confidence bands.
3. **Disruption Simulation:** Discrete daily simulation modeling shipment delays, supplier shortfalls, manufacturing cuts, and freight cost spikes.
4. **FEFO Inventory & Expiry Intelligence:** Prioritizes batches by earliest expiry and flags batches with unconsumed expiry exposure.
5. **Constrained Redistribution Optimization:** Google OR-Tools CP-SAT multi-objective optimization under safety stock, capacity, and shelf-life constraints.
6. **Bilingual Grounded Copilot:** Plain-language explanations in English and Bangla (বাংলা), strictly verified against deterministic backend tool outputs.
7. **Tamper-Evident Audit Chain:** SHA-256 hash chaining of all decisions with single-click verification.

## 3. User Personas
- **Central Supply Chain Analyst:** Stress-tests supply shocks, evaluates supplier risks, and runs disruption scenarios.
- **District Approver / Civil Surgeon:** Reviews and authorizes inter-facility transfer recommendations with recorded reasons.
- **Facility Store Keeper / Pharmacist:** Monitors local days of cover, verifies FEFO dispensing order, and records physical stock count adjustments.
- **Auditor / Evaluator:** Validates the cryptographic integrity of decisions and verifies forecasting error benchmarks.

