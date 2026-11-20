import express from 'express';
import { db } from '../../services/db.js';
import { authenticate } from '../../middleware/auth.js';
import { requireRole } from '../../middleware/rbac.js';

const router = express.Router();

// GET /api/users - List users (Admin only)
router.get('/', authenticate, requireRole('admin'), (req, res) => {
  const sanitizedUsers = db.store.users.map(({ password_hash, ...rest }) => rest);
  res.json({
    data_label: 'Synthetic data',
    users: sanitizedUsers
  });
});

export default router;

