import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';
import EmptyState from '../components/EmptyState';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatRelativeTime } from '../utils/formatters';

const TYPE_ICON = {
  payment_request: 'bi-file-earmark-text text-primary',
  approval:        'bi-check-circle text-success',
  rejection:       'bi-x-circle text-danger',
  return:          'bi-arrow-return-left text-warning',
  payment:         'bi-bank text-info',
  system:          'bi-gear text-secondary',
  info:            'bi-bell text-secondary',
};

const NotificationsPage = () => {
  const { notifications, loading, markAsRead, markAllRead, deleteNotification, unreadCount } = useNotifications();
  const navigate = useNavigate();

  const handleClick = async (n) => {
    if (!n.isRead) await markAsRead([n._id]);
    if (n.paymentRequest) navigate(`/payment-requests/${n.paymentRequest._id || n.paymentRequest}`);
  };

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title">
              <i className="bi bi-bell me-2 text-primary"></i>Notifications
              {unreadCount > 0 && <span className="badge bg-danger ms-2">{unreadCount}</span>}
            </h1>
            <p className="page-subtitle">Stay updated on your payment workflow activities</p>
          </div>
          {unreadCount > 0 && (
            <button className="btn btn-outline-primary btn-sm" onClick={markAllRead}>
              <i className="bi bi-check2-all me-1"></i>Mark All Read
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : notifications.length === 0 ? (
            <EmptyState icon="bi-bell-slash" title="No notifications" message="You're all caught up!" />
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`d-flex gap-3 p-3 border-bottom ${!n.isRead ? 'bg-light-blue' : ''}`}
                style={{ cursor: n.paymentRequest ? 'pointer' : 'default' }}
                onClick={() => handleClick(n)}
              >
                <div style={{ width: 40, height: 40, borderRadius: '50%', background: !n.isRead ? '#e8f0fe' : '#f8f9fa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className={`bi ${TYPE_ICON[n.type] || 'bi-bell text-secondary'}`} style={{ fontSize: '1.1rem' }}></i>
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex align-items-start justify-content-between gap-2">
                    <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{n.title}</div>
                    <div className="d-flex align-items-center gap-2 flex-shrink-0">
                      {!n.isRead && <span className="rounded-circle bg-primary" style={{ width: 8, height: 8 }}></span>}
                      <button
                        className="btn btn-sm btn-link text-danger p-0"
                        onClick={(e) => { e.stopPropagation(); deleteNotification(n._id); }}
                        title="Delete"
                      >
                        <i className="bi bi-x"></i>
                      </button>
                    </div>
                  </div>
                  <div className="text-muted" style={{ fontSize: '0.82rem' }}>{n.message}</div>
                  <div style={{ fontSize: '0.72rem', color: '#adb5bd', marginTop: 4 }}>
                    {n.sender && <span>From: {n.sender.firstName} {n.sender.lastName} · </span>}
                    {formatRelativeTime(n.createdAt)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;
