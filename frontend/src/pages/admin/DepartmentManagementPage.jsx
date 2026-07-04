import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import departmentService from '../../services/departmentService';
import userService from '../../services/userService';
import LoadingSpinner from '../../components/LoadingSpinner';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency } from '../../utils/formatters';

const EMPTY = { name: '', code: '', description: '', head: '', budget: '', costCenter: '' };

const DepartmentManagementPage = () => {
  const [depts, setDepts]       = useState([]);
  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editDept, setEditDept] = useState(null);
  const [form, setForm]         = useState(EMPTY);
  const [saving, setSaving]     = useState(false);
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await departmentService.getDepartments();
      setDepts(res.data.data);
    } catch { toast.error('Failed to load departments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  useEffect(() => {
    userService.getUsers({ role: 'department_head', limit: 100 }).then((r) => setUsers(r.data.data));
  }, []);

  const openCreate = () => { setEditDept(null); setForm(EMPTY); setShowModal(true); };
  const openEdit   = (d) => {
    setEditDept(d);
    setForm({ name: d.name, code: d.code, description: d.description || '', head: d.head?._id || '', budget: d.budget || '', costCenter: d.costCenter || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, budget: Number(form.budget) || 0 };
      if (!payload.head) delete payload.head;
      if (editDept) { await departmentService.updateDepartment(editDept._id, payload); toast.success('Department updated'); }
      else          { await departmentService.createDepartment(payload); toast.success('Department created'); }
      setShowModal(false);
      fetchDepts();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await departmentService.deleteDepartment(delTarget._id);
      toast.success('Department deleted');
      setDelTarget(null);
      fetchDepts();
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const budgetPct = (d) => d.budget > 0 ? Math.min(100, Math.round((d.usedBudget / d.budget) * 100)) : 0;

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title"><i className="bi bi-building me-2 text-primary"></i>Department Management</h1>
            <p className="page-subtitle">Manage departments, budgets, and assignments</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-plus-lg me-2"></i>Add Department
          </button>
        </div>
      </div>

      {loading ? <LoadingSpinner fullPage /> : (
        <div className="row g-3">
          {depts.length === 0 ? (
            <div className="col-12 text-center text-muted py-5">No departments found</div>
          ) : depts.map((d) => {
            const pct = budgetPct(d);
            const barColor = pct >= 90 ? 'bg-danger' : pct >= 70 ? 'bg-warning' : 'bg-success';
            return (
              <div key={d._id} className="col-md-6 col-xl-4">
                <div className="card h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <span className="badge bg-primary">{d.code}</span>
                          {!d.isActive && <span className="badge bg-danger">Inactive</span>}
                        </div>
                        <h5 className="mb-0 fw-bold">{d.name}</h5>
                        {d.costCenter && <div className="text-muted" style={{ fontSize: '0.78rem' }}>Cost Center: {d.costCenter}</div>}
                      </div>
                      <div className="d-flex gap-1">
                        <button className="btn btn-sm btn-outline-primary" onClick={() => openEdit(d)}><i className="bi bi-pencil"></i></button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => setDelTarget(d)}><i className="bi bi-trash"></i></button>
                      </div>
                    </div>

                    {d.description && <p className="text-muted mb-3" style={{ fontSize: '0.82rem' }}>{d.description}</p>}

                    <div className="mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small className="text-muted">Budget Used</small>
                        <small className="fw-semibold">{pct}%</small>
                      </div>
                      <div className="progress" style={{ height: 6 }}>
                        <div className={`progress-bar ${barColor}`} style={{ width: `${pct}%` }}></div>
                      </div>
                      <div className="d-flex justify-content-between mt-1">
                        <small className="text-muted">{formatCurrency(d.usedBudget)} used</small>
                        <small className="text-muted">{formatCurrency(d.budget)} total</small>
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-badge text-muted"></i>
                      <span style={{ fontSize: '0.82rem' }}>
                        {d.head ? `${d.head.firstName} ${d.head.lastName}` : <span className="text-muted">No head assigned</span>}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editDept ? 'Edit Department' : 'Create Department'}</h5>
                  <button className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-8">
                        <label className="form-label fw-semibold">Department Name *</label>
                        <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                      </div>
                      <div className="col-4">
                        <label className="form-label fw-semibold">Code *</label>
                        <input className="form-control text-uppercase" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required maxLength={10} />
                      </div>
                      <div className="col-12">
                        <label className="form-label fw-semibold">Description</label>
                        <textarea className="form-control" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Department Head</label>
                        <select className="form-select" value={form.head} onChange={(e) => setForm({ ...form, head: e.target.value })}>
                          <option value="">— Select —</option>
                          {users.map((u) => <option key={u._id} value={u._id}>{u.firstName} {u.lastName}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Cost Center</label>
                        <input className="form-control" value={form.costCenter} onChange={(e) => setForm({ ...form, costCenter: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Annual Budget</label>
                        <div className="input-group">
                          <span className="input-group-text">$</span>
                          <input type="number" className="form-control" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} min={0} />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
        </>
      )}

      <ConfirmModal
        show={!!delTarget}
        title="Delete Department"
        message={`Delete department "${delTarget?.name}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default DepartmentManagementPage;
