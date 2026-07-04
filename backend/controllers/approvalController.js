const PaymentRequest = require('../models/PaymentRequest');
const Approval       = require('../models/Approval');
const User           = require('../models/User');
const { createAuditLog }   = require('../middleware/auditLogger');
const { sendNotification, getNextStep } = require('../utils/helpers');

// Which steps each role can act on
const ROLE_STEP_MAP = {
  department_head:   ['pending_dept_head'],
  junior_accountant: ['pending_junior_accountant', 'pending_filing'],
  senior_accountant: ['pending_senior_accountant', 'pending_treasury'],
  budget_control:    ['pending_budget_control'],
  finance_manager:   ['pending_finance_manager'],
};

// Who to notify at each next step
const NEXT_ROLE_MAP = {
  pending_dept_head:           'department_head',
  pending_junior_accountant:   'junior_accountant',
  pending_senior_accountant:   'senior_accountant',
  pending_budget_control:      'budget_control',
  pending_finance_manager:     'finance_manager',
  pending_treasury:            'senior_accountant',
  pending_filing:              'junior_accountant',
};

const notifyNextStep = async (nextStep, pr, senderId) => {
  const roleToNotify = NEXT_ROLE_MAP[nextStep];
  if (!roleToNotify) return;
  const users = await User.find({ role: roleToNotify, isActive: true });
  for (const u of users) {
    await sendNotification({
      recipient: u._id,
      sender: senderId,
      title: 'Payment Request Pending Action',
      message: `Payment request ${pr.requestNumber} is awaiting your review`,
      type: 'payment_request',
      paymentRequest: pr._id,
      link: `/payment-requests/${pr._id}`,
    });
  }
};

// Auto-generate PO number
const generatePONumber = async () => {
  const count = await PaymentRequest.countDocuments({ 'purchaseOrder.poNumber': { $ne: '' } });
  const year  = new Date().getFullYear();
  return `PO-${year}-${String(count + 1).padStart(5, '0')}`;
};

// Auto-generate Quotation number
const generateQuotationNumber = async () => {
  const count = await PaymentRequest.countDocuments({ 'quotation.quotationNumber': { $ne: '' } });
  const year  = new Date().getFullYear();
  return `QT-${year}-${String(count + 1).padStart(5, '0')}`;
};

// @desc    Process approval action
// @route   POST /api/approvals
const processApproval = async (req, res, next) => {
  try {
    const { paymentRequestId, action, comments, stepData } = req.body;
    const { role, _id: approverId } = req.user;

    const pr = await PaymentRequest.findById(paymentRequestId);
    if (!pr) return res.status(404).json({ success: false, message: 'Payment request not found' });

    const fromStep = pr.currentStep;

    // Validate role can act on this step
    if (role !== 'admin') {
      const allowedSteps = ROLE_STEP_MAP[role] || [];
      if (!allowedSteps.includes(fromStep)) {
        return res.status(403).json({
          success: false,
          message: `This request is not in your queue. Current step: ${fromStep}`,
        });
      }
    }

    let toStep;
    let notifyRequester = false;
    let notifyMsg = '';

    // ── STEP 1: Department Head ───────────────────────────────────────────────
    if (fromStep === 'pending_dept_head') {
      if (action === 'approved') {
        toStep = 'pending_junior_accountant';
      } else if (action === 'rejected') {
        toStep = 'rejected';
        pr.rejectionReason = comments || '';
        notifyRequester = true;
        notifyMsg = `Your request "${pr.title}" was rejected by Department Head`;
      } else if (action === 'returned') {
        toStep = 'returned';
        pr.returnReason = comments || '';
        notifyRequester = true;
        notifyMsg = `Your request "${pr.title}" was returned for correction by Department Head`;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action. Use: approved, rejected, returned' });
      }
    }

    // ── STEP 2: Junior Accountant — Create PO + Vendor + Quotation ────────────
    else if (fromStep === 'pending_junior_accountant') {
      const {
        // Vendor details
        vendorName, vendorCode, contactPerson, email: vendorEmail,
        phone: vendorPhone, address, bankName, bankAccount, taxNumber,
        // PO details
        poDate, deliveryDate, paymentTerms, deliveryTerms, poNotes,
        // Quotation details
        quotationDate, validUntil, quotationItems,
        taxRate, terms: quotationTerms,
      } = stepData || {};

      if (!vendorName || !vendorName.trim()) {
        return res.status(400).json({ success: false, message: 'Vendor name is required' });
      }

      // Save vendor
      pr.vendor = {
        vendorName:    vendorName    || '',
        vendorCode:    vendorCode    || '',
        contactPerson: contactPerson || '',
        email:         vendorEmail   || '',
        phone:         vendorPhone   || '',
        address:       address       || '',
        bankName:      bankName      || '',
        bankAccount:   bankAccount   || '',
        taxNumber:     taxNumber     || '',
      };

      // Generate and save PO
      const poNumber = await generatePONumber();
      pr.purchaseOrder = {
        poNumber,
        poDate:        poDate        ? new Date(poDate)        : new Date(),
        deliveryDate:  deliveryDate  ? new Date(deliveryDate)  : null,
        paymentTerms:  paymentTerms  || '',
        deliveryTerms: deliveryTerms || '',
        notes:         poNotes       || '',
        createdAt:     new Date(),
      };

      // Build quotation items from request items if not provided
      const qItems = (quotationItems && quotationItems.length > 0)
        ? quotationItems
        : pr.items.map((i) => ({
            itemName:   i.itemName,
            quantity:   i.quantity,
            unitPrice:  i.unitPrice,
            totalPrice: i.totalPrice,
          }));

      const subtotal   = qItems.reduce((sum, i) => sum + (i.totalPrice || 0), 0);
      const tRate      = parseFloat(taxRate) || 0;
      const taxAmount  = parseFloat(((subtotal * tRate) / 100).toFixed(2));
      const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

      const quotationNumber = await generateQuotationNumber();
      pr.quotation = {
        quotationNumber,
        quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
        validUntil:    validUntil    ? new Date(validUntil)    : null,
        items:         qItems,
        subtotal,
        taxRate:       tRate,
        taxAmount,
        grandTotal,
        terms:         quotationTerms || '',
        createdAt:     new Date(),
      };

      // Update total amount with quotation grand total
      pr.totalAmount = grandTotal;

      toStep = 'pending_senior_accountant';
    }

    // ── STEP 3: Senior Accountant — GL Coding ────────────────────────────────
    else if (fromStep === 'pending_senior_accountant') {
      const { glAccount, vatCompliant, isDuplicate, notes, voucherNumber, threeWayMatch, matchNotes } = stepData || {};

      pr.glCoding = {
        glAccount:    glAccount || '',
        vatCompliant: vatCompliant !== undefined ? !!vatCompliant : null,
        isDuplicate:  !!isDuplicate,
        notes:        notes || '',
      };

      // Also record AP voucher
      pr.apVoucher = {
        voucherNumber: voucherNumber || '',
        threeWayMatch: threeWayMatch !== undefined ? !!threeWayMatch : true,
        matchNotes:    matchNotes || '',
        createdAt:     new Date(),
      };

      if (action === 'approved') {
        toStep = 'pending_budget_control';
      } else if (action === 'rejected') {
        toStep = 'rejected';
        pr.rejectionReason = notes || comments || '';
        notifyRequester = true;
        notifyMsg = `Your request "${pr.title}" was rejected by Senior Accountant`;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action. Use: approved, rejected' });
      }
    }

    // ── STEP 4: Budget Control ────────────────────────────────────────────────
    else if (fromStep === 'pending_budget_control') {
      const { budgetAvailable, budgetCode, notes } = stepData || {};
      pr.budgetCheck = {
        budgetAvailable: budgetAvailable !== undefined ? !!budgetAvailable : null,
        budgetCode:      budgetCode || '',
        notes:           notes || '',
      };

      if (budgetAvailable) {
        toStep = 'pending_finance_manager';
      } else {
        toStep = 'pending_dept_head';
        pr.returnReason = notes || 'Budget not available — please adjust and resubmit';
        const deptHeads = await User.find({ role: 'department_head', isActive: true });
        for (const dh of deptHeads) {
          await sendNotification({
            recipient: dh._id, sender: approverId,
            title: 'Budget Not Available',
            message: `Request "${pr.requestNumber}" returned — budget unavailable`,
            type: 'return', paymentRequest: pr._id, link: `/payment-requests/${pr._id}`,
          });
        }
      }
    }

    // ── STEP 5: Finance Manager ───────────────────────────────────────────────
    else if (fromStep === 'pending_finance_manager') {
      const { cashFlowOk, policyOk, heldReason } = stepData || {};
      pr.financeReview = {
        cashFlowOk: cashFlowOk !== undefined ? !!cashFlowOk : null,
        policyOk:   policyOk   !== undefined ? !!policyOk   : null,
        heldReason: heldReason || '',
      };

      if (action === 'approved') {
        toStep = 'pending_treasury';
      } else if (action === 'held') {
        toStep = 'returned';
        pr.returnReason = heldReason || 'Payment held by Finance Manager';
        notifyRequester = true;
        notifyMsg = `Your request "${pr.title}" is on hold by Finance Manager`;
      } else if (action === 'rejected') {
        toStep = 'rejected';
        pr.rejectionReason = heldReason || comments || '';
        notifyRequester = true;
        notifyMsg = `Your request "${pr.title}" was rejected by Finance Manager`;
      } else {
        return res.status(400).json({ success: false, message: 'Invalid action. Use: approved, held, rejected' });
      }
    }

    // ── STEP 6: Sr. Accountant Treasury — use /api/payments ──────────────────
    else if (fromStep === 'pending_treasury') {
      return res.status(400).json({
        success: false,
        message: 'Use POST /api/payments to process the payment for this step',
      });
    }

    // ── STEP 7: Junior Accountant — Filing & Archive ──────────────────────────
    else if (fromStep === 'pending_filing') {
      const { checklist, notes: filingNotes } = stepData || {};
      toStep = 'completed';
      pr.isArchived  = true;
      pr.completedAt = new Date();
      notifyRequester = true;
      notifyMsg = `Your request "${pr.title}" (${pr.requestNumber}) has been completed and archived`;
    }

    else {
      return res.status(403).json({ success: false, message: 'Your role cannot process this step' });
    }

    // Apply transition
    pr.previousStep = fromStep;
    pr.currentStep  = toStep;
    if (toStep === 'completed') pr.isPaid = true;
    await pr.save();

    // Record approval trail
    await Approval.create({
      paymentRequest: pr._id,
      approver:  approverId,
      action:    action || 'forwarded',
      comments:  comments || '',
      fromStep,
      toStep,
      stepData:  stepData || {},
    });

    // Notify next actor
    if (!['rejected', 'returned', 'completed'].includes(toStep)) {
      await notifyNextStep(toStep, pr, approverId);
    }

    // Notify requester
    if (notifyRequester && notifyMsg) {
      await sendNotification({
        recipient: pr.createdBy, sender: approverId,
        title: 'Payment Request Update',
        message: notifyMsg,
        type: action === 'rejected' ? 'rejection' : 'return',
        paymentRequest: pr._id, link: `/payment-requests/${pr._id}`,
      });
    }

    await createAuditLog({
      user: approverId,
      action: `APPROVAL_${(action || 'forwarded').toUpperCase()}`,
      module: 'PaymentRequest',
      resourceId: pr._id,
      description: `${role} → '${action}' on ${pr.requestNumber}. Step: ${fromStep} → ${toStep}`,
      req,
    });

    const populated = await PaymentRequest.findById(pr._id).populate([
      { path: 'createdBy',  select: 'firstName lastName email' },
      { path: 'department', select: 'name code' },
      { path: 'attachments' },
    ]);

    res.json({ success: true, message: `Action '${action || 'forwarded'}' applied`, data: populated });
  } catch (err) {
    next(err);
  }
};

// @desc    Get approval history
// @route   GET /api/approvals/:paymentRequestId
const getApprovals = async (req, res, next) => {
  try {
    const approvals = await Approval.find({ paymentRequest: req.params.paymentRequestId })
      .populate('approver', 'firstName lastName email role')
      .sort({ createdAt: 1 });
    res.json({ success: true, data: approvals });
  } catch (err) {
    next(err);
  }
};

module.exports = { processApproval, getApprovals };
