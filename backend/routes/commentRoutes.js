const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/auth');
const PaymentRequest = require('../models/PaymentRequest');
const { createAuditLog } = require('../middleware/auditLogger');

router.use(protect);

// GET /api/payment-requests/:id/comments
router.get('/', async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id)
      .populate('comments.user', 'firstName lastName email role');
    if (!pr) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: pr.comments });
  } catch (err) { next(err); }
});

// POST /api/payment-requests/:id/comments
router.post('/', async (req, res, next) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });

    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Not found' });

    pr.comments.push({ user: req.user._id, text: text.trim(), createdAt: new Date() });
    await pr.save({ validateBeforeSave: false });

    const populated = await PaymentRequest.findById(pr._id)
      .populate('comments.user', 'firstName lastName email role');

    await createAuditLog({
      user: req.user._id, action: 'ADD_COMMENT', module: 'PaymentRequest',
      resourceId: pr._id, description: `Added comment on ${pr.requestNumber}`, req,
    });

    res.status(201).json({ success: true, data: populated.comments });
  } catch (err) { next(err); }
});

// DELETE /api/payment-requests/:id/comments/:commentId
router.delete('/:commentId', async (req, res, next) => {
  try {
    const pr = await PaymentRequest.findById(req.params.id);
    if (!pr) return res.status(404).json({ success: false, message: 'Not found' });

    const comment = pr.comments.id(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    // Only the comment author or admin can delete
    if (comment.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
    }

    pr.comments.pull({ _id: req.params.commentId });
    await pr.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Comment deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
