# PROBAHO Synthetic Supply Chain Dataset Card

## Dataset Name
**PROBAHO Synthetic Supply Chain Data**

## Purpose
Demonstration and pipeline validation for the PROBAHO (প্রবাহ) AI
decision-support system.  This dataset powers forecasting, inventory
analytics, disruption simulation, and redistribution optimisation inside
the prototype.

> **⚠️ All data is synthetic.**  It does not represent any real supply
> chain, government system, or patient information.

## Generation

| Property | Value |
|---|---|
| Generator script | `ai-service/seed/generator.py` |
| Random seed | `42` (deterministic) |
| Language | Python 3.11+, NumPy |
| Reference date | 2025-07-15 |
| Consumption window | 2024-07-15 → 2025-07-14 (365 days) |

Running the generator twice with the same seed produces bit-identical
output.

## Contents

### `facilities.json`
All supply-chain nodes: 1 Active Pharmaceutical Ingredient supplier, 1
manufacturer, 1 central warehouse, 3 upazila health complexes (UHC), and
3 community clinics (CC).

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique node identifier (e.g. `SUP-001`, `FAC-003`) |
| `name` | string | Display name (Bangla for facilities) |
| `name_en` | string | English name (facilities only) |
| `location` | string | City / area |
| `coords` | [lat, lon] | GPS coordinates |
| `type` | string | `supplier` · `manufacturer` · `warehouse` · `facility` |
| `subtype` | string | `upazila_health_complex` · `community_clinic` (facilities only) |
| `capacity` | int | Max storage units (facilities only) |
| `capacity_units_per_day` | int | Production capacity (manufacturer only) |
| `production_lag_days` | int | Manufacturing lead time in days |
| `ingredient_per_unit` | float | Active Pharmaceutical Ingredient required per finished unit |

### `medicines.json`
Five tracer medicines used across all facilities.

| Field | Type | Description |
|---|---|---|
| `id` | string | `MED-001` … `MED-005` |
| `name` | string | Generic name + strength |
| `form` | string | `tablet` · `capsule` · `sachet` |

### `batches.json`
Inventory batches (3–5 per medicine per facility).

| Field | Type | Description |
|---|---|---|
| `id` | string | `BAT-0001` … |
| `medicine_id` | string | FK → medicines |
| `facility_id` | string | FK → facilities (facility nodes only) |
| `quantity` | int | Units in batch (100–500) |
| `manufacture_date` | date | ISO 8601 |
| `expiry_date` | date | ISO 8601 — some near-expiry or already expired |

### `consumption.json`
Daily consumption records (6 facilities × 5 medicines × 365 days =
10 950 rows).

| Field | Type | Description |
|---|---|---|
| `facility_id` | string | FK → facilities |
| `medicine_id` | string | FK → medicines |
| `date` | date | ISO 8601 |
| `quantity` | float | Units consumed (≥ 0) |

**Seasonality**:
- ORS Sachets (`MED-005`): **2×** during monsoon months (Jun–Sep).
- Amoxicillin 500 mg (`MED-002`): **1.25×** in winter (Nov–Feb).
- Gaussian noise with ~10 % standard deviation, clipped at zero.

### `routes.json`
Transport routes with lead times and costs.

| Field | Type | Description |
|---|---|---|
| `id` | string | `RT-001` … |
| `from_id` | string | Origin node |
| `to_id` | string | Destination node |
| `lead_time_days` | int | Transit time |
| `cost_per_unit` | float | BDT cost per unit shipped |

Includes warehouse → facility routes (UHC 1–2 d, CC 2–3 d) and selected
inter-facility routes (1–3 d).

### `safety_stock.json`
Pre-computed safety-stock levels.

| Field | Type | Description |
|---|---|---|
| `facility_id` | string | FK → facilities |
| `medicine_id` | string | FK → medicines |
| `average_daily_consumption` | float | Mean of 365-day consumption |
| `safety_stock_days` | int | Always 14 |
| `safety_stock_quantity` | float | 14 × average daily consumption |

## Limitations

- **Synthetic only** — generated from hand-picked base rates and simple
  noise models; it does not capture the complexity of a real
  pharmaceutical supply chain.
- **No patient or clinical data** — the dataset contains no personally
  identifiable information.
- **Fixed topology** — a small network (9 nodes) for demonstration; a
  production system would handle hundreds of facilities.
- **Single reference date** — batch expiry calculations are anchored to
  2025-07-15.

## License
Released under the MIT License as part of the PROBAHO project.
