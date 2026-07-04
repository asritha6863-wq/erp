import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency } from '../../utils/formatters';

const BudgetModal = ({ pr, onClose, onDone }) => {
  const [budgetAvailable, setBudgetAvailable] = useState(true);
  const [budgetCode, setBudgetCode] = useState('');
  const [notes, setNotes]           = useState('');
  const [saving, setSaving]         = useState(false);

  const handleSubmit = async () => {
    if (!budgetCode.trim()) { toast.error('Budget code is required'); return; }
    if (!budgetAvailable && !notes.trim()) { toast.error('Please explain why budget is not available'); return; }
    setSaving(true);
    try {
      await approvalService.processApproval({
        paymentRequestId: pr._id,
        action: budgetAvailable ? 'approved' : 'returned',
        comments: notes,
        stepData: { budgetAvailable, budgetCode, notes },
      });
      toast.success(budgetAvailable ? 'Budget confirmed, forwarded to Finance Manager' : 'Returned to Department Head — budget not available');
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
              <h5 className="modal-title"><i className="bi bi-pie-chart me-2" style={{ color: '#6f42c1' }}></i>Budget Control — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-2 mb-4 p-3 rounded" style={{ background: '#faf8ff' }}>
                <div className="col-md-6"><strong>Vendor:</strong> {pr.vendorName}</div>
                <div className="col-md-6"><strong>Amount:</strong> <span className="fw-bold text-danger">{formatCurrency(pr.amount, pr.currency)}</span></div>
                <div className="col-md-6"><strong>Department:</strong> {pr.department?.name}</div>
                <div className="col-md-6"><strong>Cost Center:</strong> {pr.costCenter || '—'}</div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Budget Availability</label>
                <div className="d-flex gap-3">
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="budget" id="b-yes" checked={budgetAvailable} onChange={() => setBudgetAvailable(true)} />
                    <label className="form-check-label text-success fw-semibold" htmlFor="b-yes"><i className="bi bi-check-circle me-1"></i>Budget Available</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="radio" name="budget" id="b-no" checked={!budgetAvailable} onChange={() => setBudgetAvailable(false)} />
                    <label className="form-check-label text-danger fw-semibold" htmlFor="b-no"><i className="bi bi-x-circle me-1"></i>Budget Not Available</label>
                  </div>
                </div>
              </div>

              {!budgetAvailable && (
                <div className="alert alert-danger py-2 mb-3">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  This will return the request to the Department Head to adjust or re-submit with an alternative budget.
                </div>
              )}

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Budget Code *</label>
                  <input className="form-control" value={budgetCode} onChange={(e) => setBudgetCode(e.target.value)} placeholder="e.g. BC-MKT-2024" />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Notes {!budgetAvailable ? '*' : ''}</label>
                  <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)}
                    placeholder={budgetAvailable ? 'Budget confirmation notes...' : 'Explain the budget issue...'} />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className={`btn ${budgetAvailable ? 'btn-success' : 'btn-warning'}`} onClick={handleSubmit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {budgetAvailable ? 'Confirm Budget & Forward' : 'Return to Dept. Head'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const BudgetControlQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Budget Control (ICD) Queue"
        subtitle="Verify budget availability, cost center allocation, and expenditure approval"
        icon="bi-pie-chart"
        stepFilter="pending_budget_control"
        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-graph-up me-1"></i>Check Budget
          </button>
        )}
      />
      {selected && (
        <BudgetModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default BudgetControlQueuePage;
