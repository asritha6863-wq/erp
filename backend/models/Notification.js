const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sender:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    title:          { type: String, required: true },
    message:        { type: String, required: true },
    type:           {
      type: String,
      enum: ['payment_request', 'approval', 'rejection', 'return', 'payment', 'system', 'info'],
      default: 'info',
    },
    paymentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', default: null },
    isRead:         { type: Boolean, default: false },
    readAt:         { type: Date, default: null },
    link:           { type: String, default: '' },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
