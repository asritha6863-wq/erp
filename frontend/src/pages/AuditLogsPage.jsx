import React, { useState, useEffect, useCallback } from 'react';
import auditLogService from '../services/auditLogService';
import LoadingSpinner from '../components/LoadingSpinner';
import Pagination from '../components/Pagination';
import EmptyState from '../components/EmptyState';
import { formatDateTime, getInitials, getAvatarColor } from '../utils/formatters';
import useDebounce from '../hooks/useDebounce';

const SEVERITY_CONFIG = {
  info:     { badge: 'bg-info text-dark',    icon: 'bi-info-circle' },
  warning:  { badge: 'bg-warning text-dark', icon: 'bi-exclamation-triangle' },
  error:    { badge: 'bg-danger',            icon: 'bi-x-circle' },
  critical: { badge: 'bg-dark',             icon: 'bi-shield-exclamation' },
};

const AuditLogsPage = () => {
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [search, setSearch]       = useState('');
  const [severity, setSeverity]   = useState('');
  const [module, setModule]       = useState('');

  const debouncedSearch = useDebounce(search, 400);

  const fetch = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await auditLogService.getLogs({ page, limit: 20, search: debouncedSearch, severity, module });
      setLogs(res.data.data);
      setPagination(res.data.pagination);
    } catch {}
    finally { setLoading(false); }
  }, [debouncedSearch, severity, module]);

  useEffect(() => { fetch(1); }, [fetch]);

  return (
    <div>
      <div className="page-header px-0">
        <h1 className="page-title"><i className="bi bi-journal-text me-2 text-primary"></i>Audit Logs</h1>
        <p className="page-subtitle">Complete system activity trail for compliance and auditing</p>
      </div>

      <div className="card mb-3">
        <div className="card-body py-2">
          <div className="row g-2">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text"><i className="bi bi-search"></i></span>
                <input className="form-control" placeholder="Search descriptions..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={severity} onChange={(e) => setSeverity(e.target.value)}>
                <option value="">All Severity</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={module} onChange={(e) => setModule(e.target.value)}>
                <option value="">All Modules</option>
                <option value="Auth">Auth</option>
                <option value="User">User</option>
                <option value="PaymentRequest">Payment Request</option>
                <option value="Payment">Payment</option>
                <option value="Department">Department</option>
              </select>
            </div>
            <div className="col-auto">
              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSearch(''); setSeverity(''); setModule(''); }}>Clear</button>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-body p-0">
          {loading ? <LoadingSpinner /> : logs.length === 0 ? <EmptyState icon="bi-journal-x" title="No audit logs found" /> : (
            <>
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead>
                    <tr><th>User</th><th>Action</th><th>Module</th><th>Description</th><th>Severity</th><th>Date & Time</th></tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => {
                      const sev = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.info;
                      return (
                        <tr key={log._id}>
                          <td>
                            {log.user ? (
                              <div className="d-flex align-items-center gap-2">
                                <div className="avatar" style={{ background: getAvatarColor(log.user.email || ''), color: '#fff', width: 28, height: 28, fontSize: '0.65rem', flexShrink: 0 }}>
                                  {getInitials(log.user.firstName, log.user.lastName)}
                                </div>
                                <div>
                                  <div style={{ fontSize: '0.82rem' }}>{log.user.firstName} {log.user.lastName}</div>
                                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>{log.user.email}</div>
                                </div>
                              </div>
                            ) : <span className="text-muted">System</span>}
                          </td>
                          <td><code style={{ fontSize: '0.75rem' }}>{log.action}</code></td>
                          <td><span className="badge bg-secondary" style={{ fontSize: '0.7rem' }}>{log.module}</span></td>
                          <td style={{ fontSize: '0.82rem', maxWidth: 300 }} className="text-truncate-2">{log.description}</td>
                          <td><span className={`badge ${sev.badge}`} style={{ fontSize: '0.7rem' }}><i className={`bi ${sev.icon} me-1`}></i>{log.severity}</span></td>
                          <td style={{ fontSize: '0.78rem', whiteSpace: 'nowrap' }}>{formatDateTime(log.createdAt)}</td>
                        </tr>
                      );
                    })}
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

export default AuditLogsPage;
