import express from 'express';
import { auditChainInstance } from '../services/auditChain.js';

const router = express.Router();

// GET /api/audit-logs - View immutable audit trail
router.get('/', (req, res) => {
  res.json({
    data_label: 'Synthetic audit log',
    logs: auditChainInstance.getLogs()
  });
});

// GET /api/audit/verify - Verify SHA-256 hash chain integrity
router.get('/verify', (req, res) => {
  const result = auditChainInstance.verify();
  res.json({
    status: result.valid ? 'VERIFIED' : 'TAMPER_DETECTED',
    verification: result
  });
});

export default router;

