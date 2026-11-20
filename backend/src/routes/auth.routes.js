import express from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { config } from '../config/env.js';
import { db } from '../services/db.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post('/login', async (req, res) => {
  const result = LoginSchema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ error: 'Validation failed', details: result.error.errors });
  }

  const { email, password } = result.data;
  const user = db.findUserByEmail(email);

  // In demo mode with seeded users, allow password 'password123' for any seed user
  if (!user || password !== 'password123') {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    config.jwtSecret,
    { expiresIn: '8h' }
  );

  res.json({
    message: 'Authentication successful',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facility_id: user.facility_id
    }
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

export default router;

