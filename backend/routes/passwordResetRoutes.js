const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const User    = require('../models/User');
const { sendOTPEmail } = require('../utils/emailService');

// In-memory OTP store (use Redis in production)
const otpStore = new Map();

const generateOTP = () => String(Math.floor(100000 + Math.random() * 900000));

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    // Always respond success (don't reveal if email exists)
    if (!user) return res.json({ success: true, message: 'If that email exists, an OTP has been sent' });

    const otp     = generateOTP();
    const expires = Date.now() + 10 * 60 * 1000; // 10 minutes
    otpStore.set(email.toLowerCase(), { otp, expires, userId: user._id });

    await sendOTPEmail({ to: user.email, name: user.firstName, otp });

    res.json({ success: true, message: 'OTP sent to your email address' });
  } catch (err) { next(err); }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ success: false, message: 'Email and OTP required' });

    const stored = otpStore.get(email.toLowerCase());
    if (!stored) return res.status(400).json({ success: false, message: 'OTP not found or expired' });
    if (Date.now() > stored.expires) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }
    if (stored.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    // Mark OTP as verified (allow reset)
    stored.verified = true;
    otpStore.set(email.toLowerCase(), stored);

    res.json({ success: true, message: 'OTP verified. You may now reset your password.' });
  } catch (err) { next(err); }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ success: false, message: 'Email, OTP and new password required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const stored = otpStore.get(email.toLowerCase());
    if (!stored || !stored.verified || stored.otp !== String(otp)) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }
    if (Date.now() > stored.expires) {
      otpStore.delete(email.toLowerCase());
      return res.status(400).json({ success: false, message: 'OTP expired' });
    }

    const user = await User.findById(stored.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = newPassword;
    await user.save();

    otpStore.delete(email.toLowerCase());

    res.json({ success: true, message: 'Password reset successfully. You can now log in.' });
  } catch (err) { next(err); }
});

module.exports = router;
