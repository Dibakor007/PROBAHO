import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { aiClient } from '../services/aiClient.js';
import { auditChainInstance } from '../services/auditChain.js';

const router = express.Router();

// GET /api/recommendations - Fetch optimization transfer proposals
router.get('/', authenticate, async (req, res) => {
  try {
    const data = await aiClient.runOptimizer({ medicine_id: req.query.medicine_id || 'med-001' });
    res.json({
      data_label: 'Synthetic data / Simulated',
      optimization: data
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch redistribution proposals', details: err.message });
  }
});

// POST /api/recommendations/:id/approve - Approve transfer recommendation (Requires approver or admin role)
router.post('/:id/approve', authenticate, requireRole('approver', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason, recommendation_details } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason is required for approval' });
    }

    const auditRecord = auditChainInstance.append(
      'RECOMMENDATION_APPROVED',
      req.user.name,
      req.user.role,
      {
        recommendation_id: id,
        decision: 'approved',
        reason: reason.trim(),
        details: recommendation_details || {}
      }
    );

    res.json({
      message: `Recommendation ${id} approved successfully`,
      status: 'approved',
      audit_event: auditRecord
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record approval', details: err.message });
  }
});

// POST /api/recommendations/:id/reject - Reject transfer recommendation (Requires approver or admin role)
router.post('/:id/reject', authenticate, requireRole('approver', 'admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Reason is required for rejection' });
    }

    const auditRecord = auditChainInstance.append(
      'RECOMMENDATION_REJECTED',
      req.user.name,
      req.user.role,
      {
        recommendation_id: id,
        decision: 'rejected',
        reason: reason.trim()
      }
    );

    res.json({
      message: `Recommendation ${id} rejected`,
      status: 'rejected',
      audit_event: auditRecord
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record rejection', details: err.message });
  }
});

export default router;

