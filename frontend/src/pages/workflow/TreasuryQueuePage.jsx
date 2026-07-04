import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import paymentService from '../../services/paymentService';
import { formatCurrency, formatDate } from '../../utils/formatters';

const PAYMENT_METHODS = [
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'cheque',        label: 'Cheque' },
  { value: 'cash',          label: 'Cash' },
  { value: 'online',        label: 'Online Payment' },
  { value: 'card',          label: 'Card' },
];

const TreasuryModal = ({ pr, onClose, onDone }) => {
  const today = new Date().toISOString().substring(0, 10);
  const [form, setForm] = useState({
    paymentMethod: 'bank_transfer',
    bankName: '',
    accountNumber: '',
    transactionRef: '',
    paymentDate: today,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  const set = (f) => (e) => setForm({ ...form, [f]: e.target.value });

  const handleSubmit = async () => {
    if (!form.paymentMethod || !form.paymentDate) { toast.error('Payment method and date are required'); return; }
    if (form.paymentMethod === 'bank_transfer' && !form.transactionRef.trim()) { toast.error('Transaction reference is required for bank transfer'); return; }
    setSaving(true);
    try {
      await paymentService.processPayment({ paymentRequestId: pr._id, ...form });
      toast.success('Payment processed successfully! Payment advice generated.');
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
            <div className="modal-header" style={{ background: '#e8f5e9' }}>
              <h5 className="modal-title"><i className="bi bi-bank me-2 text-success"></i>Process Payment (Sr. Accountant Treasury) — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              {/* Payment Summary */}
              <div className="p-3 rounded mb-4 text-white" style={{ background: 'linear-gradient(135deg,#198754,#20c997)' }}>
                <div className="row g-2">
                  <div className="col-md-6">
                    <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>Vendor</div>
                    <div className="fw-bold">{pr.vendorName}</div>
                  </div>
                  <div className="col-md-6">
                    <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>Payment Amount</div>
                    <div className="fw-bold fs-4">{formatCurrency(pr.amount, pr.currency)}</div>
                  </div>
                  <div className="col-md-6">
                    <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>Invoice #</div>
                    <div className="fw-semibold">{pr.invoiceNumber}</div>
                  </div>
                  <div className="col-md-6">
                    <div style={{ opacity: 0.8, fontSize: '0.75rem' }}>Due Date</div>
                    <div className="fw-semibold">{formatDate(pr.dueDate)}</div>
                  </div>
                </div>
              </div>

              <h6 className="fw-bold mb-3">Payment Details</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Method *</label>
                  <select className="form-select" value={form.paymentMethod} onChange={set('paymentMethod')}>
                    {PAYMENT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Date *</label>
                  <input type="date" className="form-control" value={form.paymentDate} onChange={set('paymentDate')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Bank Name</label>
                  <input className="form-control" value={form.bankName} onChange={set('bankName')} placeholder="e.g. First National Bank" />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Account Number</label>
                  <input className="form-control" value={form.accountNumber} onChange={set('accountNumber')} placeholder="e.g. ****4821" />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Transaction Reference {form.paymentMethod === 'bank_transfer' ? '*' : ''}</label>
                  <input className="form-control" value={form.transactionRef} onChange={set('transactionRef')} placeholder="e.g. TXN-2024-001" />
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Notes</label>
                  <textarea className="form-control" rows={2} value={form.notes} onChange={set('notes')} placeholder="Payment confirmation notes..." />
                </div>
              </div>

              <div className="alert alert-info mt-3 py-2 mb-0" style={{ fontSize: '0.82rem' }}>
                <i className="bi bi-info-circle me-1"></i>
                Processing this payment will generate a <strong>Payment Advice</strong> and forward to the Filing Officer for archival.
              </div>
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto">
                <i className="bi bi-eye me-1"></i>View Full Details
              </Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-bank me-2"></i>}
                Process Payment
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

const TreasuryQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [refresh, setRefresh]   = useState(null);

  return (
    <>
      <ApprovalQueueBase
        title="Senior Accountant (Treasury) Queue"
        subtitle="Process approved payments through bank or cheque and generate payment advice"
        icon="bi-bank"
        stepFilter="pending_treasury"        renderActions={(pr, refetch) => (
          <button className="btn btn-sm btn-success" onClick={() => { setSelected(pr); setRefresh(() => refetch); }}>
            <i className="bi bi-bank me-1"></i>Process
          </button>
        )}
      />
      {selected && (
        <TreasuryModal pr={selected} onClose={() => setSelected(null)} onDone={() => refresh && refresh()} />
      )}
    </>
  );
};

export default TreasuryQueuePage;
