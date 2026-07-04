import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ROLE_LABELS } from '../utils/constants';
import { getInitials, getAvatarColor } from '../utils/formatters';

const NAV_ITEMS = [
  // Shared
  { path: '/dashboard',    label: 'Dashboard',       icon: 'bi-speedometer2', roles: null },
  { path: '/notifications', label: 'Notifications',  icon: 'bi-bell',         roles: null },

  // Admin
  { section: 'Administration', roles: ['admin'] },
  { path: '/users',        label: 'User Management',       icon: 'bi-people',          roles: ['admin'] },
  { path: '/departments',  label: 'Departments',            icon: 'bi-building',        roles: ['admin'] },
  { path: '/all-requests', label: 'All Requests',           icon: 'bi-file-earmark-text', roles: ['admin'] },
  { path: '/audit-logs',   label: 'Audit Logs',             icon: 'bi-journal-text',    roles: ['admin'] },

  // Employee
  { section: 'My Work', roles: ['employee'] },
  { path: '/my-requests',  label: 'My Requests',     icon: 'bi-file-earmark-plus', roles: ['employee'] },
  { path: '/requests/new', label: 'New Request',     icon: 'bi-plus-circle',       roles: ['employee'] },

  // Department Head
  { section: 'My Queue', roles: ['department_head'] },
  { path: '/dept-head/queue', label: 'Approval Queue', icon: 'bi-inbox', roles: ['department_head'] },

  // Junior Accountant — two queues: AP/3-Way Match (step 2) + Filing/Archive (step 8)
  { section: 'My Queue', roles: ['junior_accountant'] },
  { path: '/junior-accountant/queue', label: 'AP Queue (3-Way Match)',    icon: 'bi-calculator',    roles: ['junior_accountant'] },
  { path: '/filing/queue',            label: 'Filing Queue (Archive)',     icon: 'bi-folder-check',  roles: ['junior_accountant'] },

  // Senior Accountant — two queues: GL Review (step 3) + Treasury/Payment (step 7)
  { section: 'My Queue', roles: ['senior_accountant'] },
  { path: '/senior-accountant/queue', label: 'GL Review Queue',           icon: 'bi-journal-check', roles: ['senior_accountant'] },
  { path: '/treasury/queue',          label: 'Treasury Queue (Payment)',   icon: 'bi-bank',          roles: ['senior_accountant'] },
  { path: '/audit-logs',              label: 'Audit Logs',                 icon: 'bi-journal-text',  roles: ['senior_accountant'] },
  { path: '/all-requests',            label: 'All Requests',               icon: 'bi-file-earmark-text', roles: ['senior_accountant'] },

  // Budget Control
  { section: 'My Queue', roles: ['budget_control'] },
  { path: '/budget-control/queue', label: 'Budget Queue', icon: 'bi-pie-chart', roles: ['budget_control'] },

  // Finance Manager
  { section: 'My Queue', roles: ['finance_manager'] },
  { path: '/finance-manager/queue', label: 'Finance Queue',  icon: 'bi-briefcase',       roles: ['finance_manager'] },
  { path: '/all-requests',          label: 'All Requests',   icon: 'bi-file-earmark-text', roles: ['finance_manager'] },
  { path: '/audit-logs',            label: 'Audit Logs',     icon: 'bi-journal-text',    roles: ['finance_manager'] },

  // Treasury Officer — removed (now handled by Senior Accountant)
  // Filing Officer — removed (now handled by Junior Accountant)

  // Profile – all roles
  { section: 'Account', roles: null },
  { path: '/profile', label: 'My Profile', icon: 'bi-person-circle', roles: null },
];

const Sidebar = ({ collapsed }) => {
  const { user, logout } = useAuth();

  if (!user) return null;

  const isVisible = (item) => {
    if (!item.roles) return true;
    return item.roles.includes(user.role);
  };

  const initials   = getInitials(user.firstName, user.lastName);
  const avatarBg   = getAvatarColor(user.email);
  const roleLabel  = ROLE_LABELS[user.role] || user.role;

  return (
    <div className={`sidebar d-flex flex-column${collapsed ? ' collapsed' : ''}`}>
      {/* Brand */}
      <div className="sidebar-brand d-flex align-items-center gap-2">
        <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0d6efd', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bi bi-currency-exchange text-white" style={{ fontSize: '1.1rem' }}></i>
        </div>
        {!collapsed && (
          <div>
            <div className="sidebar-brand-text">ERP Payment</div>
            <div className="sidebar-brand-sub">Workflow System</div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-grow-1 py-2 overflow-auto">
        {NAV_ITEMS.map((item, idx) => {
          if (!isVisible(item)) return null;

          if (item.section) {
            return (
              <div key={`sec-${idx}`} className="sidebar-section-title">{item.section}</div>
            );
          }

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <i className={`bi ${item.icon} me-2`}></i>
              <span className="sidebar-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Info */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', padding: '0.85rem 1rem' }}>
        <div className="d-flex align-items-center gap-2">
          <div className="avatar" style={{ background: avatarBg, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          {!collapsed && (
            <div className="flex-grow-1 overflow-hidden">
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user.firstName} {user.lastName}
              </div>
              <div style={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.45)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {roleLabel}
              </div>
            </div>
          )}
          {!collapsed && (
            <button
              onClick={logout}
              className="btn btn-sm p-1"
              title="Logout"
              style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none' }}
            >
              <i className="bi bi-box-arrow-right" style={{ fontSize: '1rem' }}></i>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
