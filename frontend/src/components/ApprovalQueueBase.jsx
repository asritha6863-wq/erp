import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import paymentRequestService from '../services/paymentRequestService';
import StatusBadge from './StatusBadge';
import LoadingSpinner from './LoadingSpinner';
import Pagination from './Pagination';
import EmptyState from './EmptyState';
import { formatCurrency, formatDate } from '../utils/formatters';

/**
 * Generic approval queue table with search/filter.
 * Accepts `renderActions(pr, refresh)` render prop for role-specific action buttons.
 */
const ApprovalQueueBase = ({ title, subtitle, icon, renderActions, stepFilter }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 10 });
  const [search, setSearch]     = useState('');

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, search };
      if (stepFilter) params.status = stepFilter;
      const res = await paymentRequestService.getRequests(params);
      setRequests(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [search, stepFilter]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <div>
      <div className="page-header px-0">
        <div className="d-flex align-items-center justify-content-between">
          <div>
            <h1 className="page-title"><i className={`bi ${icon} me-2 text-primary`}></i>{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          <div className="badge bg-primary px-3 py-2" style={{ fontSize: '0.88rem' }}>
            {pagination.total} request(s) in queue
          </div>
        </div>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="input-group input-group-sm" style={{ maxWidth: 400 }}>
            <span className="input-group-text"><i className="bi bi-search"></i></span>
            <input className="form-control" placeholder="Search by PR#, vendor, invoice..." value={search}
              onChange={(e) => setSearch(e.target.value)} />
            {search && <button className="btn btn-outline-secondary" onClick={() => setSearch('')}><i className="bi bi-x"></i></button>}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : requests.length === 0 ? (
            <EmptyState icon="bi-inbox" title="Queue is empty" message="No requests are pending your action at this time." />
          ) : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr>
                      <th>Request #</th>
                      <th>Vendor</th>
                      <th>Invoice #</th>
                      <th>Amount</th>
                      <th>Dept</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.map((pr) => (
                      <tr key={pr._id}>
                        <td>
                          <Link to={`/payment-requests/${pr._id}`} className="fw-semibold text-decoration-none">
                            {pr.requestNumber}
                          </Link>
                        </td>
                        <td style={{ fontSize: '0.85rem' }}>{pr.vendorName}</td>
                        <td style={{ fontSize: '0.82rem' }}>{pr.invoiceNumber}</td>
                        <td style={{ fontSize: '0.85rem' }}>{formatCurrency(pr.amount, pr.currency)}</td>
                        <td style={{ fontSize: '0.82rem' }}>{pr.department?.name}</td>
                        <td style={{ fontSize: '0.82rem' }}>{formatDate(pr.dueDate)}</td>
                        <td><StatusBadge status={pr.currentStep} /></td>
                        <td>{renderActions(pr, () => fetch(pagination.page))}</td>
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

export default ApprovalQueueBase;
