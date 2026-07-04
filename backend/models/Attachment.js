const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    paymentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', required: true },
    uploadedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    fileName:       { type: String, required: true },
    originalName:   { type: String, required: true },
    mimeType:       { type: String, required: true },
    size:           { type: Number, required: true },
    path:           { type: String, required: true },
    documentType:   {
      type: String,
      enum: ['invoice', 'purchase_order', 'grn', 'supporting', 'payment_advice', 'other'],
      default: 'supporting',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attachment', attachmentSchema);
