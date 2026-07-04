export const ROLES = {
  ADMIN:             'admin',
  EMPLOYEE:          'employee',
  DEPARTMENT_HEAD:   'department_head',
  JUNIOR_ACCOUNTANT: 'junior_accountant',
  SENIOR_ACCOUNTANT: 'senior_accountant',
  BUDGET_CONTROL:    'budget_control',
  FINANCE_MANAGER:   'finance_manager',
};

export const ROLE_LABELS = {
  admin:             'Administrator',
  employee:          'Employee (Marketing Staff)',
  department_head:   'Department Head',
  junior_accountant: 'Junior Accountant (AP & Filing)',
  senior_accountant: 'Senior Accountant (GL & Treasury)',
  budget_control:    'Budget Control (ICD)',
  finance_manager:   'Finance Manager',
};

export const ROLE_COLORS = {
  admin:             'danger',
  employee:          'primary',
  department_head:   'success',
  junior_accountant: 'info',
  senior_accountant: 'warning',
  budget_control:    'purple',
  finance_manager:   'dark',
};

export const WORKFLOW_STEPS = [
  { key: 'draft',                     label: 'Draft',                                    step: 0, role: 'employee'          },
  { key: 'pending_dept_head',         label: 'Department Head — Approval',               step: 1, role: 'department_head'   },
  { key: 'pending_junior_accountant', label: 'Junior Accountant — Create PO & Quotation',step: 2, role: 'junior_accountant' },
  { key: 'pending_senior_accountant', label: 'Senior Accountant — GL & Compliance',      step: 3, role: 'senior_accountant' },
  { key: 'pending_budget_control',    label: 'Budget Control — Budget Availability',     step: 4, role: 'budget_control'    },
  { key: 'pending_finance_manager',   label: 'Finance Manager — Final Approval',         step: 5, role: 'finance_manager'   },
  { key: 'pending_treasury',          label: 'Senior Accountant — Process Payment',      step: 6, role: 'senior_accountant' },
  { key: 'pending_filing',            label: 'Junior Accountant — File & Archive',       step: 7, role: 'junior_accountant' },
  { key: 'completed',                 label: 'Completed',                                step: 8, role: null                },
];

export const STATUS_CONFIG = {
  draft:                     { label: 'Draft',                           color: 'secondary', icon: 'bi-file-earmark'      },
  pending_dept_head:         { label: 'Pending Dept. Head',              color: 'warning',   icon: 'bi-person-check'      },
  pending_junior_accountant: { label: 'Pending Jr. Accountant (PO)',    color: 'info',      icon: 'bi-file-earmark-plus' },
  pending_senior_accountant: { label: 'Pending Sr. Accountant (GL)',     color: 'primary',   icon: 'bi-journal-check'     },
  pending_budget_control:    { label: 'Pending Budget Control',          color: 'purple',    icon: 'bi-pie-chart'         },
  pending_finance_manager:   { label: 'Pending Finance Manager',         color: 'dark',      icon: 'bi-briefcase'         },
  pending_treasury:          { label: 'Pending Sr. Accountant (Payment)',color: 'teal',      icon: 'bi-bank'              },
  pending_filing:            { label: 'Pending Jr. Accountant (Filing)', color: 'orange',    icon: 'bi-folder-check'      },
  completed:                 { label: 'Completed',                       color: 'success',   icon: 'bi-check-circle'      },
  rejected:                  { label: 'Rejected',                        color: 'danger',    icon: 'bi-x-circle'          },
  returned:                  { label: 'Returned',                        color: 'warning',   icon: 'bi-arrow-return-left' },
};

export const CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'OMR'];

// After login, each role lands on their primary queue
export const ROLE_HOME_ROUTES = {
  admin:             '/dashboard',
  employee:          '/my-requests',
  department_head:   '/dept-head/queue',
  junior_accountant: '/junior-accountant/queue',
  senior_accountant: '/senior-accountant/queue',
  budget_control:    '/budget-control/queue',
  finance_manager:   '/finance-manager/queue',
};
