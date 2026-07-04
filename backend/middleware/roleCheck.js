// Authorize specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required: ${roles.join(', ')}. Your role: ${req.user.role}`,
      });
    }
    next();
  };
};

const adminOnly = authorize('admin');

module.exports = { authorize, adminOnly };
