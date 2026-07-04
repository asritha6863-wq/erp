const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');
const { generateToken } = require('../utils/helpers');

// @desc    Get all users
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res, next) => {
  try {
    const { role, isActive, department, search, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (role)       filter.role       = role;
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName:  { $regex: search, $options: 'i' } },
        { email:     { $regex: search, $options: 'i' } },
      ];
    }

    const skip  = (parseInt(page) - 1) * parseInt(limit);
    const total = await User.countDocuments(filter);
    const users = await User.find(filter)
      .populate('department', 'name code')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: users,
      pagination: { total, page: parseInt(page), pages: Math.ceil(total / limit), limit: parseInt(limit) },
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Admin
const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .populate('department', 'name code')
      .select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

// @desc    Create user
// @route   POST /api/users
// @access  Admin
const createUser = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, role, department, phone } = req.body;

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ firstName, lastName, email, password, role, department: department || null, phone });

    await createAuditLog({
      user: req.user._id,
      action: 'CREATE_USER',
      module: 'User',
      resourceId: user._id,
      description: `Admin created user ${user.email} with role ${user.role}`,
      newValue: { email: user.email, role: user.role },
      req,
    });

    res.status(201).json({ success: true, message: 'User created successfully', data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Admin
const updateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const oldRole = user.role;
    const { firstName, lastName, email, role, department, phone, isActive } = req.body;

    if (firstName)  user.firstName  = firstName;
    if (lastName)   user.lastName   = lastName;
    if (email)      user.email      = email.toLowerCase();
    if (role)       user.role       = role;
    if (department !== undefined) user.department = department || null;
    if (phone !== undefined)      user.phone      = phone;
    if (isActive !== undefined)   user.isActive   = isActive;

    if (req.body.password) user.password = req.body.password;

    await user.save();

    await createAuditLog({
      user: req.user._id,
      action: 'UPDATE_USER',
      module: 'User',
      resourceId: user._id,
      description: `Admin updated user ${user.email}`,
      oldValue: { role: oldRole },
      newValue: { role: user.role, isActive: user.isActive },
      req,
    });

    res.json({ success: true, message: 'User updated successfully', data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot delete your own account' });
    }

    await User.deleteOne({ _id: user._id });

    await createAuditLog({
      user: req.user._id,
      action: 'DELETE_USER',
      module: 'User',
      resourceId: user._id,
      description: `Admin deleted user ${user.email}`,
      severity: 'warning',
      req,
    });

    res.json({ success: true, message: 'User deleted successfully' });
  } catch (err) {
    next(err);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    await createAuditLog({
      user: req.user._id,
      action: user.isActive ? 'ACTIVATE_USER' : 'DEACTIVATE_USER',
      module: 'User',
      resourceId: user._id,
      description: `Admin ${user.isActive ? 'activated' : 'deactivated'} user ${user.email}`,
      req,
    });

    res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'}`, data: user.toJSON() });
  } catch (err) {
    next(err);
  }
};

// @desc    Reset user password (admin)
// @route   PUT /api/users/:id/reset-password
// @access  Admin
const resetPassword = async (req, res, next) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.password = password;
    await user.save();

    await createAuditLog({
      user: req.user._id,
      action: 'RESET_PASSWORD',
      module: 'User',
      resourceId: user._id,
      description: `Admin reset password for user ${user.email}`,
      severity: 'warning',
      req,
    });

    res.json({ success: true, message: 'Password reset successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, getUser, createUser, updateUser, deleteUser, toggleUserStatus, resetPassword };
