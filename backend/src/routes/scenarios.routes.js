import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { aiClient } from '../services/aiClient.js';
import { auditChainInstance } from '../services/auditChain.js';

const router = express.Router();

// POST /api/scenarios - Run disruption simulation
// Allowed: analyst, admin, approver
router.post('/', authenticate, requireRole('analyst', 'admin', 'approver'), async (req, res) => {
  try {
    const {
      shipment_delay_days = 0,
      supplier_shortfall_pct = 0,
      freight_cost_increase_pct = 0,
      manufacturing_capacity_cut_pct = 0,
      medicine_id = 'med-001'
    } = req.body;

    const simResult = await aiClient.runSimulation({
      shipment_delay_days,
      supplier_shortfall_pct,
      freight_cost_increase_pct,
      manufacturing_capacity_cut_pct,
      medicine_id
    });

    auditChainInstance.append(
      'SCENARIO_SIMULATION_RUN',
      req.user.name,
      req.user.role,
      {
        shipment_delay_days,
        supplier_shortfall_pct,
        medicine_id
      }
    );

    res.json({
      data_label: 'Synthetic data / Simulated',
      assumptions: 'Active Pharmaceutical Ingredient arrivals delayed; production constrained by ingredient stock and capacity; warehouse dispatches by ascending days of cover.',
      simulation: simResult
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to run scenario simulation', details: err.message });
  }
});

export default router;

