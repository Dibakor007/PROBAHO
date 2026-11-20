/**
 * Role-Based Access Control (RBAC) Middleware
 * Enforces role restrictions server-side.
 * Allowed roles: 'admin', 'approver', 'facility', 'analyst'
 * Returns 403 Forbidden on violation.
 */

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthenticated' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Action requires one of the following roles: [${allowedRoles.join(', ')}]. Current role: '${req.user.role}'`,
        required_roles: allowedRoles,
        user_role: req.user.role
      });
    }

    next();
  };
}

