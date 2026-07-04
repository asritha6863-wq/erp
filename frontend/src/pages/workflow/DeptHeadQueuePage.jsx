import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ActionModal = ({ pr, onClose, onDone }) => {
  const [action, setAction]   = useState('approved');
  const [comments, setComments] = useState('');
  const [saving, setSaving]   = useState(false);

  const handleSubmit = async () => {
    if ((action === 'rejected' || action === 'returned') && !comments.trim()) {
      toast.error('Comments are required for rejection or return'); return;
    }
    setSaving(true);
    try {
      await approvalService.processApproval({ paymentRequestId: pr._id, action, comments });
      toast.success(`Request ${action}`);
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Review Payment Request — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* Summary */}
              <div className="row g-3 mb-4 p-3 rounded" style={{ background: '#f8f9ff' }}>
                <div className="col-md-6"><strong>Vendor:</strong> {pr.vendorName}</div>
                <div className="col-md-6"><strong>Invoice #:</strong> {pr.invoiceNumber}</div>
                <div className="col-md-6"><strong>Amount:</strong> {formatCurrency(pr.amount, pr.currency)}</div>
                <div className="col-md-6"><strong>Due Date:</strong> {formatDate(pr.dueDate)}</div>
                <div className="col-12"><strong>Description:</strong> {pr.description}</div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Decision *</label>
                <div className="d-flex gap-3">
                  {['approved','rejected','returned'].map((a) => (
                    <div key={a} className="form-check">
                      <input className="form-check-input" type="radio" name="action" id={`act-${a}`} value={a} checked={action === a} onChange={() => setAction(a)} />
                      <label className="form-check-label text-capitalize" htmlFor={`act-${a}`}>{a}</label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Comments {(action === 'rejected' || action === 'returned') ? '*' : ''}</label>
                <textarea className="form-control" rows={3} value={comments} onChange={(e) => setComments(e.target.value)}
                  placeholder={action === 'approved' ? 'Optional comments...' : 'Reason required...'} />
              </div>

              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-sm btn-outline-primary">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className={`btn ${action === 'approved' ? 'btn-success' : action === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                onClick={handleSubmit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {action === 'approved' ? 'Approve & Forward' : action === 'rejected' ? 'Reject' : 'Return for Correction'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const DeptHeadQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Department Head Approval Queue"
        subtitle="Review and approve payment requests from your department"
        icon="bi-person-check"
        stepFilter="pending_dept_head"
        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-check2-circle me-1"></i>Review
          </button>
        )}
      />
      {selected && (
        <ActionModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default DeptHeadQueuePage;
