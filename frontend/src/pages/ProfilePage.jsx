import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { ROLE_LABELS } from '../utils/constants';
import { formatDate, formatDateTime, getInitials, getAvatarColor } from '../utils/formatters';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [tab, setTab]   = useState('profile');
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState({
    firstName: user.firstName || '',
    lastName:  user.lastName  || '',
    phone:     user.phone     || '',
  });

  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await authService.updateProfile(profile);
      updateUser(res.data.user);
      toast.success('Profile updated successfully');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handlePwdSave = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    if (pwdForm.newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return; }
    setPwdSaving(true);
    try {
      await authService.updateProfile({ currentPassword: pwdForm.currentPassword, newPassword: pwdForm.newPassword });
      toast.success('Password changed successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) { toast.error(err.message); }
    finally { setPwdSaving(false); }
  };

  const avatarBg  = getAvatarColor(user.email);
  const initials  = getInitials(user.firstName, user.lastName);
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  return (
    <div>
      <div className="page-header px-0">
        <h1 className="page-title"><i className="bi bi-person-circle me-2 text-primary"></i>My Profile</h1>
        <p className="page-subtitle">Manage your account information and security</p>
      </div>

      <div className="row g-3">
        {/* Profile Card */}
        <div className="col-lg-3">
          <div className="card text-center">
            <div className="card-body py-4">
              <div className="avatar mx-auto mb-3" style={{ background: avatarBg, color: '#fff', width: 80, height: 80, fontSize: '1.6rem', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {initials}
              </div>
              <h5 className="fw-bold mb-1">{user.firstName} {user.lastName}</h5>
              <div className="text-muted mb-2" style={{ fontSize: '0.85rem' }}>{user.email}</div>
              <span className="badge bg-primary">{roleLabel}</span>
              {user.department && (
                <div className="mt-2 text-muted" style={{ fontSize: '0.8rem' }}>
                  <i className="bi bi-building me-1"></i>{user.department.name}
                </div>
              )}
              <div className={`mt-3 badge ${user.isActive ? 'bg-success' : 'bg-danger'}`}>
                {user.isActive ? 'Active Account' : 'Inactive Account'}
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-body">
              <h6 className="fw-bold mb-3">Account Info</h6>
              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Member Since</div>
                <div style={{ fontSize: '0.88rem' }}>{formatDate(user.createdAt)}</div>
              </div>
              <div className="mb-2">
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Last Login</div>
                <div style={{ fontSize: '0.88rem' }}>{formatDateTime(user.lastLogin) || 'Never'}</div>
              </div>
              <div>
                <div className="text-muted" style={{ fontSize: '0.75rem' }}>Phone</div>
                <div style={{ fontSize: '0.88rem' }}>{user.phone || '—'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="col-lg-9">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs">
                <li className="nav-item">
                  <button className={`nav-link ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>
                    <i className="bi bi-person me-1"></i>Edit Profile
                  </button>
                </li>
                <li className="nav-item">
                  <button className={`nav-link ${tab === 'password' ? 'active' : ''}`} onClick={() => setTab('password')}>
                    <i className="bi bi-lock me-1"></i>Change Password
                  </button>
                </li>
              </ul>
            </div>
            <div className="card-body">
              {tab === 'profile' && (
                <form onSubmit={handleProfileSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">First Name *</label>
                      <input className="form-control" value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Last Name *</label>
                      <input className="form-control" value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} required />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Email</label>
                      <input className="form-control" value={user.email} disabled />
                      <div className="form-text">Email cannot be changed. Contact admin.</div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Phone</label>
                      <input className="form-control" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+1-555-0000" />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Role</label>
                      <input className="form-control" value={roleLabel} disabled />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fw-semibold">Department</label>
                      <input className="form-control" value={user.department?.name || 'Not assigned'} disabled />
                    </div>
                    <div className="col-12">
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-floppy me-2"></i>Save Changes</>}
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {tab === 'password' && (
                <form onSubmit={handlePwdSave} style={{ maxWidth: 450 }}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Current Password *</label>
                    <input type="password" className="form-control" value={pwdForm.currentPassword} onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">New Password *</label>
                    <input type="password" className="form-control" value={pwdForm.newPassword} onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })} required minLength={6} />
                    <div className="form-text">Minimum 6 characters</div>
                  </div>
                  <div className="mb-4">
                    <label className="form-label fw-semibold">Confirm New Password *</label>
                    <input type="password" className="form-control" value={pwdForm.confirmPassword} onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })} required minLength={6} />
                    {pwdForm.newPassword && pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword && (
                      <div className="text-danger mt-1" style={{ fontSize: '0.82rem' }}>Passwords do not match</div>
                    )}
                  </div>
                  <button type="submit" className="btn btn-warning" disabled={pwdSaving}>
                    {pwdSaving ? <><span className="spinner-border spinner-border-sm me-2"></span>Changing...</> : <><i className="bi bi-lock me-2"></i>Change Password</>}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
