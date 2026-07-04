import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import paymentRequestService from '../../services/paymentRequestService';
import StatusBadge from '../../components/StatusBadge';
import LoadingSpinner from '../../components/LoadingSpinner';
import Pagination from '../../components/Pagination';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { STATUS_CONFIG } from '../../utils/constants';
import useDebounce from '../../hooks/useDebounce';

const MyRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');
  const [delTarget, setDelTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [submitting, setSubmitting] = useState(null);

  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await paymentRequestService.getRequests({ page, limit: 10, search: debouncedSearch, status });
      setRequests(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [debouncedSearch, status]);

  useEffect(() => { fetch(1); }, [fetch]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await paymentRequestService.deleteRequest(delTarget._id);
      toast.success('Request deleted');
      setDelTarget(null);
      fetch(pagination.page);
    } catch (err) { toast.error(err.message); }
    finally { setDeleting(false); }
  };

  const handleSubmit = async (pr) => {
    setSubmitting(pr._id);
    try {
      await paymentRequestService.submitRequest(pr._id);
      toast.success(`${pr.requestNumber} submitted for approval`);
      fetch(pagination.page);
    } catch (err) { toast.error(err.message); }
    finally { setSubmitting(null); }
  };

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title"><i className="bi bi-file-earmark-text me-2 text-primary"></i>My Payment Requests</h1>
            <p className="page-subtitle">Track and manage your payment requests</p>
          </div>
          <Link to="/requests/new" className="btn btn-primary">
            <i className="bi bi-plus-lg me-2"></i>New Request
          </Link>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setStatus(''); }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : requests.length === 0 ? (
            <EmptyState icon="bi-file-earmark-plus" title="No requests yet"
              message="Create your first payment request to get started."
              action={<Link to="/requests/new" className="btn btn-primary"><i className="bi bi-plus-lg me-2"></i>Create Request</Link>}
            />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>Request #</th><th>Vendor</th><th>Invoice #</th><th>Amount</th><th>Status</th><th>Date</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {requests.map((pr) => (
                      <tr key={pr._id}>
                        <td><Link to={`/payment-requests/${pr._id}`} className="fw-semibold text-decoration-none">{pr.requestNumber}</Link></td>
                        <td style={{ fontSize: '0.85rem' }}>{pr.vendorName}</td>
                        <td style={{ fontSize: '0.82rem' }}>{pr.invoiceNumber}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatCurrency(pr.amount, pr.currency)}</td>
                        <td><StatusBadge status={pr.currentStep} /></td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(pr.createdAt)}</td>
                        <td>
                          <div className="d-flex gap-1">
                            <Link to={`/payment-requests/${pr._id}`} className="btn btn-sm btn-outline-primary" title="View"><i className="bi bi-eye"></i></Link>
                            {['draft','returned'].includes(pr.currentStep) && (
                              <>
                                <Link to={`/requests/${pr._id}/edit`} className="btn btn-sm btn-outline-secondary" title="Edit"><i className="bi bi-pencil"></i></Link>
                                <button className="btn btn-sm btn-success" title="Submit" onClick={() => handleSubmit(pr)} disabled={submitting === pr._id}>
                                  {submitting === pr._id ? <span className="spinner-border spinner-border-sm"></span> : <i className="bi bi-send"></i>}
                                </button>
                                <button className="btn btn-sm btn-outline-danger" title="Delete" onClick={() => setDelTarget(pr)}><i className="bi bi-trash"></i></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 pb-2">
                <Pagination {...pagination} onPageChange={(p) => fetch(p)} />
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmModal
        show={!!delTarget}
        title="Delete Request"
        message={`Delete "${delTarget?.requestNumber}"? This cannot be undone.`}
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDelTarget(null)}
        loading={deleting}
      />
    </div>
  );
};

export default MyRequestsPage;
