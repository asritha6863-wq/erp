const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');
const PaymentRequest = require('../models/PaymentRequest');
const User           = require('../models/User');
const Department     = require('../models/Department');

router.use(protect);

// GET /api/search?q=keyword&type=all|requests|users|departments
router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all', page = 1, limit = 10 } = req.query;
    if (!q || q.trim().length < 2) {
      return res.status(400).json({ success: false, message: 'Search query must be at least 2 characters' });
    }

    const regex  = { $regex: q.trim(), $options: 'i' };
    const skip   = (parseInt(page) - 1) * parseInt(limit);
    const results = {};

    if (type === 'all' || type === 'requests') {
      const prFilter = {
        $or: [
          { requestNumber: regex },
          { title: regex },
          { 'vendor.vendorName': regex },
          { 'purchaseOrder.poNumber': regex },
          { 'quotation.quotationNumber': regex },
          { costCenter: regex },
        ],
      };
      // Scope by role
      if (req.user.role === 'employee') prFilter.createdBy = req.user._id;
      if (req.user.role === 'department_head') prFilter.department = req.user.department;

      results.requests = await PaymentRequest.find(prFilter)
        .populate('createdBy', 'firstName lastName')
        .populate('department', 'name')
        .sort({ createdAt: -1 })
        .skip(skip).limit(parseInt(limit))
        .select('requestNumber title totalAmount currency currentStep createdAt vendor.vendorName');
      results.requestsTotal = await PaymentRequest.countDocuments(prFilter);
    }

    if ((type === 'all' || type === 'users') && req.user.role === 'admin') {
      const userFilter = {
        $or: [
          { firstName: regex }, { lastName: regex }, { email: regex },
        ],
      };
      results.users = await User.find(userFilter)
        .select('firstName lastName email role isActive')
        .skip(skip).limit(parseInt(limit));
      results.usersTotal = await User.countDocuments(userFilter);
    }

    if ((type === 'all' || type === 'departments') && req.user.role === 'admin') {
      const deptFilter = { $or: [{ name: regex }, { code: regex }, { costCenter: regex }] };
      results.departments = await Department.find(deptFilter)
        .select('name code costCenter budget isActive')
        .skip(skip).limit(parseInt(limit));
      results.departmentsTotal = await Department.countDocuments(deptFilter);
    }

    res.json({ success: true, query: q, data: results });
  } catch (err) { next(err); }
});

module.exports = router;
