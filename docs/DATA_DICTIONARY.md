# PROBAHO (প্রবাহ) — Data Dictionary

## 1. Entities & Data Fields

### 1.1 Facility (`facilities`)
- `id`: Unique facility identifier (e.g. `FAC-001`).
- `name`: English facility name (e.g. `Pirganj Upazila Health Complex`).
- `name_bn`: Bangla facility name (e.g. `পীরগঞ্জ উপজেলা স্বাস্থ্য কমপ্লেক্স`).
- `type`: Facility classification (`upazila_health_complex` or `community_clinic`).
- `district`: Administrative district (e.g. `Rangpur`, `Bagerhat`, `Madaripur`).
- `division`: Administrative division.
- `latitude`, `longitude`: WGS84 GPS coordinates.
- `storage_capacity_units`: Maximum volumetric storage in medicine units.

### 1.2 Medicine (`medicines`)
- `id`: Medicine identifier (e.g. `MED-001`).
- `name`: Finished medicine brand/generic description (e.g. `Paracetamol 500mg Tablet`).
- `name_bn`: Bangla name.
- `dosage_form`: Tablet, Capsule, or Sachet.
- `strength`: Active strength per unit (e.g. `500mg`).
- `ingredient_name`: Active Pharmaceutical Ingredient identifier (e.g. `Paracetamol Pure Powder`).
- `ingredient_per_unit_grams`: Grams of raw Active Pharmaceutical Ingredient required to produce one unit of finished medicine.

### 1.3 Inventory Batch (`inventory_batches`)
- `batch_number`: Physical batch code (e.g. `BAT-2025-01`).
- `facility_id`: Node location holding the batch.
- `quantity`: Usable units in stock.
- `manufacture_date`: Date manufactured (YYYY-MM-DD).
- `expiry_date`: Expiry date (YYYY-MM-DD).
- `is_quarantined`: Boolean flag indicating whether the batch is quarantined for quality inspection.

### 1.4 Active Pharmaceutical Ingredient Shipment (`ingredient_shipments`)
- `id`: Shipment ID (e.g. `SHP-001`).
- `supplier_id`: Identifier of upstream vendor.
- `quantity_kg`: Weight of raw Active Pharmaceutical Ingredient in kilograms.
- `status`: `scheduled`, `in_transit`, `delayed`, or `delivered`.
- `departure_date`: Date dispatched from port of origin.
- `scheduled_arrival`: Expected arrival at Bangladesh port of entry.
- `actual_arrival`: Recorded dock clearance date.
- `delay_days`: Days delayed past scheduled arrival.

### 1.5 Audit Log Record (`audit_logs`)
- `sequence_number`: Monotonically increasing 64-bit integer.
- `event_type`: Standard event code (e.g. `RECOMMENDATION_APPROVED`, `STOCK_ADJUSTMENT`).
- `actor_name`: Name of authenticated user initiating the action.
- `actor_role`: System role (`admin`, `approver`, `facility`, `analyst`).
- `payload`: Canonical JSON representation of event parameters.
- `previous_hash`: SHA-256 hash of the immediate preceding block.
- `event_hash`: SHA-256 hash of `previous_hash + canonical_json(event)`.

