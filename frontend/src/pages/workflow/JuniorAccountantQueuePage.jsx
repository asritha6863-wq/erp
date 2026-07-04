import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import ApprovalQueueBase from '../../components/ApprovalQueueBase';
import approvalService from '../../services/approvalService';
import { formatCurrency, formatDate } from '../../utils/formatters';

// ── PO + Vendor + Quotation Modal ────────────────────────────────────────────
const POModal = ({ pr, onClose, onDone }) => {
  const today = new Date().toISOString().substring(0, 10);
  const [tab, setTab]     = useState('vendor');
  const [saving, setSaving] = useState(false);

  // Vendor
  const [vendor, setVendor] = useState({ vendorName: '', vendorCode: '', contactPerson: '', email: '', phone: '', address: '', bankName: '', bankAccount: '', taxNumber: '' });

  // PO
  const [po, setPo] = useState({ poDate: today, deliveryDate: '', paymentTerms: 'Net 30', deliveryTerms: 'FOB Destination', poNotes: '' });

  // Quotation
  const [qItems, setQItems]   = useState(
    (pr.items || []).map((i) => ({ itemName: i.itemName, quantity: i.quantity, unitPrice: i.unitPrice, totalPrice: i.totalPrice }))
  );
  const [taxRate, setTaxRate]   = useState(5);
  const [qTerms, setQTerms]     = useState('Payment within 30 days of invoice');
  const [quotationDate, setQDate] = useState(today);
  const [validUntil, setValid]    = useState('');

  const setV = (f) => (e) => setVendor({ ...vendor, [f]: e.target.value });
  const setP = (f) => (e) => setPo({ ...po, [f]: e.target.value });

  const updateQItem = (idx, field, val) => {
    const updated = qItems.map((it, i) => {
      if (i !== idx) return it;
      const newIt = { ...it, [field]: Number(val) };
      if (field === 'quantity' || field === 'unitPrice') {
        newIt.totalPrice = Number(((field === 'quantity' ? Number(val) : it.quantity) * (field === 'unitPrice' ? Number(val) : it.unitPrice)).toFixed(2));
      }
      return newIt;
    });
    setQItems(updated);
  };

  const subtotal   = qItems.reduce((s, i) => s + (i.totalPrice || 0), 0);
  const taxAmount  = parseFloat(((subtotal * taxRate) / 100).toFixed(2));
  const grandTotal = parseFloat((subtotal + taxAmount).toFixed(2));

  const tabs = [
    { id: 'vendor',    label: 'Vendor Details',   icon: 'bi-building' },
    { id: 'po',        label: 'Purchase Order',    icon: 'bi-file-earmark-text' },
    { id: 'quotation', label: 'Quotation',         icon: 'bi-receipt' },
    { id: 'review',    label: 'Review & Submit',   icon: 'bi-check2-all' },
  ];

  const handleSubmit = async () => {
    if (!vendor.vendorName.trim()) { toast.error('Vendor name is required'); setTab('vendor'); return; }
    setSaving(true);
    try {
      await approvalService.processApproval({
        paymentRequestId: pr._id,
        action: 'forwarded',
        comments: `PO created. Vendor: ${vendor.vendorName}. Quotation total: ${grandTotal}`,
        stepData: {
          ...vendor,
          poDate: po.poDate, deliveryDate: po.deliveryDate, paymentTerms: po.paymentTerms,
          deliveryTerms: po.deliveryTerms, poNotes: po.poNotes,
          quotationDate, validUntil, quotationItems: qItems,
          taxRate, terms: qTerms,
        },
      });
      toast.success('PO & Quotation created. Forwarded to Senior Accountant.');
      onDone(); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-xl modal-dialog-scrollable">
          <div className="modal-content">
            <div className="modal-header">
              <div>
                <h5 className="modal-title mb-0"><i className="bi bi-calculator me-2 text-primary"></i>Create PO &amp; Quotation — {pr.requestNumber}</h5>
                <div className="text-muted" style={{ fontSize: '0.82rem' }}>{pr.title} · {formatCurrency(pr.totalAmount, pr.currency)}</div>
              </div>
              <button className="btn-close" onClick={onClose}></button>
            </div>

            {/* Request items summary */}
            <div className="px-4 pt-3">
              <div className="p-3 rounded mb-3" style={{ background: '#f0f4ff', border: '1px solid #c7d7fe' }}>
                <div className="fw-semibold mb-2" style={{ fontSize: '0.85rem' }}><i className="bi bi-list-ul me-1"></i>Requested Items</div>
                <div className="table-responsive">
                  <table className="table table-sm mb-0" style={{ fontSize: '0.82rem' }}>
                    <thead><tr><th>Item</th><th>Description</th><th>Qty</th><th>Unit</th></tr></thead>
                    <tbody>
                      {(pr.items || []).map((it, i) => (
                        <tr key={i}><td>{it.itemName}</td><td>{it.description || '—'}</td><td>{it.quantity}</td><td>{it.unit}</td></tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tab nav */}
              <ul className="nav nav-tabs mb-3">
                {tabs.map((t) => (
                  <li key={t.id} className="nav-item">
                    <button className={`nav-link ${tab === t.id ? 'active' : ''}`} onClick={() => setTab(t.id)}>
                      <i className={`bi ${t.icon} me-1`}></i>{t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="modal-body pt-0">

              {/* ── Vendor Tab ── */}
              {tab === 'vendor' && (
                <div className="row g-3">
                  <div className="col-12"><h6 className="fw-bold text-primary"><i className="bi bi-building me-2"></i>Vendor Information</h6></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Vendor Name *</label><input className="form-control" value={vendor.vendorName} onChange={setV('vendorName')} placeholder="e.g. TechSupply Co." /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Vendor Code</label><input className="form-control" value={vendor.vendorCode} onChange={setV('vendorCode')} placeholder="e.g. VS-001" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Contact Person</label><input className="form-control" value={vendor.contactPerson} onChange={setV('contactPerson')} placeholder="Full name" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Email</label><input type="email" className="form-control" value={vendor.email} onChange={setV('email')} placeholder="vendor@company.com" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Phone</label><input className="form-control" value={vendor.phone} onChange={setV('phone')} placeholder="+1-555-0000" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Tax Number</label><input className="form-control" value={vendor.taxNumber} onChange={setV('taxNumber')} placeholder="TX-XXXXX" /></div>
                  <div className="col-12"><label className="form-label fw-semibold">Address</label><textarea className="form-control" rows={2} value={vendor.address} onChange={setV('address')} placeholder="Full address" /></div>
                  <div className="col-12"><h6 className="fw-bold text-primary mt-2"><i className="bi bi-bank me-2"></i>Bank Details</h6></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Bank Name</label><input className="form-control" value={vendor.bankName} onChange={setV('bankName')} placeholder="e.g. First National Bank" /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Account Number</label><input className="form-control" value={vendor.bankAccount} onChange={setV('bankAccount')} placeholder="e.g. ****4821" /></div>
                  <div className="col-12 d-flex justify-content-end">
                    <button className="btn btn-primary" onClick={() => setTab('po')}>Next: Purchase Order <i className="bi bi-arrow-right ms-1"></i></button>
                  </div>
                </div>
              )}

              {/* ── PO Tab ── */}
              {tab === 'po' && (
                <div className="row g-3">
                  <div className="col-12"><h6 className="fw-bold text-primary"><i className="bi bi-file-earmark-text me-2"></i>Purchase Order Details</h6>
                    <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.8rem' }}><i className="bi bi-info-circle me-1"></i>PO number will be auto-generated by the system.</div>
                  </div>
                  <div className="col-md-6"><label className="form-label fw-semibold">PO Date *</label><input type="date" className="form-control" value={po.poDate} onChange={setP('poDate')} /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Expected Delivery Date</label><input type="date" className="form-control" value={po.deliveryDate} onChange={setP('deliveryDate')} /></div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Payment Terms</label>
                    <select className="form-select" value={po.paymentTerms} onChange={setP('paymentTerms')}>
                      {['Net 15','Net 30','Net 45','Net 60','Advance','50% Advance','COD'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-md-6"><label className="form-label fw-semibold">Delivery Terms</label>
                    <select className="form-select" value={po.deliveryTerms} onChange={setP('deliveryTerms')}>
                      {['FOB Destination','FOB Origin','CIF','EXW','DDP','Digital Delivery'].map((t) => <option key={t}>{t}</option>)}
                    </select>
                  </div>
                  <div className="col-12"><label className="form-label fw-semibold">Notes</label><textarea className="form-control" rows={2} value={po.poNotes} onChange={setP('poNotes')} placeholder="Any additional PO notes..." /></div>
                  <div className="col-12 d-flex justify-content-between">
                    <button className="btn btn-outline-secondary" onClick={() => setTab('vendor')}><i className="bi bi-arrow-left me-1"></i>Back</button>
                    <button className="btn btn-primary" onClick={() => setTab('quotation')}>Next: Quotation <i className="bi bi-arrow-right ms-1"></i></button>
                  </div>
                </div>
              )}

              {/* ── Quotation Tab ── */}
              {tab === 'quotation' && (
                <div>
                  <div className="row g-3 mb-3">
                    <div className="col-12"><h6 className="fw-bold text-primary"><i className="bi bi-receipt me-2"></i>Quotation Details</h6>
                      <div className="alert alert-info py-2 mb-0" style={{ fontSize: '0.8rem' }}><i className="bi bi-info-circle me-1"></i>Quotation number will be auto-generated. Edit prices from the vendor's quote.</div>
                    </div>
                    <div className="col-md-4"><label className="form-label fw-semibold">Quotation Date</label><input type="date" className="form-control" value={quotationDate} onChange={(e) => setQDate(e.target.value)} /></div>
                    <div className="col-md-4"><label className="form-label fw-semibold">Valid Until</label><input type="date" className="form-control" value={validUntil} onChange={(e) => setValid(e.target.value)} /></div>
                    <div className="col-md-4"><label className="form-label fw-semibold">Tax Rate (%)</label><input type="number" className="form-control" value={taxRate} min={0} max={100} onChange={(e) => setTaxRate(Number(e.target.value))} /></div>
                  </div>

                  <div className="table-responsive mb-3">
                    <table className="table table-bordered" style={{ fontSize: '0.85rem' }}>
                      <thead className="table-light">
                        <tr><th>Item Name</th><th style={{ width: 90 }}>Qty</th><th style={{ width: 130 }}>Unit Price</th><th style={{ width: 130 }}>Total</th></tr>
                      </thead>
                      <tbody>
                        {qItems.map((it, i) => (
                          <tr key={i}>
                            <td>{it.itemName}</td>
                            <td><input type="number" className="form-control form-control-sm" value={it.quantity} min={1} onChange={(e) => updateQItem(i, 'quantity', e.target.value)} /></td>
                            <td><input type="number" className="form-control form-control-sm" value={it.unitPrice} min={0} step="0.01" onChange={(e) => updateQItem(i, 'unitPrice', e.target.value)} /></td>
                            <td className="fw-semibold">{formatCurrency(it.totalPrice || 0, pr.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr><td colSpan={3} className="text-end fw-semibold">Subtotal</td><td className="fw-semibold">{formatCurrency(subtotal, pr.currency)}</td></tr>
                        <tr><td colSpan={3} className="text-end fw-semibold">Tax ({taxRate}%)</td><td className="fw-semibold">{formatCurrency(taxAmount, pr.currency)}</td></tr>
                        <tr><td colSpan={3} className="text-end fw-bold text-primary">Grand Total</td><td className="fw-bold text-primary fs-6">{formatCurrency(grandTotal, pr.currency)}</td></tr>
                      </tfoot>
                    </table>
                  </div>

                  <div className="mb-3"><label className="form-label fw-semibold">Terms &amp; Conditions</label>
                    <textarea className="form-control" rows={2} value={qTerms} onChange={(e) => setQTerms(e.target.value)} />
                  </div>
                  <div className="d-flex justify-content-between">
                    <button className="btn btn-outline-secondary" onClick={() => setTab('po')}><i className="bi bi-arrow-left me-1"></i>Back</button>
                    <button className="btn btn-primary" onClick={() => setTab('review')}>Review &amp; Submit <i className="bi bi-arrow-right ms-1"></i></button>
                  </div>
                </div>
              )}

              {/* ── Review Tab ── */}
              {tab === 'review' && (
                <div className="row g-3">
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-header fw-semibold" style={{ fontSize: '0.85rem' }}><i className="bi bi-building me-2"></i>Vendor</div>
                      <div className="card-body" style={{ fontSize: '0.85rem' }}>
                        <div><strong>{vendor.vendorName || '—'}</strong></div>
                        {vendor.contactPerson && <div>Contact: {vendor.contactPerson}</div>}
                        {vendor.email && <div>Email: {vendor.email}</div>}
                        {vendor.phone && <div>Phone: {vendor.phone}</div>}
                        {vendor.bankName && <div>Bank: {vendor.bankName} {vendor.bankAccount}</div>}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border">
                      <div className="card-header fw-semibold" style={{ fontSize: '0.85rem' }}><i className="bi bi-file-earmark-text me-2"></i>Purchase Order</div>
                      <div className="card-body" style={{ fontSize: '0.85rem' }}>
                        <div>PO Date: {formatDate(po.poDate)}</div>
                        <div>Delivery: {po.deliveryDate ? formatDate(po.deliveryDate) : '—'}</div>
                        <div>Payment Terms: {po.paymentTerms}</div>
                        <div>Delivery Terms: {po.deliveryTerms}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="card border">
                      <div className="card-header fw-semibold" style={{ fontSize: '0.85rem' }}><i className="bi bi-receipt me-2"></i>Quotation Summary</div>
                      <div className="card-body" style={{ fontSize: '0.85rem' }}>
                        <div className="row">
                          <div className="col-md-8">
                            {qItems.map((it, i) => <div key={i} className="d-flex justify-content-between border-bottom py-1"><span>{it.itemName} × {it.quantity}</span><span>{formatCurrency(it.totalPrice, pr.currency)}</span></div>)}
                          </div>
                          <div className="col-md-4">
                            <div className="d-flex justify-content-between"><span>Subtotal:</span><span>{formatCurrency(subtotal, pr.currency)}</span></div>
                            <div className="d-flex justify-content-between"><span>Tax ({taxRate}%):</span><span>{formatCurrency(taxAmount, pr.currency)}</span></div>
                            <div className="d-flex justify-content-between fw-bold text-primary border-top pt-1"><span>Grand Total:</span><span>{formatCurrency(grandTotal, pr.currency)}</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-2">
                      <i className="bi bi-eye me-1"></i>View Full Request
                    </Link>
                  </div>
                  <div className="col-12 d-flex justify-content-between">
                    <button className="btn btn-outline-secondary" onClick={() => setTab('quotation')}><i className="bi bi-arrow-left me-1"></i>Back</button>
                    <button className="btn btn-success" onClick={handleSubmit} disabled={saving}>
                      {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-send me-2"></i>}
                      Create PO &amp; Forward to Sr. Accountant
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

// ── Filing Modal (Step 8) ─────────────────────────────────────────────────────
const FilingModal = ({ pr, onClose, onDone }) => {
  const [checklist, setChecklist] = useState({ documentsArchived: false, paymentRegisterUpdated: false, digitalCopyUploaded: false, auditTrailVerified: false });
  const [notes, setNotes]   = useState('');
  const [saving, setSaving] = useState(false);
  const allChecked = Object.values(checklist).every(Boolean);
  const toggle = (k) => setChecklist((p) => ({ ...p, [k]: !p[k] }));
  const ITEMS = [
    { key: 'documentsArchived',      label: 'Original documents physically filed', desc: 'All PO, GRN, Quotation, Invoice archived' },
    { key: 'paymentRegisterUpdated', label: 'Payment register updated',            desc: 'Transaction recorded in payment register' },
    { key: 'digitalCopyUploaded',    label: 'Digital copies archived',             desc: 'Electronic copies stored in system' },
    { key: 'auditTrailVerified',     label: 'Audit trail complete',                desc: 'All approval steps documented' },
  ];
  const handleSubmit = async () => {
    if (!allChecked) { toast.error('Complete all checklist items first'); return; }
    setSaving(true);
    try {
      await approvalService.processApproval({ paymentRequestId: pr._id, action: 'approved', comments: notes || 'All documents archived successfully', stepData: { checklist, notes } });
      toast.success('Workflow completed! All documents archived.');
      onDone(); onClose();
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };
  return (
    <>
      <div className="modal fade show d-block" tabIndex="-1" style={{ zIndex: 1055 }}>
        <div className="modal-dialog modal-lg modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header" style={{ background: '#f3e8ff' }}>
              <h5 className="modal-title"><i className="bi bi-folder-check me-2" style={{ color: '#6f42c1' }}></i>Filing &amp; Archive — {pr.requestNumber}</h5>
              <button className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="p-3 rounded mb-3" style={{ background: '#faf8ff', border: '1px solid #d8b4fe' }}>
                <div className="row g-2" style={{ fontSize: '0.85rem' }}>
                  <div className="col-md-6"><strong>Title:</strong> {pr.title}</div>
                  <div className="col-md-6"><strong>Amount:</strong> {formatCurrency(pr.totalAmount, pr.currency)}</div>
                  <div className="col-md-6"><strong>PO #:</strong> {pr.purchaseOrder?.poNumber || '—'}</div>
                  <div className="col-md-6"><strong>Payment Advice #:</strong> {pr.payment?.paymentAdviceNo || '—'}</div>
                  <div className="col-md-6"><strong>Vendor:</strong> {pr.vendor?.vendorName || '—'}</div>
                  <div className="col-md-6"><strong>Payment Date:</strong> {formatDate(pr.payment?.paymentDate)}</div>
                </div>
              </div>
              <h6 className="fw-bold mb-3">Archival Checklist</h6>
              <div className="row g-2 mb-3">
                {ITEMS.map((item) => (
                  <div key={item.key} className="col-12">
                    <div className={`p-3 rounded border ${checklist[item.key] ? 'border-success bg-light' : 'border-secondary'}`} style={{ cursor: 'pointer' }} onClick={() => toggle(item.key)}>
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
              {allChecked && <div className="alert alert-success py-2" style={{ fontSize: '0.82rem' }}><i className="bi bi-check-circle me-1"></i>All items checked. Ready to complete.</div>}
              <label className="form-label fw-semibold">Notes</label>
              <textarea className="form-control" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Archival reference numbers, notes..." />
            </div>
            <div className="modal-footer">
              <Link to={`/payment-requests/${pr._id}`} target="_blank" className="btn btn-outline-primary me-auto"><i className="bi bi-eye me-1"></i>View Details</Link>
              <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button className="btn btn-success" onClick={handleSubmit} disabled={saving || !allChecked}>
                {saving ? <span className="spinner-border spinner-border-sm me-2"></span> : <i className="bi bi-check-circle me-2"></i>}Mark as Completed
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
    </>
  );
};

// ── Main Queue Page ───────────────────────────────────────────────────────────
const JuniorAccountantQueuePage = () => {
  const [selected, setSelected] = useState(null);
  const [mode, setMode]         = useState(null); // 'po' | 'filing'
  const [refresh, setRefresh]   = useState(null);

  const open = (pr, m, refetch) => { setSelected(pr); setMode(m); setRefresh(() => refetch); };
  const close = () => { setSelected(null); setMode(null); };
  const done  = () => { refresh && refresh(); };

  return (
    <>
      <ApprovalQueueBase
        title="Junior Accountant Queue"
        subtitle="Step 2: Create PO & Quotation for approved requests · Step 8: File & Archive completed payments"
        icon="bi-calculator"
        stepFilter={null}
        renderActions={(pr, refetch) => {
          if (pr.currentStep === 'pending_junior_accountant') {
            return (
              <button className="btn btn-sm btn-primary" onClick={() => open(pr, 'po', refetch)}>
                <i className="bi bi-file-earmark-plus me-1"></i>Create PO
              </button>
            );
          }
          if (pr.currentStep === 'pending_filing') {
            return (
              <button className="btn btn-sm btn-success" onClick={() => open(pr, 'filing', refetch)}>
                <i className="bi bi-archive me-1"></i>Archive
              </button>
            );
          }
          return null;
        }}
      />

      {selected && mode === 'po'     && <POModal     pr={selected} onClose={close} onDone={done} />}
      {selected && mode === 'filing' && <FilingModal pr={selected} onClose={close} onDone={done} />}
    </>
  );
};

export default JuniorAccountantQueuePage;
