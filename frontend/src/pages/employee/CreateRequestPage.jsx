import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import paymentRequestService from '../../services/paymentRequestService';
import departmentService from '../../services/departmentService';
import { useAuth } from '../../context/AuthContext';
import { CURRENCIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const EMPTY_ITEM = { itemName: '', description: '', quantity: 1, unit: 'pcs', unitPrice: 0 };
const UNITS = ['pcs', 'sets', 'units', 'boxes', 'kg', 'liters', 'meters', 'hours', 'days', 'months', 'subscription', 'service', 'license', 'pack', 'lot'];

const CreateRequestPage = () => {
  const { user } = useAuth();
  const navigate  = useNavigate();
  const [saving, setSaving]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [files, setFiles]           = useState([]);
  const [form, setForm] = useState({
    title: '', currency: 'USD', costCenter: '', dueDate: '', notes: '',
    department: user.department?._id || user.department || '',
  });
  const [items, setItems] = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    departmentService.getDepartments().then((r) => setDepartments(r.data.data));
  }, []);

  const setF = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  // ── Item helpers ────────────────────────────────────────────────────────────
  const updateItem = (index, field, value) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitPrice') {
        newItem.quantity  = field === 'quantity'  ? Number(value) : Number(item.quantity);
        newItem.unitPrice = field === 'unitPrice' ? Number(value) : Number(item.unitPrice);
      }
      return newItem;
    });
    setItems(updated);
  };

  const addItem    = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);

  // ── Save / Submit ───────────────────────────────────────────────────────────
  const handleSave = async (submitAfter = false) => {
    if (!form.title.trim()) { toast.error('Request title is required'); return; }
    if (items.some((i) => !i.itemName.trim())) { toast.error('All items must have a name'); return; }
    if (items.some((i) => Number(i.quantity) <= 0 || Number(i.unitPrice) < 0)) {
      toast.error('All items must have valid quantity and unit price'); return;
    }

    if (submitAfter) setSubmitting(true); else setSaving(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          itemName:   i.itemName,
          description: i.description || '',
          quantity:   Number(i.quantity),
          unit:       i.unit || 'pcs',
          unitPrice:  Number(i.unitPrice),
          totalPrice: Number((Number(i.quantity) * Number(i.unitPrice)).toFixed(2)),
        })),
      };
      const res = await paymentRequestService.createRequest(payload);
      const pr  = res.data.data;
      toast.success('Payment request created');

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        fd.append('documentType', 'supporting');
        try { await paymentRequestService.uploadAttachments(pr._id, fd); }
        catch { toast.warning('Request created but file upload failed'); }
      }

      if (submitAfter) {
        await paymentRequestService.submitRequest(pr._id);
        toast.success('Submitted for Department Head approval');
      }
      navigate('/my-requests');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header px-0">
        <h1 className="page-title"><i className="bi bi-file-earmark-plus me-2 text-primary"></i>New Purchase Request</h1>
        <p className="page-subtitle">Enter the items you need to purchase and submit for approval</p>
      </div>

      <div className="row g-3">
        {/* ── Main form ── */}
        <div className="col-lg-8">

          {/* Request header */}
          <div className="card mb-3">
            <div className="card-header fw-semibold"><i className="bi bi-info-circle me-2 text-primary"></i>Request Details</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Requirment</label>
                  <input className="form-control" value={form.title} onChange={setF('title')} placeholder="e.g. Office Equipment Purchase for New Team Members" required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Currency</label>
                    <select className="form-select"value={form.currency} onChange={setF('currency')}>  
                    <option value="INR">INR (Indian Rupee)</option>
                    <option value="AED">AED (UAE Dirham)</option>
                  </select>
                </div>
                  <div className="col-md-4">
                  <label className="form-label fw-semibold">Cost Center</label>
                  <input className="form-control" value={form.costCenter} onChange={setF('costCenter')} placeholder="e.g. CC-001" />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Required By Date</label>
                  <input type="date" className="form-control" value={form.dueDate} onChange={setF('dueDate')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Department *</label>
                  <select className="form-select" value={form.department} onChange={setF('department')} required>
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Purpose</label>
                  <input className="form-control" value={form.notes} onChange={setF('notes')} placeholder="Any special instructions..." />
                </div>
              </div>
            </div>
          </div>

          {/* Items table */}
          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold"><i className="bi bi-list-ul me-2 text-primary"></i>Items to Purchase</span>
              <button className="btn btn-sm btn-outline-primary" onClick={addItem}>
                <i className="bi bi-plus-lg me-1"></i>Add Item
              </button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0" style={{ minWidth: 700 }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ minWidth: 160 }}>Item Name *</th>
                      <th style={{ minWidth: 150 }}>Description</th>
                      <th style={{ width: 80 }}>Qty *</th>
                      <th style={{ width: 100 }}>Unit</th>
                      <th style={{ width: 120 }}>Unit Price *</th>
                      <th style={{ width: 120 }}>Total</th>
                      <th style={{ width: 50 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td>
                          <input className="form-control form-control-sm" value={item.itemName}
                            onChange={(e) => updateItem(idx, 'itemName', e.target.value)} placeholder="Item name" />
                        </td>
                        <td>
                          <input className="form-control form-control-sm" value={item.description}
                            onChange={(e) => updateItem(idx, 'description', e.target.value)} placeholder="Optional" />
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm" value={item.quantity} min={1}
                            onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
                        </td>
                        <td>
                          <select className="form-select form-select-sm" value={item.unit}
                            onChange={(e) => updateItem(idx, 'unit', e.target.value)}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td>
                          <input type="number" className="form-control form-control-sm" value={item.unitPrice} min={0} step="0.01"
                            onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} />
                        </td>
                        <td className="fw-semibold text-end pe-3" style={{ fontSize: '0.88rem' }}>
                          {formatCurrency(Number(item.quantity) * Number(item.unitPrice), form.currency)}
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)} disabled={items.length === 1}>
                            <i className="bi bi-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan={5} className="text-end fw-bold pe-3">Total Amount:</td>
                      <td className="fw-bold text-primary" style={{ fontSize: '1rem' }}>{formatCurrency(totalAmount, form.currency)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div className="card">
            <div className="card-header fw-semibold"><i className="bi bi-paperclip me-2 text-primary"></i>Supporting Documents</div>
            <div className="card-body">
              <div className="border border-dashed rounded p-4 text-center" style={{ cursor: 'pointer', background: '#f8f9fa' }}
                onClick={() => document.getElementById('fileInput').click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); setFiles((p) => [...p, ...Array.from(e.dataTransfer.files)]); }}>
                <i className="bi bi-cloud-upload text-primary" style={{ fontSize: '2rem' }}></i>
                <p className="mb-1 mt-2 fw-semibold">Drag & drop or click to browse</p>
                <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>PDF, Word, Excel, Images — Max 10MB each</p>
                <input id="fileInput" type="file" multiple className="d-none" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                  onChange={(e) => setFiles((p) => [...p, ...Array.from(e.target.files)])} />
              </div>
              {files.length > 0 && (
                <div className="mt-3">
                  {files.map((f, i) => (
                    <div key={i} className="d-flex align-items-center justify-content-between py-1 border-bottom">
                      <div className="d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark text-primary"></i>
                        <span style={{ fontSize: '0.85rem' }}>{f.name}</span>
                        <span className="text-muted" style={{ fontSize: '0.75rem' }}>({(f.size/1024).toFixed(0)} KB)</span>
                      </div>
                      <button className="btn btn-sm btn-link text-danger p-0" onClick={() => setFiles((p) => p.filter((_,j) => j!==i))}>
                        <i className="bi bi-x-circle"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Sidebar summary ── */}
        <div className="col-lg-4">
          <div className="card sticky-top" style={{ top: 75 }}>
            <div className="card-header fw-semibold"><i className="bi bi-receipt me-2 text-primary"></i>Summary</div>
            <div className="card-body">
              <div className="p-3 rounded mb-3" style={{ background: '#f0f4ff' }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Total Request Amount</div>
                <div className="fw-bold text-primary" style={{ fontSize: '1.8rem' }}>
                  {form.currency} {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>
              <div className="mb-2" style={{ fontSize: '0.88rem' }}><strong>Title:</strong> {form.title || '—'}</div>
              <div className="mb-2" style={{ fontSize: '0.88rem' }}><strong>Items:</strong> {items.length} line item(s)</div>
              <div className="mb-2" style={{ fontSize: '0.88rem' }}><strong>Cost Center:</strong> {form.costCenter || '—'}</div>
              <div className="mb-3" style={{ fontSize: '0.88rem' }}><strong>Documents:</strong> {files.length} file(s)</div>

              <div className="alert alert-info py-2 mb-3" style={{ fontSize: '0.78rem' }}>
                <i className="bi bi-diagram-3 me-1"></i>
                After submission: <strong>Dept. Head</strong> → <strong>Jr. Accountant</strong> (creates PO &amp; Quotation) → Sr. Accountant → Budget Control → Finance Manager → Payment
              </div>

              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-floppy me-2"></i>Save Draft</>}
                </button>
                <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send me-2"></i>Submit for Approval</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRequestPage;
