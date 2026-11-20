import express from 'express';
import { db } from '../../services/db.js';

const router = express.Router();

// GET /api/medicines - List medicine catalogue
router.get('/', (req, res) => {
  res.json({
    data_label: 'Synthetic data',
    medicines: db.getMedicines()
  });
});

export default router;

