const express = require('express');
const router  = express.Router();
const { getAuditLogs } = require('../controllers/auditLogController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');

router.use(protect);
router.get('/', authorize('admin', 'finance_manager', 'senior_accountant'), getAuditLogs);

module.exports = router;
