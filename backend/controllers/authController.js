const User = require('../models/User');
const { generateToken } = require('../utils/helpers');
const { createAuditLog } = require('../middleware/auditLogger');

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: email.toLowerCase() })
      .populate('department', 'name code');

    if (!user || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account deactivated. Contact administrator.' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user: user._id,
      action: 'LOGIN',
      module: 'Auth',
      resourceId: user._id,
      description: `User ${user.email} logged in`,
      req,
    });

    res.json({
      success: true,
      token: generateToken(user._id),
      user: user.toJSON(),
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Logout (client clears token; server logs it)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res, next) => {
  try {
    await createAuditLog({
      user: req.user._id,
      action: 'LOGOUT',
      module: 'Auth',
      resourceId: req.user._id,
      description: `User ${req.user.email} logged out`,
      req,
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).populate('department', 'name code costCenter');
    res.json({ success: true, user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Update own profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const user = await User.findById(req.user._id);

    if (firstName) user.firstName = firstName;
    if (lastName)  user.lastName  = lastName;
    if (phone !== undefined) user.phone = phone;

    // Password change
    if (req.body.newPassword) {
      if (!req.body.currentPassword) {
        return res.status(400).json({ success: false, message: 'Current password required to set new password' });
      }
      const match = await user.matchPassword(req.body.currentPassword);
      if (!match) {
        return res.status(400).json({ success: false, message: 'Current password is incorrect' });
      }
      user.password = req.body.newPassword;
    }

    await user.save();

    await createAuditLog({
      user: user._id,
      action: 'UPDATE_PROFILE',
      module: 'Auth',
      resourceId: user._id,
      description: `User ${user.email} updated their profile`,
      req,
    });

    res.json({ success: true, message: 'Profile updated', user: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, logout, getProfile, updateProfile };
