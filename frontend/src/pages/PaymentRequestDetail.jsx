import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import paymentRequestService from '../services/paymentRequestService';
import approvalService from '../services/approvalService';
import StatusBadge from '../components/StatusBadge';
import WorkflowTimeline from '../components/WorkflowTimeline';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatDate, formatDateTime, formatFileSize } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';

const DR = ({ label, value }) => (
  <div className="col-md-6 col-lg-4 mb-2">
    <div className="text-muted" style={{ fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
    <div className="fw-semibold" style={{ fontSize: '0.9rem' }}>{value || '—'}</div>
  </div>
);

const PaymentRequestDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [pr, setPr]               = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [activeTab, setActiveTab] = useState('items');

  useEffect(() => {
    const load = async () => {
      try {
        const [prRes, apRes] = await Promise.all([
          paymentRequestService.getRequest(id),
          approvalService.getApprovals(id),
        ]);
        setPr(prRes.data.data);
        setApprovals(apRes.data.data);
      } catch {}
      finally { setLoading(false); }
    };
    load();
  }, [id]);

  if (loading) return <LoadingSpinner fullPage />;
  if (!pr)     return <div className="alert alert-danger">Payment request not found.</div>;

  const canEdit = ['draft','returned'].includes(pr.currentStep) &&
    ((user.role === 'employee' && pr.createdBy?._id === user._id) || user.role === 'admin');

  const hasPO        = pr.purchaseOrder?.poNumber;
  const hasVendor    = pr.vendor?.vendorName;
  const hasQuotation = pr.quotation?.quotationNumber;

  const tabs = [
    { id: 'items',     label: 'Items',            icon: 'bi-list-ul'           },
    { id: 'po',        label: 'PO & Vendor',       icon: 'bi-file-earmark-text', show: hasPO || hasVendor },
    { id: 'quotation', label: 'Quotation',         icon: 'bi-receipt',           show: hasQuotation       },
    { id: 'workflow',  label: 'Workflow Data',     icon: 'bi-diagram-3'         },
    { id: 'documents', label: `Docs (${pr.attachments?.length || 0})`, icon: 'bi-paperclip' },
    { id: 'approvals', label: `History (${approvals.length})`, icon: 'bi-check2-all' },
  ];

  return (
    <div>
      {/* Header */}
      <div className="page-header px-0">
        <div className="d-flex align-items-start justify-content-between flex-wrap gap-2">
          <div>
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb mb-1" style={{ fontSize: '0.82rem' }}>
                <li className="breadcrumb-item"><Link to="/dashboard">Dashboard</Link></li>
                <li className="breadcrumb-item active">{pr.requestNumber}</li>
              </ol>
            </nav>
            <h1 className="page-title">{pr.requestNumber}</h1>
            <div className="d-flex align-items-center gap-2 mt-1 flex-wrap">
              <StatusBadge status={pr.currentStep} />
              <span className="text-muted" style={{ fontSize: '0.85rem' }}>{pr.title}</span>
              <span className="badge bg-light text-dark border">{formatCurrency(pr.totalAmount, pr.currency)}</span>
            </div>
          </div>
          <div className="d-flex gap-2">
            {canEdit && <Link to={`/requests/${id}/edit`} className="btn btn-outline-primary btn-sm"><i className="bi bi-pencil me-1"></i>Edit</Link>}
            <Link to={-1} className="btn btn-outline-secondary btn-sm"><i className="bi bi-arrow-left me-1"></i>Back</Link>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {pr.currentStep === 'rejected' && pr.rejectionReason && (
        <div className="alert alert-danger mb-3"><i className="bi bi-x-circle me-2"></i><strong>Rejected:</strong> {pr.rejectionReason}</div>
      )}
      {pr.currentStep === 'returned' && pr.returnReason && (
        <div className="alert alert-warning mb-3"><i className="bi bi-arrow-return-left me-2"></i><strong>Returned:</strong> {pr.returnReason}</div>
      )}

      <div className="row g-3">
        {/* Main content */}
        <div className="col-lg-8">
          <div className="card">
            <div className="card-header">
              <ul className="nav nav-tabs card-header-tabs flex-wrap">
                {tabs.filter((t) => t.show !== false).map((t) => (
                  <li key={t.id} className="nav-item">
                    <button className={`nav-link py-2 ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ fontSize: '0.83rem' }}>
                      <i className={`bi ${t.icon} me-1`}></i>{t.label}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="card-body">

              {/* ── Items Tab ── */}
              {activeTab === 'items' && (
                <div>
                  <div className="row g-2 mb-4">
                    <DR label="Request Title"  value={pr.title} />
                    <DR label="Department"     value={pr.department?.name} />
                    <DR label="Requested By"   value={`${pr.createdBy?.firstName} ${pr.createdBy?.lastName}`} />
                    <DR label="Cost Center"    value={pr.costCenter} />
                    <DR label="Required By"    value={formatDate(pr.dueDate)} />
                    <DR label="Submitted"      value={formatDate(pr.submittedAt)} />
                    {pr.notes && <div className="col-12"><DR label="Notes" value={pr.notes} /></div>}
                  </div>

                  <h6 className="fw-bold mb-3 text-primary"><i className="bi bi-list-ul me-2"></i>Requested Items</h6>
                  <div className="table-responsive">
                    <table className="table table-bordered table-sm">
                      <thead className="table-light">
                        <tr><th>#</th><th>Item Name</th><th>Description</th><th>Qty</th><th>Unit</th><th>Unit Price</th><th>Total</th></tr>
                      </thead>
                      <tbody>
                        {(pr.items || []).map((item, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td className="fw-semibold">{item.itemName}</td>
                            <td className="text-muted">{item.description || '—'}</td>
                            <td>{item.quantity}</td>
                            <td>{item.unit}</td>
                            <td>{formatCurrency(item.unitPrice, pr.currency)}</td>
                            <td className="fw-semibold">{formatCurrency(item.totalPrice, pr.currency)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="table-light">
                        <tr>
                          <td colSpan={6} className="text-end fw-bold">Total Amount</td>
                          <td className="fw-bold text-primary">{formatCurrency(pr.totalAmount, pr.currency)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* ── PO & Vendor Tab ── */}
              {activeTab === 'po' && (
                <div>
                  {hasVendor && (
                    <div className="mb-4">
                      <h6 className="fw-bold text-primary mb-3"><i className="bi bi-building me-2"></i>Vendor Details</h6>
                      <div className="row g-2">
                        <DR label="Vendor Name"    value={pr.vendor.vendorName} />
                        <DR label="Vendor Code"    value={pr.vendor.vendorCode} />
                        <DR label="Contact Person" value={pr.vendor.contactPerson} />
                        <DR label="Email"          value={pr.vendor.email} />
                        <DR label="Phone"          value={pr.vendor.phone} />
                        <DR label="Tax Number"     value={pr.vendor.taxNumber} />
                        {pr.vendor.address && <div className="col-12"><DR label="Address" value={pr.vendor.address} /></div>}
                        <DR label="Bank Name"      value={pr.vendor.bankName} />
                        <DR label="Account Number" value={pr.vendor.bankAccount} />
                      </div>
                    </div>
                  )}
                  {hasPO && (
                    <div>
                      <h6 className="fw-bold text-primary mb-3"><i className="bi bi-file-earmark-text me-2"></i>Purchase Order</h6>
                      <div className="row g-2">
                        <DR label="PO Number"       value={pr.purchaseOrder.poNumber} />
                        <DR label="PO Date"         value={formatDate(pr.purchaseOrder.poDate)} />
                        <DR label="Delivery Date"   value={formatDate(pr.purchaseOrder.deliveryDate)} />
                        <DR label="Payment Terms"   value={pr.purchaseOrder.paymentTerms} />
                        <DR label="Delivery Terms"  value={pr.purchaseOrder.deliveryTerms} />
                        <DR label="Created At"      value={formatDateTime(pr.purchaseOrder.createdAt)} />
                        {pr.purchaseOrder.notes && <div className="col-12"><DR label="Notes" value={pr.purchaseOrder.notes} /></div>}
                      </div>
                    </div>
                  )}
                  {!hasPO && !hasVendor && (
                    <div className="text-center text-muted py-4">
                      <i className="bi bi-hourglass-split fs-3 d-block mb-2"></i>
                      Waiting for Junior Accountant to create PO and enter vendor details.
                    </div>
                  )}
                </div>
              )}

              {/* ── Quotation Tab ── */}
              {activeTab === 'quotation' && (
                <div>
                  {hasQuotation ? (
                    <>
                      <div className="row g-2 mb-3">
                        <DR label="Quotation #"   value={pr.quotation.quotationNumber} />
                        <DR label="Date"          value={formatDate(pr.quotation.quotationDate)} />
                        <DR label="Valid Until"   value={formatDate(pr.quotation.validUntil)} />
                        <DR label="Tax Rate"      value={`${pr.quotation.taxRate || 0}%`} />
                      </div>
                      <div className="table-responsive mb-3">
                        <table className="table table-bordered table-sm">
                          <thead className="table-light"><tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr></thead>
                          <tbody>
                            {(pr.quotation.items || []).map((it, i) => (
                              <tr key={i}>
                                <td>{it.itemName}</td><td>{it.quantity}</td>
                                <td>{formatCurrency(it.unitPrice, pr.currency)}</td>
                                <td>{formatCurrency(it.totalPrice, pr.currency)}</td>
                              </tr>
                            ))}
                          </tbody>
                          <tfoot className="table-light">
                            <tr><td colSpan={3} className="text-end fw-semibold">Subtotal</td><td>{formatCurrency(pr.quotation.subtotal, pr.currency)}</td></tr>
                            <tr><td colSpan={3} className="text-end fw-semibold">Tax ({pr.quotation.taxRate}%)</td><td>{formatCurrency(pr.quotation.taxAmount, pr.currency)}</td></tr>
                            <tr><td colSpan={3} className="text-end fw-bold text-primary">Grand Total</td><td className="fw-bold text-primary">{formatCurrency(pr.quotation.grandTotal, pr.currency)}</td></tr>
                          </tfoot>
                        </table>
                      </div>
                      {pr.quotation.terms && <div className="p-3 rounded bg-light"><small className="text-muted fw-semibold">Terms:</small><div style={{ fontSize: '0.85rem' }}>{pr.quotation.terms}</div></div>}
                    </>
                  ) : (
                    <div className="text-center text-muted py-4"><i className="bi bi-receipt fs-3 d-block mb-2"></i>Quotation not yet created.</div>
                  )}
                </div>
              )}

              {/* ── Workflow Data Tab ── */}
              {activeTab === 'workflow' && (
                <div>
                  {pr.apVoucher?.voucherNumber && (
                    <div className="mb-4 p-3 rounded" style={{ background: '#f0fff4', border: '1px solid #bbf7d0' }}>
                      <h6 className="fw-bold text-success mb-2"><i className="bi bi-receipt me-2"></i>AP Voucher</h6>
                      <div className="row g-2">
                        <DR label="Voucher #"    value={pr.apVoucher.voucherNumber} />
                        <DR label="3-Way Match"  value={pr.apVoucher.threeWayMatch ? '✅ Passed' : '❌ Failed'} />
                        <DR label="Notes"        value={pr.apVoucher.matchNotes} />
                      </div>
                    </div>
                  )}
                  {pr.glCoding?.glAccount && (
                    <div className="mb-4 p-3 rounded" style={{ background: '#f0f4ff', border: '1px solid #c7d7fe' }}>
                      <h6 className="fw-bold text-primary mb-2"><i className="bi bi-journal-check me-2"></i>GL Coding (Sr. Accountant)</h6>
                      <div className="row g-2">
                        <DR label="GL Account"    value={pr.glCoding.glAccount} />
                        <DR label="VAT Compliant" value={pr.glCoding.vatCompliant ? '✅ Yes' : '❌ No'} />
                        <DR label="Duplicate"     value={pr.glCoding.isDuplicate ? '⚠️ Yes' : '✅ No'} />
                        <DR label="Notes"         value={pr.glCoding.notes} />
                      </div>
                    </div>
                  )}
                  {pr.budgetCheck?.budgetCode && (
                    <div className="mb-4 p-3 rounded" style={{ background: '#fdf4ff', border: '1px solid #e9d5ff' }}>
                      <h6 className="fw-bold mb-2" style={{ color: '#7c3aed' }}><i className="bi bi-pie-chart me-2"></i>Budget Check</h6>
                      <div className="row g-2">
                        <DR label="Budget Available" value={pr.budgetCheck.budgetAvailable ? '✅ Yes' : '❌ No'} />
                        <DR label="Budget Code"      value={pr.budgetCheck.budgetCode} />
                        <DR label="Notes"            value={pr.budgetCheck.notes} />
                      </div>
                    </div>
                  )}
                  {pr.financeReview?.cashFlowOk !== null && pr.financeReview?.cashFlowOk !== undefined && (
                    <div className="mb-4 p-3 rounded" style={{ background: '#f8f8f8', border: '1px solid #e2e8f0' }}>
                      <h6 className="fw-bold text-dark mb-2"><i className="bi bi-briefcase me-2"></i>Finance Review</h6>
                      <div className="row g-2">
                        <DR label="Cash Flow OK"  value={pr.financeReview.cashFlowOk ? '✅ Yes' : '❌ No'} />
                        <DR label="Policy OK"     value={pr.financeReview.policyOk   ? '✅ Yes' : '❌ No'} />
                        {pr.financeReview.heldReason && <div className="col-12"><DR label="Held Reason" value={pr.financeReview.heldReason} /></div>}
                      </div>
                    </div>
                  )}
                  {pr.payment && (
                    <div className="p-3 rounded" style={{ background: '#fff8e1', border: '1px solid #fde68a' }}>
                      <h6 className="fw-bold text-warning mb-2"><i className="bi bi-bank me-2"></i>Payment (Sr. Accountant Treasury)</h6>
                      <div className="row g-2">
                        <DR label="Payment Advice #" value={pr.payment.paymentAdviceNo} />
                        <DR label="Method"           value={pr.payment.paymentMethod} />
                        <DR label="Bank"             value={pr.payment.bankName} />
                        <DR label="Transaction Ref"  value={pr.payment.transactionRef} />
                        <DR label="Payment Date"     value={formatDate(pr.payment.paymentDate)} />
                        <DR label="Amount Paid"      value={formatCurrency(pr.payment.amount, pr.payment.currency)} />
                        <DR label="Status"           value={pr.payment.status?.toUpperCase()} />
                      </div>
                    </div>
                  )}
                  {!pr.apVoucher?.voucherNumber && !pr.glCoding?.glAccount && !pr.payment && (
                    <div className="text-center text-muted py-4"><i className="bi bi-hourglass-split fs-3 d-block mb-2"></i>Workflow data will appear as the request progresses.</div>
                  )}
                </div>
              )}

              {/* ── Documents Tab ── */}
              {activeTab === 'documents' && (
                <div>
                  {!pr.attachments?.length ? (
                    <div className="text-center text-muted py-4"><i className="bi bi-file-earmark-x fs-3 d-block mb-2"></i>No documents attached.</div>
                  ) : (
                    <div className="list-group">
                      {pr.attachments.map((att) => (
                        <div key={att._id} className="list-group-item d-flex align-items-center gap-3">
                          <i className="bi bi-file-earmark-text text-primary" style={{ fontSize: '1.5rem' }}></i>
                          <div className="flex-grow-1">
                            <div className="fw-semibold" style={{ fontSize: '0.88rem' }}>{att.originalName}</div>
                            <div className="text-muted" style={{ fontSize: '0.75rem' }}>{formatFileSize(att.size)} · {att.documentType} · {formatDate(att.createdAt)}</div>
                          </div>
                          <a href={`/uploads/${att.fileName}`} target="_blank" rel="noreferrer" className="btn btn-sm btn-outline-primary"><i className="bi bi-download"></i></a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* ── Approvals Tab ── */}
              {activeTab === 'approvals' && (
                <div>
                  {approvals.length === 0 ? (
                    <div className="text-center text-muted py-4">No approval actions yet.</div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead><tr><th>Step</th><th>By</th><th>Action</th><th>Comments</th><th>Date</th></tr></thead>
                        <tbody>
                          {approvals.map((a) => (
                            <tr key={a._id}>
                              <td style={{ fontSize: '0.78rem' }}><code>{a.fromStep}</code><i className="bi bi-arrow-right mx-1"></i><code>{a.toStep}</code></td>
                              <td style={{ fontSize: '0.82rem' }}>{a.approver?.firstName} {a.approver?.lastName}</td>
                              <td><span className={`badge ${a.action==='approved'||a.action==='forwarded'?'bg-success':a.action==='rejected'?'bg-danger':'bg-warning text-dark'}`} style={{ fontSize: '0.7rem' }}>{a.action}</span></td>
                              <td style={{ fontSize: '0.8rem', maxWidth: 180 }}>{a.comments || '—'}</td>
                              <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDateTime(a.actionDate)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Sidebar — Workflow Timeline */}
        <div className="col-lg-4">
          <div className="card">
            <div className="card-header py-2"><span className="fw-semibold" style={{ fontSize: '0.9rem' }}><i className="bi bi-diagram-3 me-2 text-primary"></i>Workflow Progress</span></div>
            <div className="card-body"><WorkflowTimeline currentStep={pr.currentStep} approvals={approvals} /></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentRequestDetail;
