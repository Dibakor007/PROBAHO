import test from 'node:test';
import assert from 'node:assert/strict';
import { requireRole } from '../src/middleware/rbac.js';

test('RBAC Middleware - permits authorized roles', () => {
  const middleware = requireRole('approver', 'admin');
  
  let nextCalled = false;
  const req = { user: { role: 'approver', name: 'Dr. Rafiqul' } };
  const res = {
    status: () => ({ json: () => {} })
  };
  const next = () => { nextCalled = true; };

  middleware(req, res, next);
  assert.equal(nextCalled, true);
});

test('RBAC Middleware - rejects unauthorized roles with 403', () => {
  const middleware = requireRole('approver', 'admin');
  
  let statusCode = null;
  let responseBody = null;
  const req = { user: { role: 'facility', name: 'Store Keeper' } };
  const res = {
    status: (code) => {
      statusCode = code;
      return {
        json: (body) => { responseBody = body; }
      };
    }
  };
  const next = () => {};

  middleware(req, res, next);
  assert.equal(statusCode, 403);
  assert.equal(responseBody.error, 'Forbidden');
  assert.equal(responseBody.user_role, 'facility');
});

