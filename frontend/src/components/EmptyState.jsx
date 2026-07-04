import React from 'react';

const EmptyState = ({ icon = 'bi-inbox', title = 'No data found', message = '', action = null }) => (
  <div className="text-center py-5">
    <i className={`bi ${icon} text-muted`} style={{ fontSize: '3.5rem', opacity: 0.4 }}></i>
    <h5 className="mt-3 text-muted">{title}</h5>
    {message && <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>{message}</p>}
    {action}
  </div>
);

export default EmptyState;
