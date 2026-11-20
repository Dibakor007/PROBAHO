import express from 'express';

import authRoutes from '../routes/auth.routes.js';
import dashboardRoutes from '../modules/facilities/dashboard.routes.js';
import facilitiesRoutes from '../modules/facilities/facilities.routes.js';
import medicinesRoutes from '../modules/medicines/medicines.routes.js';
import inventoryRoutes from '../routes/inventory.routes.js';
import suppliersRoutes from '../modules/suppliers/suppliers.routes.js';
import shipmentsRoutes from '../modules/shipments/shipments.routes.js';
import scenariosRoutes from '../routes/scenarios.routes.js';
import recommendationsRoutes from '../routes/recommendations.routes.js';
import auditRoutes from '../routes/audit.routes.js';
import copilotRoutes from '../routes/copilot.routes.js';
import usersRoutes from '../modules/users/users.routes.js';
import externalRoutes from './external.routes.js';
import supplierRiskRoutes from './supplierRisk.routes.js';

const router = express.Router();

// Exact Node.js route mapping matching the specification:
// POST /api/auth/login                  User login
// GET  /api/dashboard/summary          Dashboard KPIs
// GET  /api/facilities                 Facility list
// GET  /api/medicines                  Medicine catalogue
// GET  /api/inventory                  Inventory by facility
// POST /api/inventory                  Add stock record
// GET  /api/suppliers                  Supplier information
// GET  /api/shipments                  Active Pharmaceutical Ingredient shipment status
// POST /api/scenarios                  Create disruption scenario
// GET  /api/recommendations            List recommendations
// POST /api/recommendations/:id/approve Approve recommendation
// POST /api/recommendations/:id/reject  Reject recommendation
// GET  /api/audit-logs                 View audit history
// POST /api/copilot/chat               Ask the AI copilot

router.use('/auth', authRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/facilities', facilitiesRoutes);
router.use('/medicines', medicinesRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/suppliers', suppliersRoutes);
router.use('/shipments', shipmentsRoutes);
router.use('/scenarios', scenariosRoutes);
router.use('/recommendations', recommendationsRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/audit', auditRoutes);
router.use('/copilot', copilotRoutes);
router.use('/users', usersRoutes);
router.use('/external', externalRoutes);
router.use('/supplier-risk', supplierRiskRoutes);

export default router;

