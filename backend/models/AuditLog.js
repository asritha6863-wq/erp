const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    action:     { type: String, required: true },  // e.g. 'CREATE_PAYMENT_REQUEST'
    module:     { type: String, required: true },  // e.g. 'PaymentRequest', 'User'
    resourceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    description:{ type: String, required: true },
    ipAddress:  { type: String, default: '' },
    userAgent:  { type: String, default: '' },
    oldValue:   { type: mongoose.Schema.Types.Mixed, default: null },
    newValue:   { type: mongoose.Schema.Types.Mixed, default: null },
    severity:   { type: String, enum: ['info', 'warning', 'error', 'critical'], default: 'info' },
  },
  { timestamps: true }
);

// Index for fast querying
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ module: 1, resourceId: 1 });
auditLogSchema.index({ action: 1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
