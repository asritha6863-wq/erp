const AuditLog = require('../models/AuditLog');

// @desc    Get all audit logs
// @route   GET /api/audit-logs
// @access  Admin
const getAuditLogs = async (req, res, next) => {
  try {
    const { user, action, module, severity, search, page = 1, limit = 20, startDate, endDate } = req.query;
    const filter = {};

    if (user)     filter.user   = user;
    if (action)   filter.action = { $regex: action, $options: 'i' };
    if (module)   filter.module = module;
    if (severity) filter.severity = severity;
    if (search)   filter.description = { $regex: search, $options: 'i' };
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await AuditLog.countDocuments(filter);
    const data  = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAuditLogs };
