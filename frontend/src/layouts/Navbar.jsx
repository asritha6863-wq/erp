import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { getInitials, getAvatarColor, formatRelativeTime } from '../utils/formatters';
import { ROLE_LABELS } from '../utils/constants';

const Navbar = ({ collapsed, onToggle }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllRead } = useNotifications();
  const navigate = useNavigate();

  if (!user) return null;

  const initials  = getInitials(user.firstName, user.lastName);
  const avatarBg  = getAvatarColor(user.email);
  const roleLabel = ROLE_LABELS[user.role] || user.role;

  const recentNotifs = notifications.slice(0, 6);

  const handleNotifClick = async (notif) => {
    if (!notif.isRead) await markAsRead([notif._id]);
    if (notif.paymentRequest) navigate(`/payment-requests/${notif.paymentRequest._id || notif.paymentRequest}`);
  };

  const notifIcon = (type) => {
    const map = { payment_request: 'bi-file-earmark-text text-primary', approval: 'bi-check-circle text-success', rejection: 'bi-x-circle text-danger', return: 'bi-arrow-return-left text-warning', payment: 'bi-bank text-info' };
    return map[type] || 'bi-bell text-secondary';
  };

  return (
    <div className="topbar">
      {/* Toggle sidebar */}
      <button className="btn btn-sm btn-light me-2" onClick={onToggle} title="Toggle Sidebar">
        <i className={`bi ${collapsed ? 'bi-layout-sidebar-reverse' : 'bi-layout-sidebar'}`}></i>
      </button>

      {/* Breadcrumb area */}
      <div className="flex-grow-1 d-none d-md-block">
        <span className="text-muted" style={{ fontSize: '0.82rem' }}>
          <i className="bi bi-building me-1"></i>
          {user.department?.name || 'ERP System'} &rsaquo; <span className="text-dark fw-semibold">{roleLabel}</span>
        </span>
      </div>

      <div className="d-flex align-items-center gap-2">
        {/* Notifications dropdown */}
        <div className="dropdown">
          <button className="btn btn-sm btn-light position-relative" data-bs-toggle="dropdown" aria-expanded="false">
            <i className="bi bi-bell fs-5"></i>
            {unreadCount > 0 && (
              <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: '0.6rem' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <div className="dropdown-menu dropdown-menu-end shadow" style={{ width: 360, padding: 0, maxHeight: 480, overflowY: 'auto' }}>
            <div className="d-flex align-items-center justify-content-between px-3 py-2 border-bottom">
              <span className="fw-semibold">Notifications {unreadCount > 0 && <span className="badge bg-danger ms-1">{unreadCount}</span>}</span>
              {unreadCount > 0 && (
                <button className="btn btn-link btn-sm p-0 text-decoration-none" onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            {recentNotifs.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="bi bi-bell-slash fs-3 d-block mb-2"></i>
                No notifications
              </div>
            ) : (
              recentNotifs.map((n) => (
                <div
                  key={n._id}
                  className={`px-3 py-2 border-bottom cursor-pointer ${!n.isRead ? 'bg-light-blue' : ''}`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotifClick(n)}
                >
                  <div className="d-flex gap-2 align-items-start">
                    <i className={`bi ${notifIcon(n.type)} mt-1`} style={{ fontSize: '1.1rem', flexShrink: 0 }}></i>
                    <div className="flex-grow-1">
                      <div className="fw-semibold" style={{ fontSize: '0.82rem' }}>{n.title}</div>
                      <div className="text-muted text-truncate-2" style={{ fontSize: '0.76rem' }}>{n.message}</div>
                      <div style={{ fontSize: '0.7rem', color: '#adb5bd' }}>{formatRelativeTime(n.createdAt)}</div>
                    </div>
                    {!n.isRead && <span className="rounded-circle bg-primary" style={{ width: 8, height: 8, flexShrink: 0, marginTop: 6 }}></span>}
                  </div>
                </div>
              ))
            )}
            <div className="text-center py-2">
              <Link to="/notifications" className="btn btn-link btn-sm text-decoration-none">View all notifications</Link>
            </div>
          </div>
        </div>

        {/* User dropdown */}
        <div className="dropdown">
          <button className="btn btn-sm d-flex align-items-center gap-2 btn-light" data-bs-toggle="dropdown">
            <div className="avatar" style={{ background: avatarBg, color: '#fff', width: 30, height: 30, fontSize: '0.72rem' }}>
              {initials}
            </div>
            <span className="d-none d-md-inline" style={{ fontSize: '0.84rem', fontWeight: 600 }}>
              {user.firstName}
            </span>
            <i className="bi bi-chevron-down" style={{ fontSize: '0.65rem' }}></i>
          </button>
          <ul className="dropdown-menu dropdown-menu-end shadow">
            <li className="px-3 py-2">
              <div className="fw-semibold">{user.firstName} {user.lastName}</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{user.email}</div>
              <div><span className="badge bg-primary mt-1" style={{ fontSize: '0.65rem' }}>{roleLabel}</span></div>
            </li>
            <li><hr className="dropdown-divider" /></li>
            <li><Link className="dropdown-item" to="/profile"><i className="bi bi-person me-2"></i>My Profile</Link></li>
            <li><Link className="dropdown-item" to="/notifications"><i className="bi bi-bell me-2"></i>Notifications</Link></li>
            <li><hr className="dropdown-divider" /></li>
            <li>
              <button className="dropdown-item text-danger" onClick={logout}>
                <i className="bi bi-box-arrow-right me-2"></i>Logout
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
