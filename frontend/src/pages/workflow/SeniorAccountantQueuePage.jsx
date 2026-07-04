import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const ReviewModal = ({ pr, onClose, onDone }) => {
  const [action, setAction]       = useState('approved');
  const [glAccount, setGlAccount] = useState('');
  const [vatCompliant, setVatCompliant] = useState(true);
  const [isDuplicate, setIsDuplicate]   = useState(false);
  const [notes, setNotes]         = useState('');
  const [saving, setSaving]       = useState(false);

  const handleSubmit = async () => {
    if (!glAccount.trim()) { toast.error('GL Account is required'); return; }
    if (isDuplicate) { toast.error('Cannot approve a duplicate invoice. Set action to Reject.'); return; }
    setSaving(true);
    try {
      await approvalService.processApproval({
        paymentRequestId: pr._id,
        action,
        comments: notes,
        stepData: { glAccount, vatCompliant, isDuplicate, notes },
      });
      toast.success(`Request ${action}`);
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
              <h5 className="modal-title"><i className="bi bi-journal-check me-2 text-primary"></i>Senior Accountant Review — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="row g-2 mb-4 p-3 rounded" style={{ background: '#f8f9ff' }}>
                <div className="col-md-6"><strong>Vendor:</strong> {pr.vendorName}</div>
                <div className="col-md-6"><strong>Amount:</strong> {formatCurrency(pr.amount, pr.currency)}</div>
                <div className="col-md-6"><strong>Invoice #:</strong> {pr.invoiceNumber}</div>
                <div className="col-md-6"><strong>Invoice Date:</strong> {formatDate(pr.invoiceDate)}</div>
                <div className="col-md-6"><strong>PO #:</strong> {pr.poNumber || '—'}</div>
                <div className="col-md-6"><strong>Payment Terms:</strong> {pr.paymentTerms || '—'}</div>
                {pr.apVoucher?.voucherNumber && (
                  <div className="col-12">
                    <span className="badge bg-success me-2">AP Voucher: {pr.apVoucher.voucherNumber}</span>
                    <span className="badge bg-info">3-Way Match: {pr.apVoucher.threeWayMatch ? 'Passed' : 'Failed'}</span>
                  </div>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">GL Account Code *</label>
                  <input className="form-control" value={glAccount} onChange={(e) => setGlAccount(e.target.value)} placeholder="e.g. GL-5100" />
                </div>
                <div className="col-md-6 d-flex align-items-end">
                  <div className="form-check me-3">
                    <input className="form-check-input" type="checkbox" id="vat" checked={vatCompliant} onChange={(e) => setVatCompliant(e.target.checked)} />
                    <label className="form-check-label" htmlFor="vat">VAT Compliant</label>
                  </div>
                  <div className="form-check">
                    <input className="form-check-input" type="checkbox" id="dup" checked={isDuplicate} onChange={(e) => setIsDuplicate(e.target.checked)} />
                    <label className="form-check-label text-danger" htmlFor="dup">Duplicate Invoice</label>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Decision *</label>
                  <div className="d-flex gap-3">
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="act" id="act-app" value="approved" checked={action === 'approved'} onChange={() => setAction('approved')} />
                      <label className="form-check-label" htmlFor="act-app">Approve</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="radio" name="act" id="act-rej" value="rejected" checked={action === 'rejected'} onChange={() => setAction('rejected')} />
                      <label className="form-check-label" htmlFor="act-rej">Reject</label>
                    </div>
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Notes {action === 'rejected' ? '*' : ''}</label>
                  <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="GL coding notes, compliance remarks..." />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className={`btn ${action === 'approved' ? 'btn-success' : 'btn-danger'}`} onClick={handleSubmit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : null}
                {action === 'approved' ? 'Approve & Forward to Budget Control' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const SeniorAccountantQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Senior Accountant Review Queue"
        subtitle="Verify GL coding, VAT compliance, and duplicate invoice checks"
        icon="bi-journal-check"
        stepFilter="pending_senior_accountant"
        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-clipboard-check me-1"></i>Review
          </button>
        )}
      />
      {selected && (
        <ReviewModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default SeniorAccountantQueuePage;
