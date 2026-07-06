const express = require('express');
const router  = express.Router();
const {
  createPaymentRequest,
  getPaymentRequests,
  getPaymentRequest,
  updatePaymentRequest,
  submitPaymentRequest,
  deletePaymentRequest,
  uploadAttachments,
} = require('../controllers/paymentRequestController');
const { protect } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

router.use(protect);

router.route('/')
  .get(getPaymentRequests)
  .post(createPaymentRequest);

router.route('/:id')
  .get(getPaymentRequest)
  .put(updatePaymentRequest)
  .delete(deletePaymentRequest);

router.put('/:id/submit', submitPaymentRequest);

// Feature 10 — Update priority
router.put('/:id/priority', protect, async (req, res, next) => {
  try {
    const { priority } = req.body;
    if (!['urgent','normal','low'].includes(priority)) {
      return res.status(400).json({ success: false, message: 'Priority must be urgent, normal, or low' });
    }
    const PaymentRequest = require('../models/PaymentRequest');
    const pr = await PaymentRequest.findByIdAndUpdate(
      req.params.id,
      { priority },
      { new: true }
    );
    if (!pr) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: `Priority set to ${priority}`, data: pr });
  } catch (err) { next(err); }
});

router.post(
  '/:id/attachments',
  handleUploadError(upload.array('files', 10)),
  uploadAttachments
);

module.exports = router;
