function roleGuard(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: Access requires one of following roles: ${roles.join(', ')}. Current role is '${req.user.role}'`
      });
    }

    next();
  };
}

module.exports = roleGuard;
