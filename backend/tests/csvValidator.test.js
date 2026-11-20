import test from 'node:test';
import assert from 'node:assert/strict';
import { validateStockCSV } from '../src/services/csvValidator.js';

test('CSV Validator - parses valid stock rows', () => {
  const rows = [
    {
      facility_id: 'fac-001',
      medicine_id: 'med-001',
      batch_number: 'BATCH-2026-A',
      quantity: 500,
      manufacture_date: '2025-01-01',
      expiry_date: '2027-01-01'
    },
    {
      facility_id: 'fac-002',
      medicine_id: 'med-002',
      batch_number: 'BATCH-2026-B',
      quantity: 1200,
      manufacture_date: '2025-02-01',
      expiry_date: '2026-12-31'
    }
  ];

  const report = validateStockCSV(rows);
  assert.equal(report.is_valid, true);
  assert.equal(report.summary.valid_count, 2);
  assert.equal(report.summary.invalid_count, 0);
  assert.equal(report.summary.duplicate_count, 0);
});

test('CSV Validator - flags duplicates and impossible expiry dates', () => {
  const rows = [
    {
      facility_id: 'fac-001',
      medicine_id: 'med-001',
      batch_number: 'DUP-001',
      quantity: 100,
      manufacture_date: '2025-01-01',
      expiry_date: '2027-01-01'
    },
    {
      facility_id: 'fac-001',
      medicine_id: 'med-001',
      batch_number: 'DUP-001', // Duplicate!
      quantity: 200,
      manufacture_date: '2025-01-01',
      expiry_date: '2027-01-01'
    },
    {
      facility_id: 'fac-002',
      medicine_id: 'med-001',
      batch_number: 'BAD-DATE',
      quantity: 50,
      manufacture_date: '2026-05-01',
      expiry_date: '2025-01-01' // Impossible expiry before manufacture
    }
  ];

  const report = validateStockCSV(rows);
  assert.equal(report.is_valid, false);
  assert.equal(report.summary.valid_count, 1);
  assert.equal(report.summary.duplicate_count, 1);
  assert.equal(report.summary.invalid_count, 1);
});

