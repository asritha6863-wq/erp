const jwt = require('jsonwebtoken');
const Notification = require('../models/Notification');

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
};

// Paginate query results
const paginate = async (model, query, options = {}) => {
  const page  = parseInt(options.page)  || 1;
  const limit = parseInt(options.limit) || 10;
  const skip  = (page - 1) * limit;
  const sort  = options.sort || { createdAt: -1 };

  const [data, total] = await Promise.all([
    model.find(query).sort(sort).skip(skip).limit(limit).populate(options.populate || ''),
    model.countDocuments(query),
  ]);

  return {
    data,
    pagination: {
      total,
      page,
      pages: Math.ceil(total / limit),
      limit,
    },
  };
};

// Send notification helper
const sendNotification = async ({ recipient, sender, title, message, type, paymentRequest, link }) => {
  try {
    await Notification.create({ recipient, sender, title, message, type, paymentRequest, link });
  } catch (err) {
    console.error('Notification error:', err.message);
  }
};

// Map workflow step to next step
const STEP_TRANSITIONS = {
  draft:                      'pending_dept_head',
  pending_dept_head:          'pending_junior_accountant',
  pending_junior_accountant:  'pending_senior_accountant',
  pending_senior_accountant:  'pending_budget_control',
  pending_budget_control:     'pending_finance_manager',
  pending_finance_manager:    'pending_treasury',
  pending_treasury:           'pending_filing',
  pending_filing:             'completed',
};

const getNextStep = (currentStep) => STEP_TRANSITIONS[currentStep] || null;

// Step display labels
const STEP_LABELS = {
  draft:                      'Draft',
  pending_dept_head:          'Pending Department Head',
  pending_junior_accountant:  'Pending Junior Accountant',
  pending_senior_accountant:  'Pending Senior Accountant',
  pending_budget_control:     'Pending Budget Control',
  pending_finance_manager:    'Pending Finance Manager',
  pending_treasury:           'Pending Treasury',
  pending_filing:             'Pending Filing',
  completed:                  'Completed',
  rejected:                   'Rejected',
  returned:                   'Returned',
};

const getStepLabel = (step) => STEP_LABELS[step] || step;

module.exports = { generateToken, paginate, sendNotification, getNextStep, getStepLabel, STEP_TRANSITIONS };
