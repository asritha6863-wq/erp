import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const FinanceModal = ({ pr, onClose, onDone }) => {
  const [action, setAction]         = useState('approved');
  const [cashFlowOk, setCashFlowOk] = useState(true);
  const [policyOk, setPolicyOk]     = useState(true);
  const [heldReason, setHeldReason] = useState('');
  const [saving, setSaving]         = useState(false);

  const handleSubmit = async () => {
    if ((action === 'held' || action === 'rejected') && !heldReason.trim()) {
      toast.error('Reason is required for hold or rejection'); return;
    }
    setSaving(true);
    try {
      await approvalService.processApproval({
        paymentRequestId: pr._id,
        action,
        comments: heldReason,
        stepData: { cashFlowOk, policyOk, heldReason },
      });
      const msgs = { approved: 'Approved and forwarded to Treasury', held: 'Payment held', rejected: 'Payment rejected' };
      toast.success(msgs[action]);
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title"><i className="bi bi-briefcase me-2 text-dark"></i>Finance Manager Review — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-2 mb-4 p-3 rounded" style={{ background: '#f8f8f8' }}>
                <div className="col-md-6"><strong>Vendor:</strong> {pr.vendorName}</div>
                <div className="col-md-6"><strong>Amount:</strong> <span className="fw-bold fs-5">{formatCurrency(pr.amount, pr.currency)}</span></div>
                <div className="col-md-6"><strong>Invoice #:</strong> {pr.invoiceNumber}</div>
                <div className="col-md-6"><strong>Due Date:</strong> {formatDate(pr.dueDate)}</div>
                <div className="col-md-6"><strong>Dept:</strong> {pr.department?.name}</div>
                <div className="col-md-6"><strong>Cost Center:</strong> {pr.costCenter || '—'}</div>
                <div className="col-12"><strong>Description:</strong> {pr.description}</div>
              </div>

              <h6 className="fw-bold mb-3">Compliance Checklist</h6>
              <div className="row g-3 mb-4">
                {[
                  { id: 'cash', label: 'Cash Flow Available', desc: 'Sufficient cash flow to process this payment', state: cashFlowOk, set: setCashFlowOk },
                  { id: 'pol',  label: 'Policy Compliance',   desc: 'Payment aligns with company policy and business justification', state: policyOk, set: setPolicyOk },
                ].map((item) => (
                  <div key={item.id} className="col-md-6">
                    <div className={`p-3 rounded border ${item.state ? 'border-success bg-light' : 'border-danger'}`} style={{ cursor: 'pointer' }}
                      onClick={() => item.set(!item.state)}>
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: item.state ? '#198754' : '#dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {item.state ? <i className="bi bi-check text-white" style={{ fontSize: '0.75rem' }}></i> : <i className="bi bi-x text-muted" style={{ fontSize: '0.75rem' }}></i>}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{item.label}</div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.desc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mb-3">
                <label className="form-label fw-semibold">Decision *</label>
                <div className="d-flex gap-3">
                  {['approved','held','rejected'].map((a) => (
                    <div key={a} className="form-check">
                      <input className="form-check-input" type="radio" name="finact" id={`fa-${a}`} value={a} checked={action === a} onChange={() => setAction(a)} />
                      <label className={`form-check-label text-capitalize ${a === 'approved' ? 'text-success' : a === 'rejected' ? 'text-danger' : 'text-warning'}`} htmlFor={`fa-${a}`}>
                        {a === 'held' ? 'Hold Payment' : a.charAt(0).toUpperCase() + a.slice(1)}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="form-label fw-semibold">Reason / Notes {action !== 'approved' ? '*' : ''}</label>
                <textarea className="form-control" rows={3} value={heldReason} onChange={(e) => setHeldReason(e.target.value)}
                  placeholder={action === 'approved' ? 'Optional comments...' : 'Provide reason...'} />
              </div>
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button
                className={`btn ${action === 'approved' ? 'btn-success' : action === 'rejected' ? 'btn-danger' : 'btn-warning'}`}
                onClick={handleSubmit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {action === 'approved' ? 'Approve & Forward to Treasury' : action === 'held' ? 'Hold Payment' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const FinanceManagerQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Finance Manager Queue"
        subtitle="Review payment proposals, cash flow, policy compliance, and business justification"
        icon="bi-briefcase"
        stepFilter="pending_finance_manager"
        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-clipboard2-check me-1"></i>Review
          </button>
        )}
      />
      {selected && (
        <FinanceModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default FinanceManagerQueuePage;
