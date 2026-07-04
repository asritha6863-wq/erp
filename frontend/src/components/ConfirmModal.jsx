import React from 'react';

const ConfirmModal = ({ show, title, message, confirmText = 'Confirm', confirmVariant = 'danger', onConfirm, onCancel, loading = false }) => {
  if (!show) return null;

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn-close" onClick={onCancel} disabled={loading}></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">{message}</p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>Cancel</button>
              <button className={`btn btn-${confirmVariant}`} onClick={onConfirm} disabled={loading}>
                {loading ? <><span className="spinner-border spinner-border-sm me-2"></span>Processing...</> : confirmText}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} onClick={onCancel}></div>
    </>
  );
};

export default ConfirmModal;
