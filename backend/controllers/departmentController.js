const Department = require('../models/Department');
const User = require('../models/User');
const { createAuditLog } = require('../middleware/auditLogger');

// @desc    Get all departments
// @route   GET /api/departments
// @access  Private
const getDepartments = async (req, res, next) => {
  try {
    const { search, isActive } = req.query;
    const filter = {};
    if (isActive !== undefined) filter.isActive = isActive === 'true';
    if (search) filter.name = { $regex: search, $options: 'i' };

    const departments = await Department.find(filter)
      .populate('head', 'firstName lastName email')
      .sort({ name: 1 });

    res.json({ success: true, data: departments });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single department
// @route   GET /api/departments/:id
// @access  Private
const getDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id).populate('head', 'firstName lastName email');
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    res.json({ success: true, data: dept });
  } catch (err) {
    next(err);
  }
};

// @desc    Create department
// @route   POST /api/departments
// @access  Admin
const createDepartment = async (req, res, next) => {
  try {
    const { name, code, description, head, budget, costCenter } = req.body;

    const dept = await Department.create({ name, code: code.toUpperCase(), description, head: head || null, budget: budget || 0, costCenter });

    await createAuditLog({
      user: req.user._id,
      action: 'CREATE_DEPARTMENT',
      module: 'Department',
      resourceId: dept._id,
      description: `Created department ${dept.name}`,
      req,
    });

    res.status(201).json({ success: true, message: 'Department created', data: dept });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department
// @route   PUT /api/departments/:id
// @access  Admin
const updateDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    const { name, code, description, head, budget, costCenter, isActive } = req.body;

    if (name)        dept.name       = name;
    if (code)        dept.code       = code.toUpperCase();
    if (description !== undefined) dept.description = description;
    if (head !== undefined)        dept.head        = head || null;
    if (budget !== undefined)      dept.budget      = budget;
    if (costCenter !== undefined)  dept.costCenter  = costCenter;
    if (isActive !== undefined)    dept.isActive    = isActive;

    await dept.save();

    await createAuditLog({
      user: req.user._id,
      action: 'UPDATE_DEPARTMENT',
      module: 'Department',
      resourceId: dept._id,
      description: `Updated department ${dept.name}`,
      req,
    });

    const updated = await Department.findById(dept._id).populate('head', 'firstName lastName email');
    res.json({ success: true, message: 'Department updated', data: updated });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete department
// @route   DELETE /api/departments/:id
// @access  Admin
const deleteDepartment = async (req, res, next) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    // Check if users are assigned
    const userCount = await User.countDocuments({ department: dept._id });
    if (userCount > 0) {
      return res.status(400).json({ success: false, message: `Cannot delete: ${userCount} user(s) assigned to this department` });
    }

    await Department.deleteOne({ _id: dept._id });

    await createAuditLog({
      user: req.user._id,
      action: 'DELETE_DEPARTMENT',
      module: 'Department',
      resourceId: dept._id,
      description: `Deleted department ${dept.name}`,
      severity: 'warning',
      req,
    });

    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDepartments, getDepartment, createDepartment, updateDepartment, deleteDepartment };
