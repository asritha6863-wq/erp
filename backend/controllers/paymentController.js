const Payment        = require('../models/Payment');
const PaymentRequest = require('../models/PaymentRequest');
const Approval       = require('../models/Approval');
const User           = require('../models/User');
const { createAuditLog }   = require('../middleware/auditLogger');
const { sendNotification } = require('../utils/helpers');

// @desc    Process payment — Step 7 (Senior Accountant acting as Treasury)
// @route   POST /api/payments
// @access  senior_accountant, admin
const processPayment = async (req, res, next) => {
  try {
    const {
      paymentRequestId, paymentMethod, bankName,
      accountNumber, transactionRef, paymentDate, notes,
    } = req.body;

    const pr = await PaymentRequest.findById(paymentRequestId);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });

    if (pr.currentStep !== 'pending_treasury') {
      return res.status(400).json({ success: false, message: 'Payment request is not at the treasury step' });
    }

    const payment = await Payment.create({
      paymentRequest: pr._id,
      processedBy:    req.user._id,
      paymentMethod,
      bankName:       bankName       || '',
      accountNumber:  accountNumber  || '',
      transactionRef: transactionRef || '',
      paymentDate:    new Date(paymentDate),
      amount:         pr.amount,
      currency:       pr.currency,
      status:         'paid',
      confirmedAt:    new Date(),
      notes:          notes || '',
    });

    // Advance to filing step (handled by Junior Accountant)
    pr.payment      = payment._id;
    pr.isPaid       = true;
    pr.previousStep = pr.currentStep;
    pr.currentStep  = 'pending_filing';
    await pr.save();

    // Record in approvals trail
    await Approval.create({
      paymentRequest: pr._id,
      approver:  req.user._id,
      action:    'approved',
      comments:  notes || 'Payment processed',
      fromStep:  'pending_treasury',
      toStep:    'pending_filing',
      stepData:  { paymentAdviceNo: payment.paymentAdviceNo },
    });

    // Notify Junior Accountants (Filing)
    const filers = await User.find({ role: 'junior_accountant', isActive: true });
    for (const f of filers) {
      await sendNotification({
        recipient: f._id, sender: req.user._id,
        title: 'Payment Processed — Archive Required',
        message: `Payment for ${pr.requestNumber} has been processed. Please archive all documents.`,
        type: 'payment', paymentRequest: pr._id, link: `/payment-requests/${pr._id}`,
      });
    }

    // Notify requester
    await sendNotification({
      recipient: pr.createdBy, sender: req.user._id,
      title: 'Payment Processed',
      message: `Your payment request ${pr.requestNumber} has been paid. Advice #: ${payment.paymentAdviceNo}`,
      type: 'payment', paymentRequest: pr._id, link: `/payment-requests/${pr._id}`,
    });

    await createAuditLog({
      user: req.user._id,
      action: 'PROCESS_PAYMENT',
      module: 'Payment',
      resourceId: payment._id,
      description: `Sr. Accountant (Treasury) processed payment for ${pr.requestNumber}. Advice: ${payment.paymentAdviceNo}`,
      req,
    });

    res.status(201).json({ success: true, message: 'Payment processed successfully', data: payment });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all payments
// @route   GET /api/payments
// @access  Admin, Senior Accountant, Finance Manager
const getPayments = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 10, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (startDate || endDate) {
      filter.paymentDate = {};
      if (startDate) filter.paymentDate.$gte = new Date(startDate);
      if (endDate)   filter.paymentDate.$lte = new Date(endDate);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Payment.countDocuments(filter);
    const data  = await Payment.find(filter)
      .populate({ path: 'paymentRequest', select: 'requestNumber vendorName amount currency' })
      .populate('processedBy', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true, data,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({
        path: 'paymentRequest',
        populate: { path: 'createdBy department', select: 'firstName lastName email name code' },
      })
      .populate('processedBy', 'firstName lastName email');
    if (!payment) return res.status(404).json({ success: false, message: 'Payment not found' });
    res.json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
};

module.exports = { processPayment, getPayments, getPayment };
