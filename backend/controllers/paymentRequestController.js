const PaymentRequest = require('../models/PaymentRequest');
const Attachment     = require('../models/Attachment');
const { createAuditLog }   = require('../middleware/auditLogger');
const { sendNotification } = require('../utils/helpers');
const User = require('../models/User');

const POPULATE_PR = [
  { path: 'createdBy',  select: 'firstName lastName email role' },
  { path: 'department', select: 'name code costCenter' },
  { path: 'payment' },
  { path: 'attachments' },
];

// @desc    Create payment request (item-based)
// @route   POST /api/payment-requests
// @access  Employee
const createPaymentRequest = async (req, res, next) => {
  try {
    const { title, items, currency, costCenter, dueDate, notes } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Request title is required' });
    }
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one item is required' });
    }

    // Calculate totals
    const processedItems = items.map((item) => ({
      itemName:    item.itemName,
      description: item.description || '',
      quantity:    Number(item.quantity)  || 1,
      unit:        item.unit        || 'pcs',
      unitPrice:   Number(item.unitPrice) || 0,
      totalPrice:  Number((Number(item.quantity) * Number(item.unitPrice)).toFixed(2)),
    }));

    const totalAmount = parseFloat(
      processedItems.reduce((sum, i) => sum + i.totalPrice, 0).toFixed(2)
    );

    const pr = await PaymentRequest.create({
      createdBy:   req.user._id,
      department:  req.user.department,
      title,
      items:       processedItems,
      totalAmount,
      currency:    currency || 'USD',
      costCenter:  costCenter || '',
      dueDate:     dueDate || null,
      notes:       notes || '',
      currentStep: 'draft',
      previousStep: '',
    });

    await createAuditLog({
      user: req.user._id,
      action: 'CREATE_PR',
      module: 'PaymentRequest',
      resourceId: pr._id,
      description: `Created payment request ${pr.requestNumber}: "${pr.title}"`,
      req,
    });

    const populated = await PaymentRequest.findById(pr._id).populate(POPULATE_PR);
    res.status(201).json({ success: true, message: 'Payment request created', data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get all payment requests (role-filtered)
// @route   GET /api/payment-requests
// @access  Private
const getPaymentRequests = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 10, department, startDate, endDate } = req.query;
    const { role, _id: userId, department: userDept } = req.user;
    const filter = {};

    // Role-based scope
    if (role === 'employee')        filter.createdBy  = userId;
    if (role === 'department_head') filter.department = userDept;

    // Multi-step roles
    const multiStepRoles = {
      junior_accountant: ['pending_junior_accountant', 'pending_filing'],
      senior_accountant: ['pending_senior_accountant', 'pending_treasury'],
    };
    const singleStepMap = {
      budget_control:  'pending_budget_control',
      finance_manager: 'pending_finance_manager',
    };

    if (multiStepRoles[role]) {
      filter.currentStep = { $in: multiStepRoles[role] };
    } else if (singleStepMap[role]) {
      filter.currentStep = singleStepMap[role];
    }

    // Explicit status override
    if (status) filter.currentStep = status;
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { requestNumber: { $regex: search, $options: 'i' } },
        { title:         { $regex: search, $options: 'i' } },
        { 'vendor.vendorName': { $regex: search, $options: 'i' } },
      ];
    }
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await PaymentRequest.countDocuments(filter);
    const data  = await PaymentRequest.find(filter)
      .populate(POPULATE_PR)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true, data,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single payment request
// @route   GET /api/payment-requests/:id
const getPaymentRequest = async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id).populate(POPULATE_PR);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });
    res.json({ success: true, data: pr });
  } catch (err) {
    next(err);
  }
};

// @desc    Update payment request (draft / returned only)
// @route   PUT /api/payment-requests/:id
const updatePaymentRequest = async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });

    if (!['draft', 'returned'].includes(pr.currentStep) && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Only draft or returned requests can be edited' });
    }

    const { title, items, currency, costCenter, dueDate, notes } = req.body;

    if (title)      pr.title      = title;
    if (currency)   pr.currency   = currency;
    if (costCenter !== undefined) pr.costCenter = costCenter;
    if (dueDate   !== undefined)  pr.dueDate    = dueDate || null;
    if (notes     !== undefined)  pr.notes      = notes;

    if (items && Array.isArray(items) && items.length > 0) {
      pr.items = items.map((item) => ({
        itemName:    item.itemName,
        description: item.description || '',
        quantity:    Number(item.quantity)  || 1,
        unit:        item.unit        || 'pcs',
        unitPrice:   Number(item.unitPrice) || 0,
        totalPrice:  Number((Number(item.quantity) * Number(item.unitPrice)).toFixed(2)),
      }));
      pr.totalAmount = parseFloat(pr.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2));
    }

    await pr.save();

    await createAuditLog({
      user: req.user._id, action: 'UPDATE_PR', module: 'PaymentRequest',
      resourceId: pr._id, description: `Updated payment request ${pr.requestNumber}`, req,
    });

    const populated = await PaymentRequest.findById(pr._id).populate(POPULATE_PR);
    res.json({ success: true, message: 'Payment request updated', data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Submit request (draft → pending_dept_head)
// @route   PUT /api/payment-requests/:id/submit
const submitPaymentRequest = async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });

    if (!['draft', 'returned'].includes(pr.currentStep)) {
      return res.status(400).json({ success: false, message: 'Only draft or returned requests can be submitted' });
    }
    if (pr.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to submit this request' });
    }
    if (!pr.items || pr.items.length === 0) {
      return res.status(400).json({ success: false, message: 'Request must have at least one item before submitting' });
    }

    pr.previousStep = pr.currentStep;
    pr.currentStep  = 'pending_dept_head';
    pr.submittedAt  = new Date();
    pr.returnReason = '';
    await pr.save();

    // Notify department heads
    const deptHeads = await User.find({ role: 'department_head', isActive: true });
    for (const dh of deptHeads) {
      await sendNotification({
        recipient: dh._id, sender: req.user._id,
        title: 'New Purchase Request',
        message: `"${pr.title}" (${pr.requestNumber}) requires your approval`,
        type: 'payment_request', paymentRequest: pr._id, link: `/payment-requests/${pr._id}`,
      });
    }

    await createAuditLog({
      user: req.user._id, action: 'SUBMIT_PR', module: 'PaymentRequest',
      resourceId: pr._id, description: `Submitted request ${pr.requestNumber}`, req,
    });

    const populated = await PaymentRequest.findById(pr._id).populate(POPULATE_PR);
    res.json({ success: true, message: 'Request submitted for Department Head approval', data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete payment request (draft only)
// @route   DELETE /api/payment-requests/:id
const deletePaymentRequest = async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });

    if (pr.currentStep !== 'draft' && req.user.role !== 'admin') {
      return res.status(400).json({ success: false, message: 'Only draft requests can be deleted' });
    }

    await Attachment.deleteMany({ paymentRequest: pr._id });
    await PaymentRequest.deleteOne({ _id: pr._id });

    await createAuditLog({
      user: req.user._id, action: 'DELETE_PR', module: 'PaymentRequest',
      resourceId: pr._id, description: `Deleted request ${pr.requestNumber}`, severity: 'warning', req,
    });

    res.json({ success: true, message: 'Payment request deleted' });
  } catch (err) {
    next(err);
  }
};

// @desc    Upload attachments
// @route   POST /api/payment-requests/:id/attachments
const uploadAttachments = async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'No files uploaded' });
    }

    const attachments = await Promise.all(
      req.files.map((file) =>
        Attachment.create({
          paymentRequest: pr._id,
          uploadedBy:     req.user._id,
          fileName:       file.filename,
          originalName:   file.originalname,
          mimeType:       file.mimetype,
          size:           file.size,
          path:           file.path,
          documentType:   req.body.documentType || 'supporting',
        })
      )
    );

    pr.attachments.push(...attachments.map((a) => a._id));
    await pr.save({ validateBeforeSave: false });

    res.status(201).json({ success: true, message: `${attachments.length} file(s) uploaded`, data: attachments });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPaymentRequest,
  getPaymentRequests,
  getPaymentRequest,
  updatePaymentRequest,
  submitPaymentRequest,
  deletePaymentRequest,
  uploadAttachments,
};
