const mongoose = require('mongoose');

const APPROVAL_ACTIONS = ['approved', 'rejected', 'returned', 'held', 'forwarded'];

const approvalSchema = new mongoose.Schema(
  {
    paymentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', required: true },
    approver:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    action:         { type: String, enum: APPROVAL_ACTIONS, required: true },
    comments:       { type: String, trim: true, default: '' },
    fromStep:       { type: String, required: true },
    toStep:         { type: String, required: true },
    actionDate:     { type: Date, default: Date.now },

    // Step-specific data
    stepData: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Approval', approvalSchema);
