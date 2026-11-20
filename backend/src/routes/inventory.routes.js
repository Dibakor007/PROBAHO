import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { requireRole } from '../middleware/rbac.js';
import { validateStockCSV } from '../services/csvValidator.js';
import { aiClient } from '../services/aiClient.js';
import { auditChainInstance } from '../services/auditChain.js';
import { getFallbackInventory } from '../services/fallbackInventory.js';

const router = express.Router();

// GET /api/inventory - View days of cover & batches
router.get('/', async (req, res) => {
  try {
    const data = await aiClient.getInventory();
    res.json({
      data_label: 'Synthetic data',
      inventory: data
    });
  } catch (err) {
    // Graceful fallback to synthetic inventory dataset
    res.json({
      data_label: 'Synthetic data (Fallback mode)',
      inventory: getFallbackInventory()
    });
  }
});

// POST /api/inventory - Record stock adjustment (requires facility or admin role)
router.post('/', authenticate, requireRole('facility', 'admin'), async (req, res) => {
  try {
    const { facility_id, medicine_id, batch_number, quantity, reason } = req.body;
    
    // Append to audit chain
    const auditRecord = auditChainInstance.append(
      'STOCK_RECORD_UPDATE',
      req.user.name,
      req.user.role,
      {
        facility_id,
        medicine_id,
        batch_number,
        quantity,
        reason: reason || 'Facility regular stock count update'
      }
    );

    res.json({
      message: 'Stock record recorded successfully',
      audit_event: auditRecord
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record stock update', details: err.message });
  }
});

// POST /api/inventory/upload-csv - CSV import with duplicate & invalid-record report
router.post('/upload-csv', authenticate, requireRole('facility', 'admin', 'analyst'), async (req, res) => {
  try {
    const { records } = req.body;
    if (!Array.isArray(records)) {
      return res.status(400).json({ error: 'Expected records to be an array of stock row objects' });
    }

    const report = validateStockCSV(records);

    // Audit log the import attempt
    auditChainInstance.append(
      'CSV_STOCK_IMPORT',
      req.user.name,
      req.user.role,
      {
        total_rows: report.summary.total_rows,
        valid_count: report.summary.valid_count,
        invalid_count: report.summary.invalid_count,
        duplicate_count: report.summary.duplicate_count
      }
    );

    res.json({
      data_label: 'Synthetic data validation',
      validation_report: report
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to process CSV records', details: err.message });
  }
});

export default router;

