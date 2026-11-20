import express from 'express';
import { db } from '../../services/db.js';

const router = express.Router();

// GET /api/facilities - List all facilities
router.get('/', (req, res) => {
  res.json({
    data_label: 'Synthetic data',
    facilities: db.getFacilities()
  });
});

export default router;

