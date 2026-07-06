import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../services/api';

const STEPS = { EMAIL: 'email', OTP: 'otp', PASSWORD: 'password', DONE: 'done' };

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep]       = useState(STEPS.EMAIL);
  const [email, setEmail]     = useState('');
  const [otp, setOtp]         = useState('');
  const [newPwd, setNewPwd]   = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    if (!email.trim()) { toast.error('Email is required'); return; }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      toast.success('OTP sent! Check your email inbox.');
      setStep(STEPS.OTP);
    } catch (err) { toast.error(err.message || 'Failed to send OTP'); }
    finally { setLoading(false); }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    if (!otp.trim()) { toast.error('Enter the OTP'); return; }
    setLoading(true);
    try {
      await api.post('/auth/verify-otp', { email, otp });
      toast.success('OTP verified!');
      setStep(STEPS.PASSWORD);
    } catch (err) { toast.error(err.message || 'Invalid OTP'); }
    finally { setLoading(false); }
  };

  const handleResetPwd = async (e) => {
    e.preventDefault();
    if (newPwd.length < 6)       { toast.error('Password must be at least 6 characters'); return; }
    if (newPwd !== confirmPwd)    { toast.error('Passwords do not match'); return; }
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword: newPwd });
      toast.success('Password reset successfully! Please log in.');
      setStep(STEPS.DONE);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) { toast.error(err.message || 'Reset failed'); }
    finally { setLoading(false); }
  };

  const stepNum = { [STEPS.EMAIL]: 1, [STEPS.OTP]: 2, [STEPS.PASSWORD]: 3, [STEPS.DONE]: 4 }[step];

  return (
    <div className="login-bg">
      <div style={{ width: '100%', maxWidth: 460, padding: '1rem' }}>
        <div className="login-card bg-white p-4">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="d-flex justify-content-center mb-3">
              <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="bi bi-lock-fill text-white" style={{ fontSize: '1.6rem' }}></i>
              </div>
            </div>
            <h4 className="fw-bold mb-1" style={{ color: 'var(--primary-dark)' }}>Reset Password</h4>
            <p className="text-muted mb-0" style={{ fontSize: '0.88rem' }}>Follow the steps to reset your password</p>
          </div>

          {/* Step indicators */}
          <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
            {[1,2,3].map((n) => (
              <React.Fragment key={n}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.85rem',
                  background: n < stepNum ? 'var(--primary)' : n === stepNum ? 'var(--primary)' : '#f8bbd0',
                  color: n <= stepNum ? '#fff' : 'var(--primary-dark)' }}>
                  {n < stepNum ? <i className="bi bi-check"></i> : n}
                </div>
                {n < 3 && <div style={{ width: 40, height: 2, background: n < stepNum ? 'var(--primary)' : '#f8bbd0', borderRadius: 2 }}></div>}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1 — Email */}
          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOTP}>
              <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>Enter your registered email address. We'll send a 6-digit OTP.</p>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Email Address</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-envelope"></i></span>
                  <input type="email" className="form-control" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com" required />
                </div>
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Sending...</> : <><i className="bi bi-send me-2"></i>Send OTP</>}
              </button>
            </form>
          )}

          {/* Step 2 — OTP */}
          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOTP}>
              <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>Enter the 6-digit OTP sent to <strong>{email}</strong>. Check spam if not received.</p>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>6-Digit OTP</label>
                <input type="text" className="form-control text-center fw-bold" style={{ fontSize: '1.4rem', letterSpacing: '8px' }} maxLength={6}
                  value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g,''))} placeholder="000000" required />
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold mb-2" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</> : <><i className="bi bi-check2-circle me-2"></i>Verify OTP</>}
              </button>
              <button type="button" className="btn btn-outline-secondary w-100" onClick={() => setStep(STEPS.EMAIL)}>
                <i className="bi bi-arrow-left me-1"></i>Back
              </button>
            </form>
          )}

          {/* Step 3 — New Password */}
          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPwd}>
              <p className="text-muted mb-3" style={{ fontSize: '0.88rem' }}>OTP verified. Enter your new password.</p>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>New Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock"></i></span>
                  <input type={showPwd ? 'text' : 'password'} className="form-control" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} minLength={6} required placeholder="Min 6 characters" />
                  <button type="button" className="input-group-text" onClick={() => setShowPwd(p => !p)}>
                    <i className={`bi ${showPwd ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ fontSize: '0.85rem' }}>Confirm Password</label>
                <div className="input-group">
                  <span className="input-group-text"><i className="bi bi-lock-fill"></i></span>
                  <input type={showPwd ? 'text' : 'password'} className="form-control" value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} minLength={6} required placeholder="Re-enter password" />
                </div>
                {newPwd && confirmPwd && newPwd !== confirmPwd && (
                  <div className="text-danger mt-1" style={{ fontSize: '0.8rem' }}>Passwords do not match</div>
                )}
              </div>
              <button type="submit" className="btn btn-primary w-100 py-2 fw-semibold" disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Resetting...</> : <><i className="bi bi-check-circle me-2"></i>Reset Password</>}
              </button>
            </form>
          )}

          {/* Step 4 — Done */}
          {step === STEPS.DONE && (
            <div className="text-center py-3">
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fce4ec', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <i className="bi bi-check-circle-fill" style={{ fontSize: '2.5rem', color: 'var(--primary)' }}></i>
              </div>
              <h5 className="fw-bold" style={{ color: 'var(--primary-dark)' }}>Password Reset!</h5>
              <p className="text-muted" style={{ fontSize: '0.88rem' }}>Redirecting to login page...</p>
              <div className="spinner-border text-pink" style={{ color: 'var(--primary)' }}></div>
            </div>
          )}

          {/* Back to login link */}
          {step !== STEPS.DONE && (
            <div className="text-center mt-4 pt-3 border-top">
              <Link to="/login" className="text-decoration-none" style={{ fontSize: '0.85rem', color: 'var(--primary)' }}>
                <i className="bi bi-arrow-left me-1"></i>Back to Login
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
