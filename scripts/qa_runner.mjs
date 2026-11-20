/**
 * PROBAHO Comprehensive QA Test Runner
 * Executes Black-Box, Integration, and Boundary API tests against live running services.
 */
const BACKEND_URL = 'http://localhost:5000';
const AI_URL = 'http://localhost:8000';

async function fetchJson(url, options = {}) {
  const start = Date.now();
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const duration = Date.now() - start;
  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }
  return { status: res.status, ok: res.ok, data, duration };
}

const results = [];

async function testCase(category, name, testFn) {
  try {
    const detail = await testFn();
    results.push({ category, name, passed: true, ...detail });
    console.log(`  ✔ [PASS] [${category}] ${name} (${detail.duration || 0}ms)`);
  } catch (err) {
    results.push({ category, name, passed: false, error: err.message });
    console.log(`  ✖ [FAIL] [${category}] ${name}: ${err.message}`);
  }
}

async function runAllQATests() {
  console.log('\n============================================================');
  console.log('🧪 PROBAHO PROFESSIONAL QA TEST SUITE: BLACK-BOX & INTEGRATION');
  console.log('============================================================\n');

  // --- Category 1: Health & Discovery (Black-Box) ---
  console.log('▶ 1. Service Health & Handshake');
  await testCase('Black-Box', 'Backend Gateway Health Check', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/health`);
    if (res.status !== 200 || res.data.status !== 'healthy') throw new Error(`Unexpected status: ${res.status}`);
    return { duration: res.duration, info: res.data.service };
  });

  await testCase('Black-Box', 'AI Service Health Check', async () => {
    const res = await fetchJson(`${AI_URL}/ai/health`);
    if (res.status !== 200 || res.data.status !== 'healthy') throw new Error(`Unexpected status: ${res.status}`);
    return { duration: res.duration, info: res.data.status };
  });

  // --- Category 2: Machine Learning & Decision Support (Integration) ---
  console.log('\n▶ 2. AI Predictive & Optimization Engines');
  await testCase('Integration', 'Demand Forecast (Holt-Winters 30-Day)', async () => {
    const res = await fetchJson(`${AI_URL}/ai/forecast/demand`, {
      method: 'POST',
      body: JSON.stringify({
        facility_id: 'FAC-001',
        medicine_id: 'MED-001',
        model: 'holt_winters',
        horizon: 30
      })
    });
    if (res.status !== 200 || !Array.isArray(res.data.forecast) || res.data.forecast.length !== 30) {
      throw new Error(`Forecast output invalid: ${JSON.stringify(res.data)}`);
    }
    return { duration: res.duration, info: `Forecast horizon: ${res.data.horizon} days` };
  });

  await testCase('Integration', 'Active Pharmaceutical Ingredient Requirements Model', async () => {
    const res = await fetchJson(`${AI_URL}/ai/forecast/api-requirements`, {
      method: 'POST',
      body: JSON.stringify({
        medicine_id: 'MED-001',
        units_demanded: 50000,
        horizon_days: 30
      })
    });
    if (res.status !== 200 || typeof res.data.required_active_pharmaceutical_ingredient_kg !== 'number') {
      throw new Error(`Requirements missing: ${JSON.stringify(res.data)}`);
    }
    return { duration: res.duration, info: `Required Active Pharmaceutical Ingredient: ${res.data.required_active_pharmaceutical_ingredient_kg} kg` };
  });

  await testCase('Integration', 'Supplier Delay & Volatility Risk Scoring', async () => {
    const res = await fetchJson(`${AI_URL}/ai/risk/supplier`, {
      method: 'POST',
      body: JSON.stringify({
        supplier_id: 'SUP-001',
        delay_ratio: 0.35,
        leadtime_variability: 0.40,
        fulfilment_gap: 0.20
      })
    });
    if (res.status !== 200 || typeof res.data.risk_score !== 'number') throw new Error(`Invalid risk output`);
    return { duration: res.duration, info: `Score: ${res.data.risk_score}/100 (${res.data.risk_tier})` };
  });

  await testCase('Integration', 'Disruption Simulator (60-Day Discrete Event)', async () => {
    const res = await fetchJson(`${AI_URL}/ai/simulate/disruption`, {
      method: 'POST',
      body: JSON.stringify({
        shipment_delay_days: 14,
        supplier_shortfall_pct: 0.30,
        manufacturing_capacity_cut_pct: 0.25,
        freight_cost_increase_pct: 0.40,
        horizon: 60
      })
    });
    if (res.status !== 200 || !res.data.baseline || !res.data.disrupted) throw new Error(`Simulation failed`);
    return { duration: res.duration, info: `Simulated propagation steps: ${res.data.propagation_path?.length || 0}` };
  });

  await testCase('Integration', 'OR-Tools Redistribution Optimizer (CP-SAT)', async () => {
    const res = await fetchJson(`${AI_URL}/ai/optimize/redistribution`, {
      method: 'POST',
      body: JSON.stringify({ reference_date: '2025-07-15' })
    });
    if (res.status !== 200 || !Array.isArray(res.data.transfers)) throw new Error(`Optimization failed`);
    return { duration: res.duration, info: `Generated transfers: ${res.data.transfers.length}` };
  });

  await testCase('Integration', 'FEFO Expiry Risk & Waste Detection', async () => {
    const res = await fetchJson(`${AI_URL}/ai/expiry/analyze`, {
      method: 'POST',
      body: JSON.stringify({ reference_date: '2025-07-15', horizon: 90 })
    });
    if (res.status !== 200 || !Array.isArray(res.data.expiry_exposure_alerts)) throw new Error(`Expiry analyze failed`);
    return { duration: res.duration, info: `FEFO flagged batches: ${res.data.expiry_exposure_alerts.length}` };
  });

  // --- Category 3: External Public APIs (Integration & Attribution) ---
  console.log('\n▶ 3. External Public APIs (Open-Meteo, OSRM, Nominatim, Frankfurter, WHO)');
  await testCase('External-API', 'Open-Meteo Corridor Weather Monitoring', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/external/weather/corridors`);
    if (res.status !== 200 || !res.data.corridors?.dhaka) throw new Error(`Corridor weather failed`);
    return { duration: res.duration, info: `Attribution: ${res.data.corridors.dhaka.weather.metadata.source}` };
  });

  await testCase('External-API', 'OSRM Highway Routing & Distance Matrix', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/external/route?from_lat=23.7800&from_lon=90.4000&to_lat=25.4167&to_lon=89.3167&from_id=WH-001&to_id=FAC-001`);
    if (res.status !== 200 || !res.data.route) throw new Error(`Routing failed`);
    return { duration: res.duration, info: `${res.data.route.distance_km} km (${res.data.route.duration_hours}h)` };
  });

  await testCase('External-API', 'Nominatim Facility Geocoder', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/external/geocode?q=Pirganj+Upazila+Health+Complex`);
    if (res.status !== 200 || !res.data.data) throw new Error(`Geocoding failed`);
    return { duration: res.duration, info: `Coordinates: [${res.data.data.lat}, ${res.data.data.lon}]` };
  });

  await testCase('External-API', 'Frankfurter Currency Converter (USD to BDT with 5% Duty)', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/external/currency/convert`, {
      method: 'POST',
      body: JSON.stringify({
        amount: 10000,
        from: 'USD',
        quantity_kg: 1000,
        ingredient_name: 'Paracetamol Active Pharmaceutical Ingredient'
      })
    });
    if (res.status !== 200 || !res.data.conversion) throw new Error(`Currency conversion failed: ${JSON.stringify(res.data)}`);
    return { duration: res.duration, info: `Total BDT: ৳${res.data.conversion.total_cost_bdt.toLocaleString()} (Rate: ${res.data.conversion.conversion_rate_to_bdt})` };
  });

  await testCase('External-API', 'WHO GHO Essential Medicine Benchmark', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/external/public-health`);
    if (res.status !== 200 || !res.data.indicators) throw new Error(`WHO GHO failed`);
    return { duration: res.duration, info: `Target availability: ${res.data.indicators.essential_medicines_availability_target}%` };
  });

  // --- Category 4: Negative & Boundary Testing (Security & Invariants) ---
  console.log('\n▶ 4. Negative & Boundary Testing');
  await testCase('Negative-Boundary', 'Rejects Unauthenticated Protected Inventory Write', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/inventory`, {
      method: 'POST',
      body: JSON.stringify({ facility_id: 'FAC-001', medicine_id: 'MED-001', quantity: 100 })
    });
    if (res.status !== 401 && res.status !== 403) throw new Error(`Expected 401/403, got ${res.status}`);
    return { duration: res.duration, info: `Correctly rejected with HTTP ${res.status}` };
  });

  await testCase('Negative-Boundary', 'Rejects Invalid Forecasting Parameters', async () => {
    const res = await fetchJson(`${AI_URL}/ai/forecast/demand`, {
      method: 'POST',
      body: JSON.stringify({
        facility_id: '',
        medicine_id: '',
        horizon: -5
      })
    });
    if (res.status !== 400 && res.status !== 422) throw new Error(`Expected 400/422 validation error, got ${res.status}`);
    return { duration: res.duration, info: `Rejected invalid negative horizon with HTTP ${res.status}` };
  });

  await testCase('Negative-Boundary', 'Tamper-Evident SHA-256 Audit Chain Verification', async () => {
    const res = await fetchJson(`${BACKEND_URL}/api/audit/verify`);
    if (res.status !== 200 || res.data.status !== 'VERIFIED' || res.data.verification?.valid !== true) {
      throw new Error(`Audit chain verification reported broken: ${JSON.stringify(res.data)}`);
    }
    return { duration: res.duration, info: `Chain Status: ${res.data.status} | Events verified: ${res.data.verification.total_events}` };
  });

  // --- Category 5: Standardized Prompt Library (Addendum v1.1 C1, C2, C3) ---
  console.log('\n▶ 5. Prompt Library & AI Quality Engine (Addendum v1.1)');
  await testCase('Prompt-Library', 'Prompt Catalog Discovery (C1, C2, C3)', async () => {
    const res = await fetchJson(`${AI_URL}/ai/copilot/prompts`);
    if (res.status !== 200 || !res.data.prompts || res.data.prompts.length !== 3) {
      throw new Error(`Catalog discovery failed: ${JSON.stringify(res.data)}`);
    }
    return { duration: res.duration, info: `Discovered ${res.data.prompts.length} standardized prompts (C1, C2, C3)` };
  });

  await testCase('Prompt-Library', 'Execute C1 Supply Chain Risk Detection', async () => {
    const res = await fetchJson(`${AI_URL}/ai/copilot/prompts/execute`, {
      method: 'POST',
      body: JSON.stringify({
        prompt_id: 'C1',
        input_data: { affected_medicines: ['Paracetamol 500mg'], shipment_delay_days: 14 }
      })
    });
    if (res.status !== 200 || res.data.prompt_id !== 'C1' || !res.data.assessment) {
      throw new Error(`C1 prompt execution failed`);
    }
    return { duration: res.duration, info: `Risk Level: ${res.data.assessment.risk_level} | Mitigations: ${res.data.assessment.recommendations.length}` };
  });

  await testCase('Prompt-Library', 'Execute C3 Output Quality Validator', async () => {
    const res = await fetchJson(`${AI_URL}/ai/copilot/prompts/execute`, {
      method: 'POST',
      body: JSON.stringify({
        prompt_id: 'C3',
        input_data: {
          ai_assessment: { stock: 1200 },
          trusted_backend_result: { stock: 1200 }
        }
      })
    });
    if (res.status !== 200 || res.data.prompt_id !== 'C3' || !res.data.validation_report) {
      throw new Error(`C3 validator execution failed`);
    }
    return { duration: res.duration, info: `Status: ${res.data.validation_report.validation_status} | Schema Valid: ${res.data.validation_report.schema_validity}` };
  });

  // --- Summary ---
  console.log('\n============================================================');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  console.log(`📊 QA SUMMARY: Total Tests: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
  console.log('============================================================\n');

  if (failed > 0) process.exit(1);
}

runAllQATests().catch(err => {
  console.error('Fatal QA error:', err);
  process.exit(1);
});
