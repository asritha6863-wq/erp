import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { user, login } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Email and password are required'); return; }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = (e, emailVal, pwdVal) => {
    e.preventDefault();
    setEmail(emailVal);
    setPassword(pwdVal);
  };

  const demoAccounts = [
    { label: 'Admin',                         email: 'admin@erp.com' },
    { label: 'Employee',                      email: 'john.smith@erp.com' },
    { label: 'Dept. Head',                    email: 'emily.davis@erp.com' },
    { label: 'Jr. Accountant (AP & Filing)',  email: 'lisa.anderson@erp.com' },
    { label: 'Sr. Accountant (GL & Treasury)',email: 'david.martinez@erp.com' },
    { label: 'Budget Control',                email: 'jennifer.taylor@erp.com' },
    { label: 'Finance Manager',               email: 'william.brown@erp.com' },
  ];

  return (
    <div className="login-bg">
      <div style={{ width: '100%', maxWidth: 900, padding: '1rem' }}>
        <div className="row g-4 align-items-center">
          {/* Left panel */}
          <div className="col-lg-5 d-none d-lg-block text-white">
            <div className="mb-4">
              <div className="d-flex align-items-center gap-3 mb-4">
                <div style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="bi bi-currency-exchange" style={{ fontSize: '1.6rem' }}></i>
                </div>
                <div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700 }}>ERP Payment</div>
                  <div style={{ fontSize: '0.8rem', opacity: 0.7 }}>Workflow System</div>
                </div>
              </div>
              <h2 className="fw-bold mb-3">Payment Entry<br />Processing Workflow</h2>
              <p style={{ opacity: 0.75, fontSize: '0.92rem', lineHeight: 1.7 }}>
                An end-to-end ERP system for managing payment approvals through an 8-step workflow — from request creation to final filing.
              </p>
            </div>
            <div className="row g-2 mt-3">
              {[
                { icon: 'bi-shield-check', label: 'Role-Based Security' },
                { icon: 'bi-diagram-3',    label: '8-Step Workflow' },
                { icon: 'bi-graph-up',     label: 'Real-time Dashboard' },
                { icon: 'bi-bell',         label: 'Live Notifications' },
              ].map((f) => (
                <div key={f.label} className="col-6">
                  <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 10, padding: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <i className={`bi ${f.icon}`} style={{ fontSize: '1.2rem' }}></i>
                    <span style={{ fontSize: '0.8rem' }}>{f.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Login Card */}
          <div className="col-lg-7">
            <div className="login-card bg-white p-4">
              <div className="text-center mb-4">
                <div className="d-flex justify-content-center mb-3">
                  <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className="bi bi-currency-exchange text-white" style={{ fontSize: '1.6rem' }}></i>
                  </div>
                </div>
                <h4 className="fw-bold mb-1">Welcome Back</h4>
                <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>Sign in to your ERP account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-muted"></i></span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Password</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-lock text-muted"></i></span>
                    <input
                      type={showPwd ? 'text' : 'password'}
                      className="form-control border-start-0 border-end-0"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button type="button" className="input-group-text bg-light" onClick={() => setShowPwd((p) => !p)}>
                      <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'} text-muted`}></i>
                    </button>
                  </div>
                </div>
                <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                  {loading ? (
                    <><span className="spinner-border spinner-border-sm me-2"></span>Signing In...</>
                  ) : (
                    <><i className="bi bi-box-arrow-in-right me-2"></i>Sign In</>
                  )}
                </button>
                <div className="text-end mt-2">
                  <Link to="/forgot-password" style={{ fontSize: '0.82rem', color: 'var(--primary)' }} className="text-decoration-none">
                    <i className="bi bi-question-circle me-1"></i>Forgot password?
                  </Link>
                </div>
              </form>

              {/* Demo accounts */}
              <div className="mt-4 pt-3 border-top">
                <div className="text-center text-muted mb-2" style={{ fontSize: '0.78rem' }}>
                  <i className="bi bi-info-circle me-1"></i>
                  Demo accounts (password: <strong>Password123</strong>) — click to fill
                </div>
                <div className="d-flex flex-wrap gap-1 justify-content-center">
                  {demoAccounts.map((acc) => (
                    <button
                      key={acc.email}
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem' }}
                      onClick={(e) => quickLogin(e, acc.email, 'Password123')}
                    >
                      {acc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
