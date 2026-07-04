const Notification = require('../models/Notification');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { isRead, page = 1, limit = 20 } = req.query;
    const filter = { recipient: req.user._id };
    if (isRead !== undefined) filter.isRead = isRead === 'true';

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ recipient: req.user._id, isRead: false });

    const data = await Notification.find(filter)
      .populate('sender', 'firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({ success: true, data, unreadCount, pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) } });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark notification(s) as read
// @route   PUT /api/notifications/read
// @access  Private
const markAsRead = async (req, res, next) => {
  try {
    const { ids } = req.body; // array of IDs or empty for all
    const filter = { recipient: req.user._id, isRead: false };
    if (ids && ids.length > 0) filter._id = { $in: ids };

    await Notification.updateMany(filter, { isRead: true, readAt: new Date() });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res, next) => {
  try {
    await Notification.deleteOne({ _id: req.params.id, recipient: req.user._id });
    res.json({ success: true, message: 'Notification deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getNotifications, markAsRead, deleteNotification };
