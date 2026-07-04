import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => (
  <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '100vh', background: '#f4f6f9' }}>
    <div className="text-center">
      <div style={{ fontSize: '6rem', fontWeight: 800, color: '#0d6efd', lineHeight: 1 }}>404</div>
      <h2 className="mt-2 mb-3">Page Not Found</h2>
      <p className="text-muted mb-4">The page you're looking for doesn't exist or you don't have access to it.</p>
      <Link to="/dashboard" className="btn btn-primary">
        <i className="bi bi-house me-2"></i>Back to Dashboard
      </Link>
    </div>
  </div>
);

export default NotFoundPage;
