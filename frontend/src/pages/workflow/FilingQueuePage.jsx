import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const FilingModal = ({ pr, onClose, onDone }) => {
  const [checklist, setChecklist] = useState({
    documentsArchived: false,
    paymentRegisterUpdated: false,
    digitalCopyUploaded: false,
    auditTrailVerified: false,
  });
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);

  const allChecked = Object.values(checklist).every(Boolean);

  const toggle = (key) => setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleSubmit = async () => {
    if (!allChecked) { toast.error('All checklist items must be completed before archiving'); return; }
    setSaving(true);
    try {
      await approvalService.processApproval({
        paymentRequestId: pr._id,
        action: 'approved',
        comments: notes || 'All documents archived successfully',
        stepData: { checklist, notes },
      });
      toast.success('Workflow completed! All documents archived.');
      onDone();
      onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const items = [
    { key: 'documentsArchived',        label: 'Original documents filed (physical)', desc: 'All invoices, PO, GRN physically archived' },
    { key: 'paymentRegisterUpdated',   label: 'Payment register updated',            desc: 'Payment recorded in the payment register' },
    { key: 'digitalCopyUploaded',      label: 'Digital copies archived',             desc: 'Electronic copies stored in DMS' },
    { key: 'auditTrailVerified',       label: 'Audit trail verified',                desc: 'Complete approval trail verified and documented' },
  ];

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header" style={{ background: '#f3e8ff' }}>
              <h5 className="modal-title"><i className="bi bi-folder-check me-2" style={{ color: '#6f42c1' }}></i>Filing & Archive (Jr. Accountant) — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="p-3 rounded mb-4" style={{ background: '#f8f5ff', border: '1px solid #d8b4fe' }}>
                <div className="row g-2">
                  <div className="col-md-6"><strong>Vendor:</strong> {pr.vendorName}</div>
                  <div className="col-md-6"><strong>Amount:</strong> {formatCurrency(pr.amount, pr.currency)}</div>
                  <div className="col-md-6"><strong>Payment Advice #:</strong> {pr.payment?.paymentAdviceNo || '—'}</div>
                  <div className="col-md-6"><strong>Payment Date:</strong> {formatDate(pr.payment?.paymentDate)}</div>
                  <div className="col-md-6"><strong>Transaction Ref:</strong> {pr.payment?.transactionRef || '—'}</div>
                  <div className="col-md-6"><strong>Paid Via:</strong> {pr.payment?.paymentMethod || '—'}</div>
                </div>
              </div>

              <h6 className="fw-bold mb-3">Archival Checklist</h6>
              <div className="row g-2 mb-4">
                {items.map((item) => (
                  <div key={item.key} className="col-12">
                    <div
                      className={`p-3 rounded border ${checklist[item.key] ? 'border-success' : 'border-secondary'}`}
                      style={{ cursor: 'pointer', background: checklist[item.key] ? '#f0fff4' : '#fff' }}
                      onClick={() => toggle(item.key)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: checklist[item.key] ? '#198754' : '#dee2e6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {checklist[item.key] && <i className="bi bi-check text-white fw-bold" style={{ fontSize: '0.85rem' }}></i>}
                        </div>
                        <div>
                          <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{item.label}</div>
                          <div className="text-muted" style={{ fontSize: '0.76rem' }}>{item.desc}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {!allChecked && (
                <div className="alert alert-warning py-2 mb-3" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-exclamation-triangle me-1"></i>
                  Complete all checklist items to mark the workflow as completed.
                </div>
              )}

              {allChecked && (
                <div className="alert alert-success py-2 mb-3" style={{ fontSize: '0.82rem' }}>
                  <i className="bi bi-check-circle me-1"></i>
                  All items checked. You can now complete the workflow.
                </div>
              )}

              <div>
                <label className="form-label fw-semibold">Notes</label>
                <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Archival notes, reference numbers..." />
              </div>
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={saving || !allChecked}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}
                Mark as Completed
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const FilingQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Junior Accountant (Filing) Queue"
        subtitle="File all original documents, update payment register, archive records and maintain audit trail"
        icon="bi-folder-check"
        stepFilter="pending_filing"
        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-primary" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-archive me-1"></i>Archive
          </button>
        )}
      />
      {selected && (
        <FilingModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default FilingQueuePage;
