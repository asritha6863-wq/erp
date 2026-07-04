const express = require('express');
const router  = express.Router();
const { processApproval, getApprovals } = require('../controllers/approvalController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

// Get approval history for a payment request
router.get('/:paymentRequestId', getApprovals);

// Process approval — junior_accountant handles steps 2 & 8, senior_accountant handles steps 3 & 7
router.post(
  '/',
  authorize(
    'admin',
    'department_head',
    'junior_accountant',   // AP (step 2) + Filing (step 8)
    'senior_accountant',   // GL review (step 3) + Treasury (step 7 via /payments)
    'budget_control',
    'finance_manager',
  ),
  processApproval
);

module.exports = router;
