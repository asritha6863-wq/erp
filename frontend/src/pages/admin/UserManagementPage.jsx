import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import userService from '../../services/userService';
import departmentService from '../../services/departmentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import { ROLE_LABELS } from '../../utils/constants';
import { formatDate, getInitials, getAvatarColor } from '../../utils/formatters';
import useDebounce from '../../hooks/useDebounce';

const EMPTY_FORM = { firstName: '', lastName: '', email: '', password: '', role: 'employee', department: '', phone: '', isActive: true };

const UserManagementPage = () => {
  const [users, setUsers]             = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [pagination, setPagination]   = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [search, setSearch]           = useState('');
  const [roleFilter, setRoleFilter]   = useState('');
  const [showModal, setShowModal]     = useState(false);
  const [editUser, setEditUser]       = useState(null);
  const [form, setForm]               = useState(EMPTY_FORM);
  const [saving, setSaving]           = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting]       = useState(false);
  const [pwdModal, setPwdModal]       = useState(null);
  const [newPwd, setNewPwd]           = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const fetchUsers = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await userService.getUsers({ page, limit: 10, search: debouncedSearch, role: roleFilter });
      setUsers(res.data.data);
      setPagination(res.data.pagination);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  }, [debouncedSearch, roleFilter]);

  useEffect(() => { fetchUsers(1); }, [fetchUsers]);

  useEffect(() => {
    departmentService.getDepartments().then((r) => setDepartments(r.data.data));
  }, []);

  const openCreate = () => { setEditUser(null); setForm(EMPTY_FORM); setShowModal(true); };
  const openEdit   = (u) => {
    setEditUser(u);
    setForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, department: u.department?._id || '', phone: u.phone || '', isActive: u.isActive });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form };
      if (editUser && !payload.password) delete payload.password;
      if (!payload.department) delete payload.department;
      if (editUser) {
        await userService.updateUser(editUser._id, payload);
        toast.success('User updated');
      } else {
        await userService.createUser(payload);
        toast.success('User created');
      }
      setShowModal(false);
      fetchUsers(pagination.page);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await userService.deleteUser(deleteTarget._id);
      toast.success('User deleted');
      setDeleteTarget(null);
      fetchUsers(pagination.page);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleToggle = async (u) => {
    try {
      await userService.toggleStatus(u._id);
      toast.success(`User ${u.isActive ? 'deactivated' : 'activated'}`);
      fetchUsers(pagination.page);
    } catch (err) { toast.error(err.message); }
  };

  const handleResetPwd = async () => {
    if (!newPwd || newPwd.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    try {
      await userService.resetPassword(pwdModal._id, newPwd);
      toast.success('Password reset successfully');
      setPwdModal(null);
      setNewPwd('');
    } catch (err) { toast.error(err.message); }
  };

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title"><i className="bi bi-people me-2 text-primary"></i>User Management</h1>
            <p className="page-subtitle">Manage system users and role assignments</p>
          </div>
          <button className="btn btn-primary" onClick={openCreate}>
            <i className="bi bi-person-plus me-2"></i>Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                <option value="">All Roles</option>
                {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => { setSearch(''); setRoleFilter(''); }}>
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>User</th><th>Role</th><th>Department</th><th>Status</th><th>Last Login</th><th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr><td colSpan={6} className="text-center text-muted py-4">No users found</td></tr>
                    ) : users.map((u) => (
                      <tr key={u._id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            <div className="avatar" style={{ background: getAvatarColor(u.email), color: '#fff', width: 34, height: 34, fontSize: '0.75rem' }}>
                              {getInitials(u.firstName, u.lastName)}
                            </div>
                            <div>
                              <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{u.firstName} {u.lastName}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{u.email}</div>
                            </div>
                          </div>
                        </td>
                        <td><span className="badge bg-primary" style={{ fontSize: '0.72rem' }}>{ROLE_LABELS[u.role] || u.role}</span></td>
                        <td style={{ fontSize: '0.85rem' }}>{u.department?.name || '—'}</td>
                        <td>
                          <span className={`badge ${u.isActive ? 'bg-success' : 'bg-danger'}`} style={{ fontSize: '0.72rem' }}>
                            {u.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(u.lastLogin) || 'Never'}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <button className="btn btn-sm btn-outline-primary" title="Edit" onClick={() => openEdit(u)}><i className="bi bi-pencil"></i></button>
                            <button className="btn btn-sm btn-outline-warning" title="Reset Password" onClick={() => { setPwdModal(u); setNewPwd(''); }}><i className="bi bi-key"></i></button>
                            <button className={`btn btn-sm ${u.isActive ? 'btn-outline-secondary' : 'btn-outline-success'}`} title={u.isActive ? 'Deactivate' : 'Activate'} onClick={() => handleToggle(u)}>
                              <i className={`bi ${u.isActive ? 'bi-toggle-on' : 'bi-toggle-off'}`}></i>
                            </button>
                            <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setDeleteTarget(u)}><i className="bi bi-trash"></i></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-2">
                <Pagination {...pagination} onPageChange={(p) => fetchUsers(p)} />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editUser ? 'Edit User' : 'Create New User'}</h5>
                  <button className="btn-close" onClick={() => setShowModal(false)}></button>
                </div>
                <form onSubmit={handleSave}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">First Name *</label>
                        <input className="form-control" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Last Name *</label>
                        <input className="form-control" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Email *</label>
                        <input type="email" className="form-control" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Phone</label>
                        <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Role *</label>
                        <select className="form-select" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} required>
                          {Object.entries(ROLE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Department</label>
                        <select className="form-select" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}>
                          <option value="">— None —</option>
                          {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                        </select>
                      </div>
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">{editUser ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                        <input type="password" className="form-control" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editUser} minLength={6} />
                      </div>
                      {editUser && (
                        <div className="col-md-6 d-flex align-items-end">
                          <div className="form-check">
                            <input className="form-check-input" type="checkbox" id="isActive" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                            <label className="form-check-label" htmlFor="isActive">Account Active</label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                    <button type="submit" className="btn btn-primary" disabled={saving}>
                      {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : editUser ? 'Update User' : 'Create User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
        </>
      )}

      {/* Reset Password Modal */}
      {pwdModal && (
        <>
          <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Reset Password — {pwdModal.firstName} {pwdModal.lastName}</h5>
                  <button className="btn-close" onClick={() => setPwdModal(null)}></button>
                </div>
                <div className="modal-body">
                  <label className="form-label">New Password (min 6 characters)</label>
                  <input type="password" className="form-control" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={6} />
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={() => setPwdModal(null)}>Cancel</button>
                  <button className="btn btn-warning" onClick={handleResetPwd}>Reset Password</button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
        </>
      )}

      <ConfirmModal
        show={!!deleteTarget}
        title="Delete User"
        message={`Are you sure you want to delete user "${deleteTarget?.firstName} ${deleteTarget?.lastName}"? This action cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default UserManagementPage;
