const express = require('express');
const router  = express.Router();
const ExcelJS = require('exceljs');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/roleCheck');
const PaymentRequest = require('../models/PaymentRequest');
const AuditLog       = require('../models/AuditLog');
const User           = require('../models/User');

router.use(protect);
router.use(authorize('admin', 'finance_manager', 'senior_accountant'));

// GET /api/export/requests
router.get('/requests', async (req, res, next) => {
  try {
    const { status, startDate, endDate } = req.query;
    const filter = {};
    if (status) filter.currentStep = status;
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const requests = await PaymentRequest.find(filter)
      .populate('createdBy', 'firstName lastName email')
      .populate('department', 'name code')
      .sort({ createdAt: -1 });

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ERP Payment System';
    wb.created = new Date();

    const ws = wb.addWorksheet('Payment Requests');

    // Styling helpers
    const headerFill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D6EFD' } };
    const headerFont   = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    const borderStyle  = { style: 'thin', color: { argb: 'FFdee2e6' } };
    const allBorders   = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };

    ws.columns = [
      { header: 'Request #',      key: 'requestNumber', width: 18 },
      { header: 'Title',          key: 'title',         width: 35 },
      { header: 'Requested By',   key: 'requestedBy',   width: 22 },
      { header: 'Department',     key: 'department',    width: 20 },
      { header: 'Vendor',         key: 'vendor',        width: 22 },
      { header: 'PO Number',      key: 'poNumber',      width: 18 },
      { header: 'Amount',         key: 'amount',        width: 14 },
      { header: 'Currency',       key: 'currency',      width: 10 },
      { header: 'Status',         key: 'status',        width: 28 },
      { header: 'Priority',       key: 'priority',      width: 12 },
      { header: 'Cost Center',    key: 'costCenter',    width: 14 },
      { header: 'Due Date',       key: 'dueDate',       width: 14 },
      { header: 'Submitted At',   key: 'submittedAt',   width: 18 },
      { header: 'Completed At',   key: 'completedAt',   width: 18 },
      { header: 'Created At',     key: 'createdAt',     width: 18 },
    ];

    // Style header row
    ws.getRow(1).eachCell((cell) => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.border = allBorders;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 20;

    const statusColors = {
      completed: 'FFd1fae5', rejected: 'FFfee2e2',
      returned:  'FFfef3c7', draft:    'FFf8f9fa',
    };

    requests.forEach((pr, i) => {
      const row = ws.addRow({
        requestNumber: pr.requestNumber,
        title:         pr.title,
        requestedBy:   `${pr.createdBy?.firstName || ''} ${pr.createdBy?.lastName || ''}`.trim(),
        department:    pr.department?.name || '',
        vendor:        pr.vendor?.vendorName || '',
        poNumber:      pr.purchaseOrder?.poNumber || '',
        amount:        pr.totalAmount,
        currency:      pr.currency,
        status:        pr.currentStep,
        priority:      pr.priority || 'normal',
        costCenter:    pr.costCenter || '',
        dueDate:       pr.dueDate ? new Date(pr.dueDate).toLocaleDateString() : '',
        submittedAt:   pr.submittedAt ? new Date(pr.submittedAt).toLocaleDateString() : '',
        completedAt:   pr.completedAt ? new Date(pr.completedAt).toLocaleDateString() : '',
        createdAt:     new Date(pr.createdAt).toLocaleDateString(),
      });

      const bgColor = statusColors[pr.currentStep] || 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.border  = allBorders;
        cell.fill    = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        cell.alignment = { vertical: 'middle' };
      });
      if (i % 2 === 0 && !statusColors[pr.currentStep]) {
        row.eachCell((cell) => { cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8F9FA' } }; });
      }
    });

    // Auto-filter
    ws.autoFilter = { from: 'A1', to: `O1` };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="PaymentRequests-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// GET /api/export/audit-logs
router.get('/audit-logs', authorize('admin'), async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate)   filter.createdAt.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'firstName lastName email role')
      .sort({ createdAt: -1 })
      .limit(5000);

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Audit Logs');
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1a1f2e' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    const borderStyle = { style: 'thin', color: { argb: 'FFdee2e6' } };
    const allBorders  = { top: borderStyle, left: borderStyle, bottom: borderStyle, right: borderStyle };

    ws.columns = [
      { header: 'Date & Time', key: 'createdAt',   width: 20 },
      { header: 'User',        key: 'user',         width: 22 },
      { header: 'Email',       key: 'email',        width: 28 },
      { header: 'Role',        key: 'role',         width: 18 },
      { header: 'Action',      key: 'action',       width: 22 },
      { header: 'Module',      key: 'module',       width: 18 },
      { header: 'Description', key: 'description',  width: 50 },
      { header: 'Severity',    key: 'severity',     width: 12 },
      { header: 'IP Address',  key: 'ipAddress',    width: 16 },
    ];

    ws.getRow(1).eachCell((cell) => {
      cell.fill = headerFill; cell.font = headerFont;
      cell.border = allBorders; cell.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 20;

    const sevColors = { info: 'FFdbeafe', warning: 'FFfef3c7', error: 'FFfee2e2', critical: 'FFfce7f3' };

    logs.forEach((log) => {
      const row = ws.addRow({
        createdAt:   new Date(log.createdAt).toLocaleString(),
        user:        log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        email:       log.user?.email || '',
        role:        log.user?.role || '',
        action:      log.action,
        module:      log.module,
        description: log.description,
        severity:    log.severity,
        ipAddress:   log.ipAddress || '',
      });
      const bg = sevColors[log.severity] || 'FFFFFFFF';
      row.eachCell((cell) => {
        cell.border = allBorders;
        cell.fill   = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
    });

    ws.autoFilter = { from: 'A1', to: 'I1' };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="AuditLogs-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

// GET /api/export/users
router.get('/users', authorize('admin'), async (req, res, next) => {
  try {
    const users = await User.find({}).populate('department', 'name code').select('-password');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Users');
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF6f42c1' } };
    const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    const b = { style: 'thin', color: { argb: 'FFdee2e6' } };
    const borders = { top: b, left: b, bottom: b, right: b };

    ws.columns = [
      { header: 'Name',       key: 'name',       width: 22 },
      { header: 'Email',      key: 'email',       width: 28 },
      { header: 'Role',       key: 'role',        width: 20 },
      { header: 'Department', key: 'department',  width: 20 },
      { header: 'Phone',      key: 'phone',       width: 16 },
      { header: 'Status',     key: 'status',      width: 12 },
      { header: 'Last Login', key: 'lastLogin',   width: 18 },
      { header: 'Created',    key: 'createdAt',   width: 18 },
    ];
    ws.getRow(1).eachCell((c) => {
      c.fill = headerFill; c.font = headerFont; c.border = borders;
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });
    ws.getRow(1).height = 20;

    users.forEach((u) => {
      const row = ws.addRow({
        name: `${u.firstName} ${u.lastName}`, email: u.email, role: u.role,
        department: u.department?.name || '', phone: u.phone || '',
        status: u.isActive ? 'Active' : 'Inactive',
        lastLogin: u.lastLogin ? new Date(u.lastLogin).toLocaleString() : 'Never',
        createdAt: new Date(u.createdAt).toLocaleDateString(),
      });
      row.eachCell((c) => { c.border = borders; c.alignment = { vertical: 'middle' }; });
    });

    ws.autoFilter = { from: 'A1', to: 'H1' };
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="Users-${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) { next(err); }
});

module.exports = router;
