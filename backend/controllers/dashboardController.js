const PaymentRequest = require('../models/PaymentRequest');
const User           = require('../models/User');
const Department     = require('../models/Department');
const Payment        = require('../models/Payment');
const AuditLog       = require('../models/AuditLog');

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
// @access  Private
const getDashboard = async (req, res, next) => {
  try {
    const { role, _id: userId, department: userDept } = req.user;

    // Base PR filter per role
    const prFilter = {};
    if (role === 'employee')        prFilter.createdBy  = userId;
    if (role === 'department_head') prFilter.department = userDept;

    // Queue steps per role
    // senior_accountant works steps 3 & 7 (GL review + Treasury/Payment)
    // junior_accountant works steps 2 & 8 (3-way match + Filing)
    const myQueueSteps = {
      department_head:   ['pending_dept_head'],
      junior_accountant: ['pending_junior_accountant', 'pending_filing'],
      senior_accountant: ['pending_senior_accountant', 'pending_treasury'],
      budget_control:    ['pending_budget_control'],
      finance_manager:   ['pending_finance_manager'],
    };

    const ALL_PENDING_STEPS = [
      'pending_dept_head',
      'pending_junior_accountant',
      'pending_senior_accountant',
      'pending_budget_control',
      'pending_finance_manager',
      'pending_treasury',
      'pending_filing',
    ];

    const [
      totalRequests,
      pendingCount,
      rejectedCount,
      returnedCount,
      completedCount,
      totalUsers,
      totalDepartments,
    ] = await Promise.all([
      PaymentRequest.countDocuments(prFilter),
      PaymentRequest.countDocuments({ ...prFilter, currentStep: { $in: ALL_PENDING_STEPS } }),
      PaymentRequest.countDocuments({ ...prFilter, currentStep: 'rejected' }),
      PaymentRequest.countDocuments({ ...prFilter, currentStep: 'returned' }),
      PaymentRequest.countDocuments({ ...prFilter, currentStep: 'completed' }),
      role === 'admin' ? User.countDocuments() : Promise.resolve(0),
      role === 'admin' ? Department.countDocuments() : Promise.resolve(0),
    ]);

    // My queue count — how many requests are waiting for ME right now
    let myQueueCount = 0;
    const steps = myQueueSteps[role];
    if (steps) {
      myQueueCount = await PaymentRequest.countDocuments({ currentStep: { $in: steps } });
    }

    // Monthly stats — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyStats = await PaymentRequest.aggregate([
      { $match: { ...prFilter, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id:         { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
          total:       { $sum: 1 },
          completed:   { $sum: { $cond: [{ $eq: ['$currentStep', 'completed'] }, 1, 0] } },
          rejected:    { $sum: { $cond: [{ $eq: ['$currentStep', 'rejected']  }, 1, 0] } },
          totalAmount: { $sum: '$amount' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    // Recent audit activity
    const recentActivities = await AuditLog.find(role === 'admin' ? {} : { user: userId })
      .populate('user', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .limit(10);

    // Recent payment requests
    const recentRequests = await PaymentRequest.find(prFilter)
      .populate('createdBy', 'firstName lastName')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .limit(5);

    // Workflow breakdown doughnut
    const workflowBreakdown = await PaymentRequest.aggregate([
      { $match: prFilter },
      { $group: { _id: '$currentStep', count: { $sum: 1 } } },
    ]);

    // Monthly payment totals
    const now        = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthlyPaymentStats = await Payment.aggregate([
      { $match: { createdAt: { $gte: monthStart }, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]);

    res.json({
      success: true,
      data: {
        stats: {
          totalRequests,
          pendingCount,
          rejectedCount,
          returnedCount,
          completedCount,
          totalUsers,
          totalDepartments,
          myQueueCount,
          monthlyPayments: monthlyPaymentStats[0] || { total: 0, count: 0 },
        },
        monthlyStats,
        recentActivities,
        recentRequests,
        workflowBreakdown,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
