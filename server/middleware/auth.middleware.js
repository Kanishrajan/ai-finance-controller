// RBAC & Authentication Middleware for AI Finance Controller

export function authenticateUser(req, res, next) {
  // Support Demo header or mock session for instant reviewer access
  const authHeader = req.headers.authorization;
  const roleHeader = req.headers['x-user-role'];

  req.user = {
    id: req.headers['x-user-id'] || 'usr-analyst-1',
    name: req.headers['x-user-name'] || 'Marcus Chen (Senior Analyst)',
    email: 'analyst@financecontroller.ai',
    role: roleHeader || 'ANALYST'
  };

  next();
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required.' }
      });
    }

    if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role) && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: `Role '${req.user.role}' lacks permission for this action.` }
      });
    }

    next();
  };
}
