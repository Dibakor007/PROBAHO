-- ============================================================================
-- PROBAHO (প্রবাহ) Database Schema (PostgreSQL)
-- All operational data is synthetic for demonstration and decision support
-- ============================================================================

-- Roles: 'admin', 'approver', 'facility', 'analyst'
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('admin', 'approver', 'facility', 'analyst')),
    facility_id VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS facilities (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    type VARCHAR(64) NOT NULL, -- 'upazila_health_complex', 'community_clinic'
    district VARCHAR(128) NOT NULL,
    division VARCHAR(128) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    storage_capacity_units INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS medicines (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_bn VARCHAR(255) NOT NULL,
    dosage_form VARCHAR(64) NOT NULL,
    strength VARCHAR(64) NOT NULL,
    therapeutic_class VARCHAR(128) NOT NULL,
    unit VARCHAR(32) NOT NULL,
    essential_medicine_level VARCHAR(64) NOT NULL,
    ingredient_name VARCHAR(255) NOT NULL, -- Active Pharmaceutical Ingredient
    ingredient_per_unit_grams DOUBLE PRECISION NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredient_materials (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    chemical_formula VARCHAR(128),
    supplier_id VARCHAR(64) NOT NULL,
    country_of_origin VARCHAR(128) NOT NULL,
    lead_time_days INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS suppliers (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(128) NOT NULL,
    reliability_score DOUBLE PRECISION NOT NULL DEFAULT 0.85,
    average_delay_days DOUBLE PRECISION NOT NULL DEFAULT 2.0,
    contact_email VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS ingredient_shipments (
    id VARCHAR(64) PRIMARY KEY,
    supplier_id VARCHAR(64) REFERENCES suppliers(id),
    ingredient_name VARCHAR(255) NOT NULL,
    quantity_kg DOUBLE PRECISION NOT NULL,
    status VARCHAR(32) NOT NULL, -- 'scheduled', 'in_transit', 'delayed', 'delivered'
    departure_date DATE NOT NULL,
    scheduled_arrival DATE NOT NULL,
    actual_arrival DATE,
    delay_days INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS warehouses (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    capacity_units INTEGER NOT NULL,
    current_occupancy INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS inventory_batches (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) REFERENCES facilities(id),
    warehouse_id VARCHAR(64) REFERENCES warehouses(id),
    medicine_id VARCHAR(64) REFERENCES medicines(id),
    batch_number VARCHAR(64) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity >= 0),
    manufacture_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    is_quarantined BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS consumption_records (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) REFERENCES facilities(id),
    medicine_id VARCHAR(64) REFERENCES medicines(id),
    date DATE NOT NULL,
    quantity_dispensed INTEGER NOT NULL,
    is_synthetic BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS forecasts (
    id VARCHAR(64) PRIMARY KEY,
    facility_id VARCHAR(64) REFERENCES facilities(id),
    medicine_id VARCHAR(64) REFERENCES medicines(id),
    forecast_date DATE NOT NULL,
    horizon_days INTEGER NOT NULL,
    daily_forecast_mean DOUBLE PRECISION NOT NULL,
    daily_forecast_lower DOUBLE PRECISION NOT NULL,
    daily_forecast_upper DOUBLE PRECISION NOT NULL,
    days_of_cover DOUBLE PRECISION NOT NULL,
    expected_stockout_date DATE,
    model_used VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS scenarios (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    shipment_delay_days INTEGER NOT NULL DEFAULT 0,
    supplier_shortfall_pct DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    freight_cost_increase_pct DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    manufacturing_capacity_cut_pct DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    simulated_by VARCHAR(64) REFERENCES users(id),
    result_summary JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS recommendations (
    id VARCHAR(64) PRIMARY KEY,
    from_facility_id VARCHAR(64) REFERENCES facilities(id),
    to_facility_id VARCHAR(64) REFERENCES facilities(id),
    medicine_id VARCHAR(64) REFERENCES medicines(id),
    batch_id VARCHAR(64) REFERENCES inventory_batches(id),
    quantity INTEGER NOT NULL,
    transport_cost DOUBLE PRECISION NOT NULL,
    urgency VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    explanation_en TEXT,
    explanation_bn TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS approvals (
    id VARCHAR(64) PRIMARY KEY,
    recommendation_id VARCHAR(64) REFERENCES recommendations(id),
    action VARCHAR(32) NOT NULL CHECK (action IN ('approved', 'rejected')),
    decided_by VARCHAR(64) REFERENCES users(id),
    decided_by_name VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(64) PRIMARY KEY,
    sequence_number BIGINT NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    actor_id VARCHAR(64),
    actor_name VARCHAR(255) NOT NULL,
    actor_role VARCHAR(32) NOT NULL,
    payload JSONB NOT NULL,
    previous_hash VARCHAR(64) NOT NULL,
    event_hash VARCHAR(64) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_seq ON audit_logs(sequence_number);
CREATE INDEX IF NOT EXISTS idx_audit_hash ON audit_logs(event_hash);

