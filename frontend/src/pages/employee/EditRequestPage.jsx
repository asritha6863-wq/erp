import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import paymentRequestService from '../../services/paymentRequestService';
import departmentService from '../../services/departmentService';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CURRENCIES } from '../../utils/constants';

const EditRequestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [files, setFiles]       = useState([]);
  const [form, setForm]         = useState(null);

  useEffect(() => {
    Promise.all([
      paymentRequestService.getRequest(id),
      departmentService.getDepartments(),
    ]).then(([prRes, deptRes]) => {
      const pr = prRes.data.data;
      setForm({
        vendorName: pr.vendorName, invoiceNumber: pr.invoiceNumber,
        invoiceDate: pr.invoiceDate?.substring(0,10) || '',
        poNumber: pr.poNumber || '', grnNumber: pr.grnNumber || '',
        amount: pr.amount, currency: pr.currency,
        description: pr.description, costCenter: pr.costCenter || '',
        dueDate: pr.dueDate?.substring(0,10) || '',
        paymentTerms: pr.paymentTerms || '',
        department: pr.department?._id || '',
      });
      setDepartments(deptRes.data.data);
    }).catch(() => toast.error('Failed to load request'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!form) return <div className="alert alert-danger">Failed to load request.</div>;

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleSave = async (submitAfter = false) => {
    if (submitAfter) setSubmitting(true); else setSaving(true);
    try {
      await paymentRequestService.updateRequest(id, form);

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
            <h1 className="page-title"><i className="bi bi-pencil me-2 text-primary"></i>Edit Payment Request</h1>
            <p className="page-subtitle">Update the request details below</p>
          </div>
          <Link to="/my-requests" className="btn btn-outline-secondary"><i className="bi bi-arrow-left me-1"></i>Back</Link>
        </div>
      </div>

      <div className="row g-3">
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header fw-semibold">Request Details</div>
            <div className="card-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Vendor Name *</label>
                  <input className="form-control" value={form.vendorName} onChange={set('vendorName')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Invoice Number *</label>
                  <input className="form-control" value={form.invoiceNumber} onChange={set('invoiceNumber')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Invoice Date *</label>
                  <input type="date" className="form-control" value={form.invoiceDate} onChange={set('invoiceDate')} required />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Due Date</label>
                  <input type="date" className="form-control" value={form.dueDate} onChange={set('dueDate')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">PO Number</label>
                  <input className="form-control" value={form.poNumber} onChange={set('poNumber')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">GRN Number</label>
                  <input className="form-control" value={form.grnNumber} onChange={set('grnNumber')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Amount *</label>
                  <div className="input-group">
                    <select className="form-select" style={{ maxWidth: 90 }} value={form.currency} onChange={set('currency')}>
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                    <input type="number" className="form-control" value={form.amount} onChange={set('amount')} min={0} required />
                  </div>
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Payment Terms</label>
                  <input className="form-control" value={form.paymentTerms} onChange={set('paymentTerms')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Cost Center</label>
                  <input className="form-control" value={form.costCenter} onChange={set('costCenter')} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Department</label>
                  <select className="form-select" value={form.department} onChange={set('department')}>
                    {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                  </select>
                </div>
                <div className="col-12">
                  <label className="form-label fw-semibold">Description *</label>
                  <textarea className="form-control" rows={3} value={form.description} onChange={set('description')} required />
                </div>
              </div>
            </div>
          </div>

          <div className="card mt-3">
            <div className="card-header fw-semibold">Add More Documents</div>
            <div className="card-body">
              <input type="file" multiple className="form-control"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
                onChange={(e) => setFiles(Array.from(e.target.files))} />
              {files.length > 0 && <div className="mt-2 text-muted" style={{ fontSize: '0.82rem' }}>{files.length} file(s) selected</div>}
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="card sticky-top" style={{ top: 75 }}>
            <div className="card-body">
              <div className="d-grid gap-2">
                <button className="btn btn-outline-secondary" onClick={() => handleSave(false)} disabled={saving}>
                  {saving ? <><span className="spinner-border spinner-border-sm me-2"></span>Saving...</> : 'Save Draft'}
                </button>
                <button className="btn btn-primary" onClick={() => handleSave(true)} disabled={submitting}>
                  {submitting ? <><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</> : <><i className="bi bi-send me-2"></i>Save & Submit</>}
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
