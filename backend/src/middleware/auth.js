import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../services/db.js';

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Missing or malformed Authorization header with Bearer token'
    });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.findUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or deactivated' });
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      facility_id: user.facility_id
    };
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired authentication token', details: err.message });
  }
}

/**
 * Optional authentication middleware
 * Attaches req.user if a valid token is present; otherwise leaves req.user = null without failing.
 */
export function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    const user = db.findUserById(decoded.id);
    if (user) {
      req.user = {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        facility_id: user.facility_id
      };
    } else {
      req.user = null;
    }
  } catch {
    req.user = null;
  }
  next();
}

