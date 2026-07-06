const nodemailer = require('nodemailer');

// Create transporter — uses Gmail SMTP (or any SMTP in env)
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST   || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

const FROM = `"ERP Payment System" <${process.env.EMAIL_USER || 'noreply@erp.com'}>`;

// ── Generic send ────────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`[EMAIL SKIPPED] No credentials set. Would send to: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({ from: FROM, to, subject, html, text });
    console.log(`[EMAIL SENT] ${to} | ${subject} | ${info.messageId}`);
    return info;
  } catch (err) {
    console.error(`[EMAIL ERROR] ${err.message}`);
  }
};

// ── Email Templates ─────────────────────────────────────────────────────────
const baseTemplate = (title, content, actionUrl = '', actionText = '') => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f4f6f9; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 30px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0d6efd, #0096c7); padding: 30px; text-align: center; color: white; }
    .header h1 { margin: 0; font-size: 22px; }
    .header p  { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
    .body { padding: 30px; color: #343a40; }
    .body h2 { color: #1a1f2e; margin-top: 0; }
    .info-box { background: #f8f9ff; border: 1px solid #c7d7fe; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #e9ecef; font-size: 14px; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #6c757d; }
    .value { font-weight: 600; color: #1a1f2e; }
    .btn { display: inline-block; background: #0d6efd; color: white !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 20px 0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-success { background: #d1fae5; color: #065f46; }
    .badge-warning { background: #fef3c7; color: #92400e; }
    .badge-danger  { background: #fee2e2; color: #991b1b; }
    .badge-info    { background: #dbeafe; color: #1e40af; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>💼 ERP Payment Workflow</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${content}
      ${actionUrl ? `<div style="text-align:center"><a href="${actionUrl}" class="btn">${actionText}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>This is an automated message from ERP Payment Workflow System.</p>
      <p>Do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`;

// ── Workflow step email ──────────────────────────────────────────────────────
const sendWorkflowEmail = async ({ to, recipientName, action, requestNumber, requestTitle, amount, currency, fromRole, comments, appUrl }) => {
  const actionConfig = {
    submitted:        { subject: `New Request Pending Your Approval — ${requestNumber}`,     badge: 'badge-info',    badgeText: 'Action Required', icon: '📋' },
    approved:         { subject: `Request Approved — ${requestNumber}`,                       badge: 'badge-success', badgeText: 'Approved',        icon: '✅' },
    rejected:         { subject: `Request Rejected — ${requestNumber}`,                       badge: 'badge-danger',  badgeText: 'Rejected',        icon: '❌' },
    returned:         { subject: `Request Returned for Correction — ${requestNumber}`,        badge: 'badge-warning', badgeText: 'Returned',        icon: '🔄' },
    completed:        { subject: `Payment Completed — ${requestNumber}`,                      badge: 'badge-success', badgeText: 'Completed',       icon: '🎉' },
    payment_processed:{ subject: `Payment Processed — ${requestNumber}`,                     badge: 'badge-success', badgeText: 'Paid',            icon: '💳' },
    po_created:       { subject: `PO & Quotation Created — ${requestNumber}`,                badge: 'badge-info',    badgeText: 'PO Created',      icon: '📄' },
  };

  const cfg = actionConfig[action] || actionConfig.submitted;

  const content = `
    <h2>${cfg.icon} ${cfg.subject}</h2>
    <p>Dear <strong>${recipientName}</strong>,</p>
    <p>A payment request requires your attention:</p>
    <div class="info-box">
      <div class="info-row"><span class="label">Request #</span><span class="value">${requestNumber}</span></div>
      <div class="info-row"><span class="label">Title</span><span class="value">${requestTitle}</span></div>
      <div class="info-row"><span class="label">Amount</span><span class="value">${currency} ${Number(amount || 0).toLocaleString()}</span></div>
      <div class="info-row"><span class="label">Action By</span><span class="value">${fromRole || 'System'}</span></div>
      <div class="info-row"><span class="label">Status</span><span class="value"><span class="badge ${cfg.badge}">${cfg.badgeText}</span></span></div>
      ${comments ? `<div class="info-row"><span class="label">Comments</span><span class="value">${comments}</span></div>` : ''}
    </div>
  `;

  await sendEmail({
    to,
    subject: cfg.subject,
    html: baseTemplate(cfg.subject, content, appUrl || process.env.FRONTEND_URL || '', 'View Request'),
    text: `${cfg.subject}\n\nRequest: ${requestNumber}\nTitle: ${requestTitle}\nAmount: ${currency} ${amount}`,
  });
};

// ── Password reset OTP email ─────────────────────────────────────────────────
const sendOTPEmail = async ({ to, name, otp }) => {
  const content = `
    <h2>🔐 Password Reset Request</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>You requested to reset your password. Use the OTP below:</p>
    <div style="text-align:center;margin:30px 0">
      <div style="background:#f0f4ff;border:2px dashed #0d6efd;border-radius:12px;padding:24px;display:inline-block">
        <div style="font-size:36px;font-weight:700;color:#0d6efd;letter-spacing:12px">${otp}</div>
        <div style="color:#6c757d;font-size:13px;margin-top:8px">Valid for 10 minutes</div>
      </div>
    </div>
    <p style="color:#dc3545;font-size:13px">⚠️ If you did not request this, please ignore this email and your password will remain unchanged.</p>
  `;
  await sendEmail({
    to,
    subject: 'Password Reset OTP — ERP Payment System',
    html: baseTemplate('Password Reset', content),
    text: `Your OTP is: ${otp}. Valid for 10 minutes.`,
  });
};

// ── Deadline reminder email ──────────────────────────────────────────────────
const sendDeadlineReminderEmail = async ({ to, name, requestNumber, requestTitle, hoursIdle, currentStep }) => {
  const content = `
    <h2>⏰ Action Required — Request Waiting</h2>
    <p>Dear <strong>${name}</strong>,</p>
    <p>The following request has been waiting in your queue for <strong>${hoursIdle} hours</strong> and needs your attention:</p>
    <div class="info-box">
      <div class="info-row"><span class="label">Request #</span><span class="value">${requestNumber}</span></div>
      <div class="info-row"><span class="label">Title</span><span class="value">${requestTitle}</span></div>
      <div class="info-row"><span class="label">Current Step</span><span class="value">${currentStep}</span></div>
      <div class="info-row"><span class="label">Waiting For</span><span class="value">${hoursIdle} hours</span></div>
    </div>
    <p>Please log in and take action to keep the workflow moving.</p>
  `;
  await sendEmail({
    to,
    subject: `⏰ Reminder: Request ${requestNumber} Awaiting Your Action`,
    html: baseTemplate('Deadline Reminder', content, process.env.FRONTEND_URL || '', 'Review Now'),
    text: `Reminder: Request ${requestNumber} has been waiting ${hoursIdle} hours for your action.`,
  });
};

module.exports = { sendEmail, sendWorkflowEmail, sendOTPEmail, sendDeadlineReminderEmail };
