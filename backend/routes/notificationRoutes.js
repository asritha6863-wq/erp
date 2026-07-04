const express = require('express');
const router  = express.Router();
const { getNotifications, markAsRead, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.get('/',          getNotifications);
router.put('/read',      markAsRead);
router.delete('/:id',   deleteNotification);

module.exports = router;
