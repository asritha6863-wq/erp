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

router.post(
  '/:id/attachments',
  handleUploadError(upload.array('files', 10)),
  uploadAttachments
);

module.exports = router;
