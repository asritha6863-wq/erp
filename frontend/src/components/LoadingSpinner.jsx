import React from 'react';

const LoadingSpinner = ({ text = 'Loading...', fullPage = false }) => {
  if (fullPage) {
    return (
      <div className="d-flex flex-column justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted">{text}</p>
      </div>
    );
  }

  return (
    <div className="d-flex justify-content-center align-items-center py-5">
      <div className="spinner-border text-primary me-2" style={{ width: '1.5rem', height: '1.5rem' }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-muted">{text}</span>
    </div>
  );
};

export default LoadingSpinner;
