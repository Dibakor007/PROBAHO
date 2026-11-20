import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSupplierRisk } from '../src/services/supplierRiskService.js';

test('Supplier risk calculation - valid normalized score between 0 and 100', () => {
  const supplier = {
    id: 'test-sup',
    name: 'Test Supplier',
    delay_ratio: 0.2,
    leadtime_variability: 0.1,
    fulfilment_gap: 0.1,
    route_concentration: 0.3,
    cover_ratio: 0.9
  };

  const result = calculateSupplierRisk(supplier);
  assert.equal(result.data_label, 'Synthetic data');
  assert.equal(result.is_simulated, true);
  assert.ok(result.risk_score >= 0 && result.risk_score <= 100);
  assert.equal(result.risk_tier, 'LOW');
});

test('Supplier risk calculation - high risk score when delay and variability are extreme', () => {
  const extremeSupplier = {
    id: 'sup-risky',
    name: 'Risky Supplier',
    delay_ratio: 0.9,
    leadtime_variability: 0.85,
    fulfilment_gap: 0.8,
    route_concentration: 0.95,
    cover_ratio: 0.1
  };

  const result = calculateSupplierRisk(extremeSupplier);
  assert.ok(result.risk_score >= 70, `Expected score >= 70, got ${result.risk_score}`);
  assert.equal(result.risk_tier, 'HIGH');
});

test('Supplier risk calculation - weights are transparent and sum to 1', () => {
  const result = calculateSupplierRisk({ delay_ratio: 0.5 });
  const sumWeights = Object.values(result.weights).reduce((a, b) => a + b, 0);
  assert.ok(Math.abs(sumWeights - 1.0) < 0.05, `Weights should sum to approx 1, got ${sumWeights}`);
});

