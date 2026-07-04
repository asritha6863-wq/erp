import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';

// Auth
import LoginPage from './pages/LoginPage';

// Dashboard
import DashboardPage from './pages/DashboardPage';

// Admin
import UserManagementPage   from './pages/admin/UserManagementPage';
import DepartmentManagementPage from './pages/admin/DepartmentManagementPage';

// Employee
import MyRequestsPage       from './pages/employee/MyRequestsPage';
import CreateRequestPage    from './pages/employee/CreateRequestPage';
import EditRequestPage      from './pages/employee/EditRequestPage';

// Shared
import PaymentRequestDetail from './pages/PaymentRequestDetail';

// Workflow steps
import DeptHeadQueuePage    from './pages/workflow/DeptHeadQueuePage';
import JuniorAccountantQueuePage from './pages/workflow/JuniorAccountantQueuePage';
import SeniorAccountantQueuePage from './pages/workflow/SeniorAccountantQueuePage';
import BudgetControlQueuePage    from './pages/workflow/BudgetControlQueuePage';
import FinanceManagerQueuePage   from './pages/workflow/FinanceManagerQueuePage';
import TreasuryQueuePage         from './pages/workflow/TreasuryQueuePage';
import FilingQueuePage           from './pages/workflow/FilingQueuePage';

// Misc
import AuditLogsPage        from './pages/AuditLogsPage';
import NotificationsPage    from './pages/NotificationsPage';
import ProfilePage          from './pages/ProfilePage';
import AllRequestsPage      from './pages/AllRequestsPage';
import NotFoundPage         from './pages/NotFoundPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected – wrapped in main layout */}
            <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
              <Route path="/dashboard"    element={<DashboardPage />} />
              <Route path="/profile"      element={<ProfilePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />

              {/* Admin */}
              <Route path="/users"       element={<ProtectedRoute roles={['admin']}><UserManagementPage /></ProtectedRoute>} />
              <Route path="/departments" element={<ProtectedRoute roles={['admin']}><DepartmentManagementPage /></ProtectedRoute>} />
              <Route path="/audit-logs"  element={<ProtectedRoute roles={['admin','finance_manager','senior_accountant']}><AuditLogsPage /></ProtectedRoute>} />

              {/* All requests (admin view) */}
              <Route path="/all-requests" element={<ProtectedRoute roles={['admin','finance_manager','senior_accountant']}><AllRequestsPage /></ProtectedRoute>} />

              {/* Employee */}
              <Route path="/my-requests"       element={<MyRequestsPage />} />
              <Route path="/requests/new"      element={<CreateRequestPage />} />
              <Route path="/requests/:id/edit" element={<EditRequestPage />} />

              {/* Shared detail */}
              <Route path="/payment-requests/:id" element={<PaymentRequestDetail />} />

              {/* Workflow queues */}
              <Route path="/dept-head/queue"         element={<ProtectedRoute roles={['department_head','admin']}><DeptHeadQueuePage /></ProtectedRoute>} />
              <Route path="/junior-accountant/queue" element={<ProtectedRoute roles={['junior_accountant','admin']}><JuniorAccountantQueuePage /></ProtectedRoute>} />
              <Route path="/senior-accountant/queue" element={<ProtectedRoute roles={['senior_accountant','admin']}><SeniorAccountantQueuePage /></ProtectedRoute>} />
              <Route path="/budget-control/queue"    element={<ProtectedRoute roles={['budget_control','admin']}><BudgetControlQueuePage /></ProtectedRoute>} />
              <Route path="/finance-manager/queue"   element={<ProtectedRoute roles={['finance_manager','admin']}><FinanceManagerQueuePage /></ProtectedRoute>} />
              <Route path="/treasury/queue"          element={<ProtectedRoute roles={['senior_accountant','admin']}><TreasuryQueuePage /></ProtectedRoute>} />
              <Route path="/filing/queue"            element={<ProtectedRoute roles={['junior_accountant','admin']}><FilingQueuePage /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>

          <ToastContainer
            position="top-right"
            autoClose={4000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
