const mongoose = require('mongoose');

const WORKFLOW_STEPS = [
  'draft',
  'pending_dept_head',
  'pending_junior_accountant',   // Jr. Accountant creates PO + vendor + quotation
  'pending_senior_accountant',   // Sr. Accountant GL coding + VAT
  'pending_budget_control',      // Budget Control availability
  'pending_finance_manager',     // Finance Manager final approval
  'pending_treasury',            // Sr. Accountant processes payment
  'pending_filing',              // Jr. Accountant archives
  'completed',
  'rejected',
  'returned',
];

const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'];

// ── Item line schema ───────────────────────────────────────────────────────────
const itemSchema = new mongoose.Schema({
  itemName:    { type: String, required: true, trim: true },
  description: { type: String, trim: true, default: '' },
  quantity:    { type: Number, required: true, min: 1 },
  unit:        { type: String, trim: true, default: 'pcs' },
  unitPrice:   { type: Number, required: true, min: 0 },
  totalPrice:  { type: Number, required: true, min: 0 },
}, { _id: false });

// ── Quotation line schema ──────────────────────────────────────────────────────
const quotationItemSchema = new mongoose.Schema({
  itemName:   { type: String, trim: true },
  quantity:   { type: Number },
  unitPrice:  { type: Number },
  totalPrice: { type: Number },
}, { _id: false });

const paymentRequestSchema = new mongoose.Schema(
  {
    requestNumber: { type: String, unique: true },

    // ── Requester ────────────────────────────────────────────────────────────
    createdBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },

    // ── Item-based request (filled by Employee) ──────────────────────────────
    title:       { type: String, required: true, trim: true },   // Request title/purpose
    items:       { type: [itemSchema], default: [] },             // Line items
    totalAmount: { type: Number, required: true, min: 0 },
    currency:    { type: String, enum: CURRENCIES, default: 'USD' },
    costCenter:  { type: String, trim: true, default: '' },
    dueDate:     { type: Date, default: null },
    notes:       { type: String, trim: true, default: '' },       // General notes

    // ── Purchase Order (created by Jr. Accountant — Step 3) ──────────────────
    purchaseOrder: {
      poNumber:      { type: String, default: '' },
      poDate:        { type: Date, default: null },
      deliveryDate:  { type: Date, default: null },
      paymentTerms:  { type: String, default: '' },
      deliveryTerms: { type: String, default: '' },
      notes:         { type: String, default: '' },
      createdAt:     { type: Date, default: null },
    },

    // ── Vendor Details (entered by Jr. Accountant — Step 3) ──────────────────
    vendor: {
      vendorName:    { type: String, default: '' },
      vendorCode:    { type: String, default: '' },
      contactPerson: { type: String, default: '' },
      email:         { type: String, default: '' },
      phone:         { type: String, default: '' },
      address:       { type: String, default: '' },
      bankName:      { type: String, default: '' },
      bankAccount:   { type: String, default: '' },
      taxNumber:     { type: String, default: '' },
    },

    // ── Quotation (created by Jr. Accountant — Step 3) ───────────────────────
    quotation: {
      quotationNumber: { type: String, default: '' },
      quotationDate:   { type: Date, default: null },
      validUntil:      { type: Date, default: null },
      items:           { type: [quotationItemSchema], default: [] },
      subtotal:        { type: Number, default: 0 },
      taxRate:         { type: Number, default: 0 },
      taxAmount:       { type: Number, default: 0 },
      grandTotal:      { type: Number, default: 0 },
      terms:           { type: String, default: '' },
      createdAt:       { type: Date, default: null },
    },

    // ── GRN (Goods Receipt Note — filled after delivery) ─────────────────────
    grnNumber: { type: String, default: '' },

    // ── AP Voucher (Sr. Accountant — Step 4) ─────────────────────────────────
    apVoucher: {
      voucherNumber: { type: String, default: '' },
      threeWayMatch: { type: Boolean, default: null },
      matchNotes:    { type: String, default: '' },
      createdAt:     { type: Date, default: null },
    },

    // ── GL Coding (Sr. Accountant — Step 4) ──────────────────────────────────
    glCoding: {
      glAccount:    { type: String, default: '' },
      vatCompliant: { type: Boolean, default: null },
      isDuplicate:  { type: Boolean, default: false },
      notes:        { type: String, default: '' },
    },

    // ── Budget Control (Step 5) ───────────────────────────────────────────────
    budgetCheck: {
      budgetAvailable: { type: Boolean, default: null },
      budgetCode:      { type: String, default: '' },
      notes:           { type: String, default: '' },
    },

    // ── Finance Manager (Step 6) ──────────────────────────────────────────────
    financeReview: {
      cashFlowOk: { type: Boolean, default: null },
      policyOk:   { type: Boolean, default: null },
      heldReason: { type: String, default: '' },
    },

    // ── Payment (Sr. Accountant Treasury — Step 7) ────────────────────────────
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null },

    // ── Workflow state ────────────────────────────────────────────────────────
    currentStep:     { type: String, enum: WORKFLOW_STEPS, default: 'draft' },
    previousStep:    { type: String, default: '' },
    isPaid:          { type: Boolean, default: false },
    isArchived:      { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' },
    returnReason:    { type: String, default: '' },

    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Attachment' }],

    submittedAt:  { type: Date, default: null },
    completedAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-generate request number
paymentRequestSchema.pre('save', async function (next) {
  if (!this.requestNumber) {
    const count = await mongoose.model('PaymentRequest').countDocuments();
    const year  = new Date().getFullYear();
    this.requestNumber = `PR-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('PaymentRequest', paymentRequestSchema);
module.exports.WORKFLOW_STEPS = WORKFLOW_STEPS;
