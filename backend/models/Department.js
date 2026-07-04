const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema(
  {
    name:        { type: String, required: true, unique: true, trim: true },
    code:        { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    head:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    budget:      { type: Number, default: 0 },
    usedBudget:  { type: Number, default: 0 },
    isActive:    { type: Boolean, default: true },
    costCenter:  { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

departmentSchema.virtual('availableBudget').get(function () {
  return this.budget - this.usedBudget;
});

departmentSchema.set('toJSON', { virtuals: true });
departmentSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Department', departmentSchema);
