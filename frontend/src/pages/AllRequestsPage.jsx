import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import paymentRequestService from '../services/paymentRequestService';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';
import { STATUS_CONFIG } from '../utils/constants';
import useDebounce from '../hooks/useDebounce';

const AllRequestsPage = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [search, setSearch]     = useState('');
  const [status, setStatus]     = useState('');

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

  return (
    <div>
      <div className="page-header px-0">
        <h1 className="page-title"><i className="bi bi-file-earmark-text me-2 text-primary"></i>All Payment Requests</h1>
        <p className="page-subtitle">System-wide view of all payment requests</p>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Search by PR#, vendor, invoice..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-3">
              <select className="form-select form-select-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All Statuses</option>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setStatus(''); }}>
                <i className="bi bi-x-circle me-1"></i>Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : requests.length === 0 ? <EmptyState icon="bi-file-earmark-x" title="No requests found" /> : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>Request #</th><th>Vendor</th><th>Dept</th><th>Amount</th><th>Status</th><th>Created</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {requests.map((pr) => (
                      <tr key={pr._id}>
                        <td><Link to={`/payment-requests/${pr._id}`} className="fw-semibold text-decoration-none">{pr.requestNumber}</Link></td>
                        <td style={{ fontSize: '0.85rem' }}>{pr.vendorName}</td>
                        <td style={{ fontSize: '0.82rem' }}>{pr.department?.name}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatCurrency(pr.amount, pr.currency)}</td>
                        <td><StatusBadge status={pr.currentStep} /></td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(pr.createdAt)}</td>
                        <td>
                          <Link to={`/payment-requests/${pr._id}`} className="btn btn-sm btn-outline-primary">
                            <i className="bi bi-eye"></i>
                          </Link>
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
    </div>
  );
};

export default AllRequestsPage;
