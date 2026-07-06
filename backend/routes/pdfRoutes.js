const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const PaymentRequest = require('../models/PaymentRequest');
const Payment        = require('../models/Payment');
const { generatePOPdf, generateQuotationPdf, generatePaymentAdvicePdf } = require('../utils/pdfService');

router.use(protect);

const populatePR = [
  { path: 'createdBy',  select: 'firstName lastName email' },
  { path: 'department', select: 'name code costCenter' },
  { path: 'payment' },
];

// GET /api/pdf/po/:id
router.get('/po/:id', async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id).populate(populatePR);
    if (!pr) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!pr.purchaseOrder?.poNumber) return res.status(400).json({ success: false, message: 'PO not yet created' });
    const buffer = await generatePOPdf(pr);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="PO-${pr.purchaseOrder.poNumber}.pdf"` });
    res.send(buffer);
  } catch (err) { next(err); }
});

// GET /api/pdf/quotation/:id
router.get('/quotation/:id', async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id).populate(populatePR);
    if (!pr) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!pr.quotation?.quotationNumber) return res.status(400).json({ success: false, message: 'Quotation not yet created' });
    const buffer = await generateQuotationPdf(pr);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="QT-${pr.quotation.quotationNumber}.pdf"` });
    res.send(buffer);
  } catch (err) { next(err); }
});

// GET /api/pdf/payment-advice/:id
router.get('/payment-advice/:id', async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id).populate(populatePR);
    if (!pr) return res.status(404).json({ success: false, message: 'Request not found' });
    if (!pr.payment) return res.status(400).json({ success: false, message: 'Payment not yet processed' });
    const payment = await Payment.findById(pr.payment);
    const buffer  = await generatePaymentAdvicePdf(pr, payment);
    res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="PA-${payment?.paymentAdviceNo || pr.requestNumber}.pdf"` });
    res.send(buffer);
  } catch (err) { next(err); }
});

module.exports = router;
