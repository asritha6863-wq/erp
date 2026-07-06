import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import paymentRequestService from '../../services/paymentRequestService';
import departmentService from '../../services/departmentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CURRENCIES } from '../../utils/constants';
import { formatCurrency } from '../../utils/formatters';

const UNITS = ['pcs','sets','units','boxes','kg','liters','meters','hours','days','months','subscription','service','license','pack','lot'];
const EMPTY_ITEM = { itemName: '', description: '', quantity: 1, unit: 'pcs', unitPrice: 0 };

const EditRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [files, setFiles]           = useState([]);
  const [form, setForm]             = useState(null);
  const [items, setItems]           = useState([{ ...EMPTY_ITEM }]);

  useEffect(() => {
    Promise.all([
      paymentRequestService.getRequest(id),
      departmentService.getDepartments(),
    ]).then(([prRes, deptRes]) => {
      const pr = prRes.data.data;
      setForm({
        title:      pr.title || '',
        currency:   pr.currency || 'USD',
        costCenter: pr.costCenter || '',
        dueDate:    pr.dueDate?.substring(0, 10) || '',
        notes:      pr.notes || '',
        department: pr.department?._id || '',
      });
      setItems(
        pr.items?.length
          ? pr.items.map((i) => ({ itemName: i.itemName, description: i.description || '', quantity: i.quantity, unit: i.unit || 'pcs', unitPrice: i.unitPrice }))
          : [{ ...EMPTY_ITEM }]
      );
      setDepartments(deptRes.data.data);
    }).catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!form)   return <div className="alert alert-danger">Failed to load request.</div>;

  const setF = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const updateItem = (index, field, value) => {
    setItems(items.map((item, i) => {
      if (i !== index) return item;
      return { ...item, [field]: value };
    }));
  };

  const addItem    = () => setItems([...items, { ...EMPTY_ITEM }]);
  const removeItem = (i) => { if (items.length > 1) setItems(items.filter((_, idx) => idx !== i)); };

  const totalAmount = items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0);

  const handleSave = async (submitAfter = false) => {
    if (!form.title.trim())                       { toast.error('Title is required'); return; }
    if (items.some((i) => !i.itemName.trim()))    { toast.error('All items need a name'); return; }
    if (submitAfter) setSubmitting(true); else setSaving(true);
    try {
      const payload = {
        ...form,
        items: items.map((i) => ({
          itemName:    i.itemName,
          description: i.description || '',
          quantity:    Number(i.quantity),
          unit:        i.unit || 'pcs',
          unitPrice:   Number(i.unitPrice),
          totalPrice:  Number((Number(i.quantity) * Number(i.unitPrice)).toFixed(2)),
        })),
      };
      await paymentRequestService.updateRequest(id, payload);

      if (files.length > 0) {
        const fd = new FormData();
        files.forEach((f) => fd.append('files', f));
        fd.append('documentType', 'supporting');
        try { await paymentRequestService.uploadAttachments(id, fd); }
        catch { toast.warning('Saved but file upload failed'); }
      }

      if (submitAfter) {
        await paymentRequestService.submitRequest(id);
        toast.success('Submitted for approval');
      } else {
        toast.success('Request updated');
      }
      navigate('/my-requests');
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); setSubmitting(false); }
  };

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title"><i className="bi bi-pencil me-2 text-primary"></i>Edit Purchase Request</h1>
            <p className="page-subtitle">Update the request details below</p>
          </div>
          <Link to="/my-requests" className="btn btn-outline-secondary btn-sm"><i className="bi bi-arrow-left me-1"></i>Back</Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          {/* Header fields */}
          <div className="card mb-3">
            <div className="card-header fw-semibold"><i className="bi bi-info-circle me-2 text-primary"></i>Request Details</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label fw-semibold">Request Title / Purpose *</label>
                  <input className="form-control" value={form.title} onChange={setF('title')} required />
                </div>
                <div className="col-md-4">
                  <label className="form-label fw-semibold">Currency</label>
                  <select className="form-select" value={form.currency} onChange={setF('currency')}>
                    {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
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
                  <label className="form-label fw-semibold">Department</label>
                  <select className="form-select" value={form.department} onChange={setF('department')}>
                    <option value="">Select department</option>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Notes</label>
                  <input className="form-control" value={form.notes} onChange={setF('notes')} placeholder="Additional notes..." />
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold"><i className="bi bi-list-ul me-2 text-primary"></i>Items</span>
              <button className="btn btn-sm btn-outline-primary" onClick={addItem}><i className="bi bi-plus-lg me-1"></i>Add Item</button>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0" style={{ minWidth: 650 }}>
                  <thead className="table-light">
                    <tr><th>Item Name *</th><th>Description</th><th style={{ width: 75 }}>Qty</th><th style={{ width: 110 }}>Unit</th><th style={{ width: 120 }}>Unit Price</th><th style={{ width: 110 }}>Total</th><th style={{ width: 50 }}></th></tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx}>
                        <td><input className="form-control form-control-sm" value={item.itemName} onChange={(e) => updateItem(idx, 'itemName', e.target.value)} /></td>
                        <td><input className="form-control form-control-sm" value={item.description} onChange={(e) => updateItem(idx, 'description', e.target.value)} /></td>
                        <td><input type="number" className="form-control form-control-sm" value={item.quantity} min={1} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} /></td>
                        <td>
                          <select className="form-select form-select-sm" value={item.unit} onChange={(e) => updateItem(idx, 'unit', e.target.value)}>
                            {UNITS.map((u) => <option key={u}>{u}</option>)}
                          </select>
                        </td>
                        <td><input type="number" className="form-control form-control-sm" value={item.unitPrice} min={0} step="0.01" onChange={(e) => updateItem(idx, 'unitPrice', e.target.value)} /></td>
                        <td className="fw-semibold text-end pe-3" style={{ fontSize: '0.85rem' }}>{formatCurrency(Number(item.quantity) * Number(item.unitPrice), form.currency)}</td>
                        <td><button className="btn btn-sm btn-outline-danger" onClick={() => removeItem(idx)} disabled={items.length === 1}><i className="bi bi-trash"></i></button></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="table-light">
                    <tr>
                      <td colSpan={5} className="text-end fw-bold">Total:</td>
                      <td className="fw-bold text-primary">{formatCurrency(totalAmount, form.currency)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>

          {/* File upload */}
          <div className="card">
            <div className="card-header fw-semibold"><i className="bi bi-paperclip me-2 text-primary"></i>Add Documents</div>
            <div className="card-body">
              <input type="file" multiple className="form-control" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => setFiles(Array.from(e.target.files))} />
              {files.length > 0 && <div className="mt-2 text-muted" style={{ fontSize: '0.82rem' }}>{files.length} file(s) selected</div>}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="col-lg-4">
          <div className="card sticky-top" style={{ top: 75 }}>
            <div className="card-header fw-semibold"><i className="bi bi-receipt me-2 text-primary"></i>Summary</div>
            <div className="card-body">
              <div className="p-3 rounded mb-3" style={{ background: '#f0f4ff' }}>
                <div className="text-muted mb-1" style={{ fontSize: '0.75rem' }}>Total Amount</div>
                <div className="fw-bold text-primary" style={{ fontSize: '1.6rem' }}>{formatCurrency(totalAmount, form.currency)}</div>
              </div>
              <div className="mb-2" style={{ fontSize: '0.88rem' }}><strong>Items:</strong> {items.length}</div>
              <div className="mb-3" style={{ fontSize: '0.88rem' }}><strong>Documents:</strong> {files.length} new file(s)</div>
              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : <><i className="bi bi-floppy me-2"></i>Save Draft</>}
                </button>
                <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send me-2"></i>Save &amp; Submit</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditRequestPage;
