const AuditLog = require('../models/AuditLog');

/**
 * Creates an audit log entry.
 * Can be used as express middleware (factory) or called directly as a utility.
 */
const createAuditLog = async ({ user, action, module, resourceId, description, oldValue, newValue, severity = 'info', req = null }) => {
  try {
    await AuditLog.create({
      user:        user || null,
      action,
      module,
      resourceId:  resourceId || null,
      description,
      oldValue:    oldValue || null,
      newValue:    newValue || null,
      severity,
      ipAddress:   req ? (req.ip || req.connection?.remoteAddress || '') : '',
      userAgent:   req ? (req.headers?.['user-agent'] || '') : '',
    });
  } catch (err) {
    // Never block the main flow for audit logging failures
    console.error('Audit log error:', err.message);
  }
};

module.exports = { createAuditLog };
