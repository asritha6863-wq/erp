const express = require('express');
const router  = express.Router();
const { processPayment, getPayments, getPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);

router.route('/')
  // Senior Accountant processes payment (treasury step)
  .get(authorize('admin', 'senior_accountant', 'finance_manager'))
  .post(authorize('admin', 'senior_accountant'), processPayment);

router.get('/:id', getPayment);

module.exports = router;
