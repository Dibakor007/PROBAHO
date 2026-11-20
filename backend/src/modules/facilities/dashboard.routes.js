import express from 'express';
import { db } from '../../services/db.js';
import { aiClient } from '../../services/aiClient.js';
import { calculateSupplierRisk } from '../../services/supplierRiskService.js';

const router = express.Router();

router.get('/summary', async (req, res) => {
  try {
    const [inv, auditRes] = await Promise.all([
      aiClient.getInventory().catch(() => ({ inventory_status: [], expiry_alerts: [] })),
      aiClient.getAuditLogs().catch(() => ({ events: [] }))
    ]);

    const statusList = inv.inventory_status || [];
    const alerts = inv.expiry_alerts || [];
    const inStock = statusList.filter(s => (s.days_of_cover ?? 0) >= 7).length;
    const total = statusList.length || 30;

    res.json({
      data_label: 'Synthetic data',
      total_facilities: db.getFacilities().length,
      total_medicines: db.getMedicines().length,
      national_availability_rate: Math.round((inStock / total) * 100),
      critical_alerts_count: alerts.length || 3,
      pending_approvals_count: 2,
      active_shipments_count: 3
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate summary', details: err.message });
  }
});

export default router;

