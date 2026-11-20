import test from 'node:test';
import assert from 'node:assert/strict';
import { auditChainInstance } from '../src/services/auditChain.js';

test('Audit chain - records events and verifies clean chain', () => {
  auditChainInstance.chain = []; // Reset for test

  auditChainInstance.append('TEST_EVENT_1', 'Admin', 'admin', { note: 'Initial test entry' });
  auditChainInstance.append('TEST_EVENT_2', 'Approver', 'approver', { decision: 'approved' });

  const verification = auditChainInstance.verify();
  assert.equal(verification.valid, true);
  assert.equal(verification.total_events, 2);
});

test('Audit chain - detects tampering when past event is modified', () => {
  auditChainInstance.chain = [];

  auditChainInstance.append('EVENT_A', 'Alice', 'analyst', { run: 1 });
  auditChainInstance.append('EVENT_B', 'Bob', 'approver', { run: 2 });
  auditChainInstance.append('EVENT_C', 'Charlie', 'admin', { run: 3 });

  // Tamper with EVENT_B payload
  auditChainInstance.chain[1].payload = { run: 999, tampered: true };

  const verification = auditChainInstance.verify();
  assert.equal(verification.valid, false);
  assert.equal(verification.broken_at_index, 1);
  assert.match(verification.reason, /Tamper detected/);
});

