import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import dashboardService from '../services/dashboardService';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import { formatCurrency, formatRelativeTime, getInitials, getAvatarColor } from '../utils/formatters';


ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const StatCard = ({ label, value, icon, gradient, sub }) => (
  <div className="stat-card h-100" style={{ background: gradient }}>
    <div className="d-flex justify-content-between align-items-start">
      <div>
        <div className="stat-value">{value}</div>
        <div className="stat-label mt-1">{label}</div>
        {sub && <div style={{ fontSize: '0.72rem', opacity: 0.8, marginTop: 4 }}>{sub}</div>}
      </div>
      <div className="stat-icon"><i className={`bi ${icon}`}></i></div>
    </div>
  </div>
);

const DashboardPage = () => {
  const { user } = useAuth();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService.getDashboard()
      .then((res) => setData(res.data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner fullPage text="Loading dashboard..." />;
  if (!data) return <div className="alert alert-danger">Failed to load dashboard.</div>;

  const { stats, monthlyStats, recentActivities, recentRequests, workflowBreakdown } = data;

  // Monthly chart
  const months = monthlyStats.map((m) => `${MONTH_NAMES[(m._id.month || 1) - 1]} ${m._id.year}`);
  const barData = {
    labels: months,
    datasets: [
      { label: 'Total',     data: monthlyStats.map((m) => m.total),     backgroundColor: 'rgba(233,30,140,0.75)', borderRadius: 6 },
      { label: 'Completed', data: monthlyStats.map((m) => m.completed), backgroundColor: 'rgba(194,24,91,0.75)',  borderRadius: 6 },
      { label: 'Rejected',  data: monthlyStats.map((m) => m.rejected),  backgroundColor: 'rgba(240,98,146,0.65)', borderRadius: 6 },
    ],
  };

  // Workflow breakdown doughnut
  const wfLabels = workflowBreakdown.map((w) => w._id);
  const wfData   = workflowBreakdown.map((w) => w.count);
  const doughnutData = {
    labels: wfLabels,
    datasets: [{ data: wfData, backgroundColor: ['#0d6efd','#ffc107','#20c997','#6f42c1','#fd7e14','#dc3545','#198754','#0dcaf0','#6c757d'], borderWidth: 0 }],
  };

  const isAdmin = user.role === 'admin';

  return (
    <div>
      {/* Page Header */}
      <div className="page-header px-0">
        <h1 className="page-title">
          <i className="bi bi-speedometer2 me-2 text-primary"></i>Dashboard
        </h1>
        <p className="page-subtitle">Welcome back, {user.firstName}! Here's what's happening today.</p>
      </div>

      {/* Stat Cards */}
      <div className="row g-3 mb-4">
        {isAdmin && (
          <div className="col-6 col-md-3">
            <StatCard label="Total Users" value={stats.totalUsers} icon="bi-people-fill"
              gradient="linear-gradient(135deg,#ad1457,#c2185b)" />
          </div>
        )}
        <div className={`col-6 ${isAdmin ? 'col-md-3' : 'col-md-4'}`}>
          <StatCard label="Total Requests" value={stats.totalRequests} icon="bi-file-earmark-text-fill"
            gradient="linear-gradient(135deg,#e91e8c,#c2185b)" />
        </div>
        <div className={`col-6 ${isAdmin ? 'col-md-3' : 'col-md-4'}`}>
          <StatCard label="Pending" value={stats.pendingCount} icon="bi-hourglass-split"
            gradient="linear-gradient(135deg,#f06292,#e91e8c)"
            sub={stats.myQueueCount > 0 ? `${stats.myQueueCount} in your queue` : null} />
        </div>
        <div className={`col-6 ${isAdmin ? 'col-md-3' : 'col-md-4'}`}>
          <StatCard label="Completed" value={stats.completedCount} icon="bi-check-circle-fill"
            gradient="linear-gradient(135deg,#880e4f,#ad1457)" />
        </div>
        {isAdmin && (
          <div className="col-6 col-md-3">
            <StatCard label="Rejected" value={stats.rejectedCount} icon="bi-x-circle-fill"
              gradient="linear-gradient(135deg,#dc3545,#c2185b)" />
          </div>
        )}
        {!isAdmin && (
          <>
            <div className="col-6 col-md-4">
              <StatCard label="Rejected" value={stats.rejectedCount} icon="bi-x-circle-fill"
                gradient="linear-gradient(135deg,#dc3545,#c2185b)" />
            </div>
            <div className="col-6 col-md-4">
              <StatCard label="Returned" value={stats.returnedCount} icon="bi-arrow-return-left"
                gradient="linear-gradient(135deg,#6c757d,#495057)" />
            </div>
            <div className="col-6 col-md-4">
              <StatCard label="Monthly Payments" value={formatCurrency(stats.monthlyPayments?.total || 0)}
                icon="bi-bank" gradient="linear-gradient(135deg,#6f42c1,#7b2ff7)"
                sub={`${stats.monthlyPayments?.count || 0} transactions`} />
            </div>
          </>
        )}
        {isAdmin && (
          <>
            <div className="col-6 col-md-3">
              <StatCard label="Departments" value={stats.totalDepartments} icon="bi-building-fill"
                gradient="linear-gradient(135deg,#20c997,#0dcaf0)" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Returned" value={stats.returnedCount} icon="bi-arrow-return-left"
                gradient="linear-gradient(135deg,#6c757d,#495057)" />
            </div>
            <div className="col-6 col-md-3">
              <StatCard label="Monthly Payments" value={formatCurrency(stats.monthlyPayments?.total || 0)}
                icon="bi-bank" gradient="linear-gradient(135deg,#6f42c1,#7b2ff7)"
                sub={`${stats.monthlyPayments?.count || 0} transactions`} />
            </div>
          </>
        )}
      </div>

      {/* Charts Row */}
      <div className="row g-3 mb-4">
        <div className="col-lg-8">
          <div className="card h-100">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold"><i className="bi bi-bar-chart me-2 text-primary"></i>Monthly Statistics</span>
            </div>
            <div className="card-body">
              {monthlyStats.length > 0 ? (
                <Bar data={barData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f0f0f0' } } } }} />
              ) : (
                <div className="text-center text-muted py-4">No monthly data available</div>
              )}
            </div>
          </div>
        </div>
        <div className="col-lg-4">
          <div className="card h-100">
            <div className="card-header">
              <span className="fw-semibold"><i className="bi bi-pie-chart me-2 text-primary"></i>Workflow Status</span>
            </div>
            <div className="card-body d-flex flex-column align-items-center justify-content-center">
              {workflowBreakdown.length > 0 ? (
                <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { position: 'bottom', labels: { font: { size: 10 } } } }, cutout: '65%' }} />
              ) : (
                <div className="text-center text-muted py-4">No workflow data</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="row g-3">
        {/* Recent Requests */}
        <div className="col-lg-7">
          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between">
              <span className="fw-semibold"><i className="bi bi-clock-history me-2 text-primary"></i>Recent Requests</span>
              <Link to="/my-requests" className="btn btn-sm btn-outline-primary">View All</Link>
            </div>
            <div className="card-body p-0">
              {recentRequests.length === 0 ? (
                <div className="text-center text-muted py-4">No recent requests</div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead><tr><th>Request #</th><th>Vendor</th><th>Amount</th><th>Status</th></tr></thead>
                    <tbody>
                      {recentRequests.map((pr) => (
                        <tr key={pr._id}>
                          <td>
                            <Link to={`/payment-requests/${pr._id}`} className="text-decoration-none fw-semibold">
                              {pr.requestNumber}
                            </Link>
                          </td>
                          <td style={{ fontSize: '0.85rem' }}>{pr.vendorName}</td>
                          <td style={{ fontSize: '0.85rem' }}>{formatCurrency(pr.amount, pr.currency)}</td>
                          <td><StatusBadge status={pr.currentStep} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="col-lg-5">
          <div className="card">
            <div className="card-header">
              <span className="fw-semibold"><i className="bi bi-activity me-2 text-primary"></i>Recent Activity</span>
            </div>
            <div className="card-body" style={{ maxHeight: 350, overflowY: 'auto' }}>
              {recentActivities.length === 0 ? (
                <div className="text-center text-muted py-4">No recent activity</div>
              ) : (
                recentActivities.map((log) => (
                  <div key={log._id} className="d-flex gap-2 mb-3">
                    {log.user ? (
                      <div className="avatar" style={{ background: getAvatarColor(log.user.email || ''), color: '#fff', width: 32, height: 32, fontSize: '0.68rem', flexShrink: 0 }}>
                        {getInitials(log.user.firstName, log.user.lastName)}
                      </div>
                    ) : (
                      <div className="avatar" style={{ background: '#dee2e6', color: '#6c757d', width: 32, height: 32, fontSize: '0.68rem', flexShrink: 0 }}>SYS</div>
                    )}
                    <div>
                      <div style={{ fontSize: '0.8rem' }}>{log.description}</div>
                      <div style={{ fontSize: '0.7rem', color: '#adb5bd' }}>{formatRelativeTime(log.createdAt)}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
