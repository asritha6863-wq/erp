const mongoose = require('mongoose');

const PAYMENT_METHODS = ['bank_transfer', 'cheque', 'cash', 'online', 'card'];
const PAYMENT_STATUSES = ['pending', 'processing', 'paid', 'failed', 'cancelled'];

const paymentSchema = new mongoose.Schema(
  {
    paymentRequest: { type: mongoose.Schema.Types.ObjectId, ref: 'PaymentRequest', required: true },
    processedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    paymentMethod:      { type: String, enum: PAYMENT_METHODS, required: true },
    bankName:           { type: String, trim: true, default: '' },
    accountNumber:      { type: String, trim: true, default: '' },
    transactionRef:     { type: String, trim: true, default: '' },
    paymentDate:        { type: Date, required: true },
    amount:             { type: Number, required: true },
    currency:           { type: String, default: 'USD' },

    status:             { type: String, enum: PAYMENT_STATUSES, default: 'pending' },
    paymentAdviceNo:    { type: String, unique: true, sparse: true },
    paymentAdvicePath:  { type: String, default: '' },

    notes:              { type: String, default: '' },
    confirmedAt:        { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate payment advice number
paymentSchema.pre('save', async function (next) {
  if (!this.paymentAdviceNo) {
    const count = await mongoose.model('Payment').countDocuments();
    const year = new Date().getFullYear();
    this.paymentAdviceNo = `PA-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Payment', paymentSchema);
