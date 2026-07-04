const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ROLES = [
  'admin',
  'employee',
  'department_head',
  'junior_accountant',
  'senior_accountant',
  'budget_control',
  'finance_manager',
];

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    lastName:  { type: String, required: true, trim: true },
    email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:  { type: String, required: true, minlength: 6 },
    role:      { type: String, enum: ROLES, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', default: null },
    phone:     { type: String, trim: true, default: '' },
    isActive:  { type: Boolean, default: true },
    avatar:    { type: String, default: '' },
    lastLogin: { type: Date, default: null },
    passwordResetToken: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual: full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject({ virtuals: true });
  delete obj.password;
  delete obj.passwordResetToken;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
module.exports.ROLES = ROLES;
