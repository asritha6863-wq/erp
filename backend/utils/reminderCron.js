const cron = require('node-cron');
const PaymentRequest = require('../models/PaymentRequest');
const User           = require('../models/User');
const { sendNotification, getStepLabel } = require('./helpers');
const { sendDeadlineReminderEmail }      = require('./emailService');

// Role to notify for each step
const STEP_ROLE_MAP = {
  pending_dept_head:           'department_head',
  pending_junior_accountant:   'junior_accountant',
  pending_senior_accountant:   'senior_accountant',
  pending_budget_control:      'budget_control',
  pending_finance_manager:     'finance_manager',
  pending_treasury:            'senior_accountant',
  pending_filing:              'junior_accountant',
};

const ACTIVE_STEPS = Object.keys(STEP_ROLE_MAP);

// Run every hour — check for requests idle > 24 hours
const startReminderCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('[CRON] Running deadline reminder check...');
      const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago

      const idleRequests = await PaymentRequest.find({
        currentStep: { $in: ACTIVE_STEPS },
        lastStepChangedAt: { $lt: cutoff },
      }).populate('createdBy', 'firstName lastName');

      console.log(`[CRON] Found ${idleRequests.length} idle requests`);

      for (const pr of idleRequests) {
        const roleToNotify = STEP_ROLE_MAP[pr.currentStep];
        if (!roleToNotify) continue;

        const users = await User.find({ role: roleToNotify, isActive: true });
        const hoursIdle = Math.floor((Date.now() - new Date(pr.lastStepChangedAt).getTime()) / 3600000);
        const stepLabel = getStepLabel(pr.currentStep);

        for (const u of users) {
          // In-app notification
          await sendNotification({
            recipient: u._id,
            title: `⏰ Reminder: ${pr.requestNumber} needs action`,
            message: `"${pr.title}" has been waiting in your queue for ${hoursIdle} hours`,
            type: 'info',
            paymentRequest: pr._id,
            link: `/payment-requests/${pr._id}`,
          });

          // Email reminder
          await sendDeadlineReminderEmail({
            to:            u.email,
            name:          u.firstName,
            requestNumber: pr.requestNumber,
            requestTitle:  pr.title,
            hoursIdle,
            currentStep:   stepLabel,
          });
        }
      }
      console.log('[CRON] Reminder check complete');
    } catch (err) {
      console.error('[CRON] Reminder error:', err.message);
    }
  });

  console.log('[CRON] Deadline reminder cron started (runs every hour)');
};

module.exports = { startReminderCron };
