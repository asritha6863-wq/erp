require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose  = require('mongoose');
const connectDB = require('../config/db');
const User           = require('../models/User');
const Department     = require('../models/Department');
const PaymentRequest = require('../models/PaymentRequest');
const Approval       = require('../models/Approval');
const Payment        = require('../models/Payment');
const AuditLog       = require('../models/AuditLog');
const Notification   = require('../models/Notification');
const Attachment     = require('../models/Attachment');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting database seed...\n');
  await Promise.all([
    User.deleteMany({}), Department.deleteMany({}), PaymentRequest.deleteMany({}),
    Approval.deleteMany({}), Payment.deleteMany({}), AuditLog.deleteMany({}),
    Notification.deleteMany({}), Attachment.deleteMany({}),
  ]);
  console.log('✅ Cleared existing data');

  const departments = await Department.insertMany([
    { name: 'Marketing',              code: 'MKT', description: 'Marketing and Sales',      budget: 500000, usedBudget: 120000, costCenter: 'CC-001', isActive: true },
    { name: 'Information Technology', code: 'IT',  description: 'IT and Systems',            budget: 800000, usedBudget: 200000, costCenter: 'CC-002', isActive: true },
    { name: 'Human Resources',        code: 'HR',  description: 'Human Resources',           budget: 300000, usedBudget: 80000,  costCenter: 'CC-003', isActive: true },
    { name: 'Operations',             code: 'OPS', description: 'Operations and Logistics',  budget: 600000, usedBudget: 150000, costCenter: 'CC-004', isActive: true },
    { name: 'Finance',                code: 'FIN', description: 'Finance and Accounts',      budget: 400000, usedBudget: 90000,  costCenter: 'CC-005', isActive: true },
  ]);
  console.log(`✅ Created ${departments.length} departments`);

  const userData = [
    { firstName: 'System',   lastName: 'Admin',    email: 'admin@erp.com',           role: 'admin',             department: null               },
    { firstName: 'John',     lastName: 'Smith',    email: 'john.smith@erp.com',      role: 'employee',          department: departments[0]._id },
    { firstName: 'Sarah',    lastName: 'Connor',   email: 'sarah.connor@erp.com',    role: 'employee',          department: departments[1]._id },
    { firstName: 'Mike',     lastName: 'Johnson',  email: 'mike.johnson@erp.com',    role: 'employee',          department: departments[2]._id },
    { firstName: 'Emily',    lastName: 'Davis',    email: 'emily.davis@erp.com',     role: 'department_head',   department: departments[0]._id },
    { firstName: 'Robert',   lastName: 'Wilson',   email: 'robert.wilson@erp.com',   role: 'department_head',   department: departments[1]._id },
    { firstName: 'Lisa',     lastName: 'Anderson', email: 'lisa.anderson@erp.com',   role: 'junior_accountant', department: departments[4]._id },
    { firstName: 'David',    lastName: 'Martinez', email: 'david.martinez@erp.com',  role: 'senior_accountant', department: departments[4]._id },
    { firstName: 'Jennifer', lastName: 'Taylor',   email: 'jennifer.taylor@erp.com', role: 'budget_control',    department: departments[4]._id },
    { firstName: 'William',  lastName: 'Brown',    email: 'william.brown@erp.com',   role: 'finance_manager',   department: departments[4]._id },
    { firstName: 'Patricia', lastName: 'Jones',    email: 'patricia.jones@erp.com',  role: 'senior_accountant', department: departments[4]._id },
    { firstName: 'Charles',  lastName: 'Garcia',   email: 'charles.garcia@erp.com',  role: 'junior_accountant', department: departments[4]._id },
  ];
  const users = [];
  for (const u of userData) {
    const created = await User.create({ ...u, password: 'Password123', isActive: true });
    users.push(created);
  }
  console.log(`✅ Created ${users.length} users`);
  await Department.findByIdAndUpdate(departments[0]._id, { head: users[4]._id });
  await Department.findByIdAndUpdate(departments[1]._id, { head: users[5]._id });

  const emp1 = users[1]; const emp2 = users[2];
  const jrAcc = users[6]; const srAcc = users[7];
  const budgetCtrl = users[8]; const finMgr = users[9];
  const treasury = users[10]; const filing = users[11];

  const prDefs = [
    // 0 — Completed full trail
    { createdBy: emp1._id, department: departments[0]._id, title: 'Office Equipment Purchase',
      items: [
        { itemName: 'Laptop', description: 'Dell XPS 15', quantity: 3, unit: 'pcs', unitPrice: 1500, totalPrice: 4500 },
        { itemName: 'Monitor', description: '27" 4K Display', quantity: 3, unit: 'pcs', unitPrice: 400, totalPrice: 1200 },
        { itemName: 'Keyboard & Mouse', description: 'Wireless combo', quantity: 3, unit: 'sets', unitPrice: 80, totalPrice: 240 },
      ],
      totalAmount: 5940, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-01'),
      notes: 'Urgently needed for new team members',
      currentStep: 'completed', previousStep: 'pending_filing', isPaid: true, isArchived: true,
      submittedAt: new Date('2024-11-02'), completedAt: new Date('2024-11-20'),
      vendor: { vendorName: 'TechSupply Co.', vendorCode: 'VS-001', contactPerson: 'Mark Lee', email: 'mark@techsupply.com', phone: '+1-555-0100', address: '123 Tech Street, NY', bankName: 'First National Bank', bankAccount: '****4821', taxNumber: 'TX-12345' },
      purchaseOrder: { poNumber: 'PO-2024-00001', poDate: new Date('2024-11-05'), deliveryDate: new Date('2024-11-15'), paymentTerms: 'Net 30', deliveryTerms: 'FOB Destination', notes: 'Deliver to IT dept', createdAt: new Date('2024-11-05') },
      quotation: { quotationNumber: 'QT-2024-00001', quotationDate: new Date('2024-11-05'), validUntil: new Date('2024-12-05'), items: [{ itemName: 'Laptop', quantity: 3, unitPrice: 1500, totalPrice: 4500 },{ itemName: 'Monitor', quantity: 3, unitPrice: 400, totalPrice: 1200 },{ itemName: 'Keyboard & Mouse', quantity: 3, unitPrice: 80, totalPrice: 240 }], subtotal: 5940, taxRate: 5, taxAmount: 297, grandTotal: 6237, terms: 'Payment within 30 days', createdAt: new Date('2024-11-05') },
      apVoucher: { voucherNumber: 'APV-2024-001', threeWayMatch: true, matchNotes: 'PO, GRN, Invoice all verified', createdAt: new Date('2024-11-08') },
      glCoding: { glAccount: 'GL-5100', vatCompliant: true, isDuplicate: false, notes: 'Approved for asset account' },
      budgetCheck: { budgetAvailable: true, budgetCode: 'BC-MKT-2024', notes: 'Budget confirmed' },
      financeReview: { cashFlowOk: true, policyOk: true, heldReason: '' },
    },
    // 1 — Pending Department Head
    { createdBy: emp1._id, department: departments[0]._id, title: 'Marketing Event Supplies',
      items: [
        { itemName: 'Banners', description: 'Branded roll-up banners', quantity: 10, unit: 'pcs', unitPrice: 85, totalPrice: 850 },
        { itemName: 'Brochures', description: 'A4 tri-fold, full colour', quantity: 500, unit: 'pcs', unitPrice: 0.8, totalPrice: 400 },
      ],
      totalAmount: 1250, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-10'),
      notes: 'Required for Q1 trade show', currentStep: 'pending_dept_head', previousStep: 'draft', submittedAt: new Date('2024-11-11'),
    },
    // 2 — Pending Junior Accountant (dept head approved, waiting PO/vendor/quotation)
    { createdBy: emp2._id, department: departments[1]._id, title: 'Cloud Infrastructure Upgrade',
      items: [
        { itemName: 'Cloud Server Subscription', description: 'AWS EC2 — 12 months', quantity: 1, unit: 'subscription', unitPrice: 8750, totalPrice: 8750 },
      ],
      totalAmount: 8750, currency: 'USD', costCenter: 'CC-002', dueDate: new Date('2024-12-05'),
      notes: 'Annual renewal', currentStep: 'pending_junior_accountant', previousStep: 'pending_dept_head', submittedAt: new Date('2024-11-06'),
    },
    // 3 — Pending Senior Accountant
    { createdBy: emp1._id, department: departments[0]._id, title: 'Conference Room AV Equipment',
      items: [
        { itemName: 'Projector', description: '4K laser projector', quantity: 2, unit: 'pcs', unitPrice: 2500, totalPrice: 5000 },
        { itemName: 'Screen', description: '120-inch motorised screen', quantity: 2, unit: 'pcs', unitPrice: 800, totalPrice: 1600 },
      ],
      totalAmount: 6600, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-08'),
      notes: 'Board room renovation project', currentStep: 'pending_senior_accountant', previousStep: 'pending_junior_accountant', submittedAt: new Date('2024-11-09'),
      vendor: { vendorName: 'AV Solutions Ltd.', vendorCode: 'VS-002', contactPerson: 'Jane Kim', email: 'jane@avsolutions.com', phone: '+1-555-0200', address: '456 AV Ave, CA', bankName: 'City Bank', bankAccount: '****7890', taxNumber: 'TX-67890' },
      purchaseOrder: { poNumber: 'PO-2024-00002', poDate: new Date('2024-11-12'), deliveryDate: new Date('2024-11-25'), paymentTerms: 'Net 30', deliveryTerms: 'FOB Origin', notes: '', createdAt: new Date('2024-11-12') },
      quotation: { quotationNumber: 'QT-2024-00002', quotationDate: new Date('2024-11-12'), validUntil: new Date('2024-12-12'), items: [{ itemName: 'Projector', quantity: 2, unitPrice: 2500, totalPrice: 5000 },{ itemName: 'Screen', quantity: 2, unitPrice: 800, totalPrice: 1600 }], subtotal: 6600, taxRate: 5, taxAmount: 330, grandTotal: 6930, terms: 'Net 30', createdAt: new Date('2024-11-12') },
      apVoucher: { voucherNumber: 'APV-2024-002', threeWayMatch: true, matchNotes: 'Verified', createdAt: new Date('2024-11-14') },
    },
    // 4 — Pending Budget Control
    { createdBy: emp2._id, department: departments[1]._id, title: 'Network Security Upgrade',
      items: [
        { itemName: 'Firewall Appliance', description: 'Cisco Firepower 2100', quantity: 2, unit: 'pcs', unitPrice: 12000, totalPrice: 24000 },
        { itemName: 'VPN Licenses', description: 'AnyConnect 100-user pack', quantity: 1, unit: 'pack', unitPrice: 3500, totalPrice: 3500 },
      ],
      totalAmount: 27500, currency: 'USD', costCenter: 'CC-002', dueDate: new Date('2024-12-12'),
      currentStep: 'pending_budget_control', previousStep: 'pending_senior_accountant', submittedAt: new Date('2024-11-13'),
      vendor: { vendorName: 'SecureNet Solutions', vendorCode: 'VS-003', contactPerson: 'Tom Hardy', email: 'tom@securenet.com', phone: '+1-555-0300', address: '789 Secure Blvd, TX', bankName: 'Commerce Bank', bankAccount: '****1234', taxNumber: 'TX-11111' },
      purchaseOrder: { poNumber: 'PO-2024-00003', poDate: new Date('2024-11-15'), deliveryDate: new Date('2024-11-28'), paymentTerms: 'Net 45', deliveryTerms: 'FOB Destination', notes: 'Priority delivery', createdAt: new Date('2024-11-15') },
      quotation: { quotationNumber: 'QT-2024-00003', quotationDate: new Date('2024-11-15'), validUntil: new Date('2024-12-15'), items: [{ itemName: 'Firewall Appliance', quantity: 2, unitPrice: 12000, totalPrice: 24000 },{ itemName: 'VPN Licenses', quantity: 1, unitPrice: 3500, totalPrice: 3500 }], subtotal: 27500, taxRate: 5, taxAmount: 1375, grandTotal: 28875, terms: 'Net 45', createdAt: new Date('2024-11-15') },
      apVoucher: { voucherNumber: 'APV-2024-003', threeWayMatch: true, matchNotes: 'OK', createdAt: new Date('2024-11-16') },
      glCoding: { glAccount: 'GL-5200', vatCompliant: true, isDuplicate: false, notes: 'GL verified' },
    },
    // 5 — Rejected
    { createdBy: emp1._id, department: departments[0]._id, title: 'Social Media Campaign Tools',
      items: [{ itemName: 'Hootsuite Enterprise', description: 'Annual subscription', quantity: 1, unit: 'subscription', unitPrice: 12000, totalPrice: 12000 }],
      totalAmount: 12000, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-03'),
      currentStep: 'rejected', previousStep: 'pending_dept_head',
      rejectionReason: 'Budget for software subscriptions exhausted for this quarter. Resubmit in Q2.', submittedAt: new Date('2024-11-04'),
    },
    // 6 — Returned
    { createdBy: emp2._id, department: departments[1]._id, title: 'Backup Storage Solution',
      items: [{ itemName: 'NAS Storage Unit', description: '48TB enterprise NAS', quantity: 1, unit: 'unit', unitPrice: 5500, totalPrice: 5500 }],
      totalAmount: 5500, currency: 'USD', costCenter: 'CC-002',
      currentStep: 'returned', previousStep: 'pending_dept_head',
      returnReason: 'Please add technical specifications document and get 3 vendor quotations before resubmitting.',
    },
    // 7 — Pending Finance Manager
    { createdBy: emp1._id, department: departments[0]._id, title: 'Digital Advertising Campaign Q1',
      items: [
        { itemName: 'Google Ads', description: 'Search & Display Q1', quantity: 1, unit: 'campaign', unitPrice: 10000, totalPrice: 10000 },
        { itemName: 'LinkedIn Ads', description: 'B2B campaign Q1', quantity: 1, unit: 'campaign', unitPrice: 5000, totalPrice: 5000 },
      ],
      totalAmount: 15000, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-15'),
      currentStep: 'pending_finance_manager', previousStep: 'pending_budget_control', submittedAt: new Date('2024-11-16'),
      vendor: { vendorName: 'GlobalAds Agency', vendorCode: 'VS-004', contactPerson: 'Sara Miles', email: 'sara@globalads.com', phone: '+1-555-0400', address: '321 Ad Street, NY', bankName: 'Metro Bank', bankAccount: '****5678', taxNumber: 'TX-22222' },
      purchaseOrder: { poNumber: 'PO-2024-00004', poDate: new Date('2024-11-18'), deliveryDate: new Date('2024-12-01'), paymentTerms: 'Net 30', deliveryTerms: 'Digital delivery', notes: '', createdAt: new Date('2024-11-18') },
      quotation: { quotationNumber: 'QT-2024-00004', quotationDate: new Date('2024-11-18'), validUntil: new Date('2024-12-18'), items: [{ itemName: 'Google Ads', quantity: 1, unitPrice: 10000, totalPrice: 10000 },{ itemName: 'LinkedIn Ads', quantity: 1, unitPrice: 5000, totalPrice: 5000 }], subtotal: 15000, taxRate: 0, taxAmount: 0, grandTotal: 15000, terms: 'Net 30', createdAt: new Date('2024-11-18') },
      apVoucher: { voucherNumber: 'APV-2024-004', threeWayMatch: true, matchNotes: 'Verified', createdAt: new Date('2024-11-19') },
      glCoding: { glAccount: 'GL-6200', vatCompliant: true, isDuplicate: false, notes: 'Compliant' },
      budgetCheck: { budgetAvailable: true, budgetCode: 'BC-MKT-2024', notes: 'Budget confirmed' },
    },
    // 8 — Pending Treasury (Sr. Accountant payment)
    { createdBy: emp2._id, department: departments[1]._id, title: 'Enterprise Software Licenses',
      items: [{ itemName: 'Microsoft 365 E3', description: '50 users, annual', quantity: 50, unit: 'licenses', unitPrice: 184, totalPrice: 9200 }],
      totalAmount: 9200, currency: 'USD', costCenter: 'CC-002', dueDate: new Date('2024-12-18'),
      currentStep: 'pending_treasury', previousStep: 'pending_finance_manager', submittedAt: new Date('2024-11-19'),
      vendor: { vendorName: 'SoftwareVault Inc.', vendorCode: 'VS-005', contactPerson: 'Chris Wong', email: 'chris@swvault.com', phone: '+1-555-0500', address: '654 Software Lane, WA', bankName: 'Pacific Bank', bankAccount: '****9012', taxNumber: 'TX-33333' },
      purchaseOrder: { poNumber: 'PO-2024-00005', poDate: new Date('2024-11-20'), deliveryDate: new Date('2024-12-01'), paymentTerms: 'Net 30', deliveryTerms: 'Digital delivery', notes: '', createdAt: new Date('2024-11-20') },
      quotation: { quotationNumber: 'QT-2024-00005', quotationDate: new Date('2024-11-20'), validUntil: new Date('2024-12-20'), items: [{ itemName: 'Microsoft 365 E3', quantity: 50, unitPrice: 184, totalPrice: 9200 }], subtotal: 9200, taxRate: 5, taxAmount: 460, grandTotal: 9660, terms: 'Net 30', createdAt: new Date('2024-11-20') },
      apVoucher: { voucherNumber: 'APV-2024-005', threeWayMatch: true, matchNotes: 'Verified', createdAt: new Date('2024-11-21') },
      glCoding: { glAccount: 'GL-5300', vatCompliant: true, isDuplicate: false, notes: 'OK' },
      budgetCheck: { budgetAvailable: true, budgetCode: 'BC-IT-2024', notes: 'Confirmed' },
      financeReview: { cashFlowOk: true, policyOk: true, heldReason: '' },
    },
    // 9 — Pending Filing (Jr. Accountant archive)
    { createdBy: emp1._id, department: departments[0]._id, title: 'Trade Show Logistics Q4',
      items: [
        { itemName: 'Booth Shipping', description: 'Freight to trade show venue', quantity: 1, unit: 'service', unitPrice: 3500, totalPrice: 3500 },
        { itemName: 'Booth Setup', description: 'On-site setup & teardown', quantity: 1, unit: 'service', unitPrice: 2000, totalPrice: 2000 },
      ],
      totalAmount: 5500, currency: 'USD', costCenter: 'CC-001', dueDate: new Date('2024-12-20'),
      currentStep: 'pending_filing', previousStep: 'pending_treasury', isPaid: true, submittedAt: new Date('2024-11-21'),
      vendor: { vendorName: 'LogisticsPro Ltd.', vendorCode: 'VS-006', contactPerson: 'Amy Clark', email: 'amy@logisticspro.com', phone: '+1-555-0600', address: '987 Logistics Rd, IL', bankName: 'Midwest Bank', bankAccount: '****3456', taxNumber: 'TX-44444' },
      purchaseOrder: { poNumber: 'PO-2024-00006', poDate: new Date('2024-11-22'), deliveryDate: new Date('2024-12-10'), paymentTerms: 'Net 15', deliveryTerms: 'FOB Destination', notes: '', createdAt: new Date('2024-11-22') },
      quotation: { quotationNumber: 'QT-2024-00006', quotationDate: new Date('2024-11-22'), validUntil: new Date('2024-12-22'), items: [{ itemName: 'Booth Shipping', quantity: 1, unitPrice: 3500, totalPrice: 3500 },{ itemName: 'Booth Setup', quantity: 1, unitPrice: 2000, totalPrice: 2000 }], subtotal: 5500, taxRate: 0, taxAmount: 0, grandTotal: 5500, terms: 'Net 15', createdAt: new Date('2024-11-22') },
      apVoucher: { voucherNumber: 'APV-2024-006', threeWayMatch: true, matchNotes: 'Verified', createdAt: new Date('2024-11-23') },
      glCoding: { glAccount: 'GL-6100', vatCompliant: true, isDuplicate: false, notes: 'OK' },
      budgetCheck: { budgetAvailable: true, budgetCode: 'BC-MKT-2024', notes: 'Confirmed' },
      financeReview: { cashFlowOk: true, policyOk: true, heldReason: '' },
    },
  ];

  const paymentRequests = [];
  for (const pr of prDefs) { const c = await PaymentRequest.create(pr); paymentRequests.push(c); }
  console.log(`✅ Created ${paymentRequests.length} payment requests`);

  const payment1 = await Payment.create({ paymentRequest: paymentRequests[0]._id, processedBy: treasury._id, paymentMethod: 'bank_transfer', bankName: 'First National Bank', accountNumber: '****4821', transactionRef: 'TXN-2024-001', paymentDate: new Date('2024-11-18'), amount: 6237, currency: 'USD', status: 'paid', confirmedAt: new Date('2024-11-18'), notes: 'Payment confirmed' });
  const payment2 = await Payment.create({ paymentRequest: paymentRequests[9]._id, processedBy: treasury._id, paymentMethod: 'cheque', bankName: 'Midwest Bank', accountNumber: '****3456', transactionRef: 'CHQ-2024-001', paymentDate: new Date('2024-11-25'), amount: 5500, currency: 'USD', status: 'paid', confirmedAt: new Date('2024-11-25'), notes: 'Cheque delivered' });
  await PaymentRequest.findByIdAndUpdate(paymentRequests[0]._id, { payment: payment1._id });
  await PaymentRequest.findByIdAndUpdate(paymentRequests[9]._id, { payment: payment2._id });
  console.log('✅ Created 2 payments');

  const completedPR = paymentRequests[0];
  await Approval.insertMany([
    { paymentRequest: completedPR._id, approver: users[4]._id, action: 'approved',  comments: 'Approved for procurement', fromStep: 'pending_dept_head', toStep: 'pending_junior_accountant', actionDate: new Date('2024-11-03') },
    { paymentRequest: completedPR._id, approver: jrAcc._id,    action: 'forwarded', comments: 'PO created, vendor confirmed, quotation issued', fromStep: 'pending_junior_accountant', toStep: 'pending_senior_accountant', actionDate: new Date('2024-11-05'), stepData: { poNumber: 'PO-2024-00001', quotationNumber: 'QT-2024-00001' } },
    { paymentRequest: completedPR._id, approver: srAcc._id,    action: 'approved',  comments: 'GL coding verified, VAT compliant', fromStep: 'pending_senior_accountant', toStep: 'pending_budget_control', actionDate: new Date('2024-11-07') },
    { paymentRequest: completedPR._id, approver: budgetCtrl._id, action: 'approved', comments: 'Budget available', fromStep: 'pending_budget_control', toStep: 'pending_finance_manager', actionDate: new Date('2024-11-10') },
    { paymentRequest: completedPR._id, approver: finMgr._id,   action: 'approved',  comments: 'Cash flow OK, approved for payment', fromStep: 'pending_finance_manager', toStep: 'pending_treasury', actionDate: new Date('2024-11-13') },
    { paymentRequest: completedPR._id, approver: treasury._id, action: 'approved',  comments: 'Bank transfer processed', fromStep: 'pending_treasury', toStep: 'pending_filing', actionDate: new Date('2024-11-18'), stepData: { paymentAdviceNo: payment1.paymentAdviceNo } },
    { paymentRequest: completedPR._id, approver: filing._id,   action: 'approved',  comments: 'All documents archived', fromStep: 'pending_filing', toStep: 'completed', actionDate: new Date('2024-11-20') },
  ]);
  console.log('✅ Created approval trail');

  await AuditLog.insertMany([
    { user: users[0]._id, action: 'LOGIN',          module: 'Auth',           description: 'Admin logged in', severity: 'info' },
    { user: users[1]._id, action: 'CREATE_PR',      module: 'PaymentRequest', description: `Created request: ${completedPR.requestNumber}`, severity: 'info', resourceId: completedPR._id },
    { user: users[4]._id, action: 'APPROVAL_APPROVED', module: 'PaymentRequest', description: 'Dept Head approved request', severity: 'info', resourceId: completedPR._id },
    { user: jrAcc._id,    action: 'APPROVAL_FORWARDED', module: 'PaymentRequest', description: 'Jr. Accountant created PO + Quotation', severity: 'info', resourceId: completedPR._id },
    { user: srAcc._id,    action: 'APPROVAL_APPROVED', module: 'PaymentRequest', description: 'Sr. Accountant GL verified', severity: 'info', resourceId: completedPR._id },
    { user: treasury._id, action: 'PROCESS_PAYMENT', module: 'Payment', description: `Payment processed: ${payment1.paymentAdviceNo}`, severity: 'info', resourceId: payment1._id },
  ]);
  console.log('✅ Created audit logs');

  await Notification.insertMany([
    { recipient: users[4]._id,  sender: users[1]._id,  title: 'New Purchase Request',    message: `"${paymentRequests[1].title}" (${paymentRequests[1].requestNumber}) requires your approval`,   type: 'payment_request', paymentRequest: paymentRequests[1]._id, isRead: false },
    { recipient: jrAcc._id,     sender: users[4]._id,  title: 'Request Approved — Create PO', message: `"${paymentRequests[2].title}" approved. Please create PO and quotation.`,                  type: 'payment_request', paymentRequest: paymentRequests[2]._id, isRead: false },
    { recipient: srAcc._id,     sender: jrAcc._id,     title: 'PO Created — GL Review',  message: `"${paymentRequests[3].title}" PO created. Please review GL coding.`,                           type: 'payment_request', paymentRequest: paymentRequests[3]._id, isRead: false },
    { recipient: budgetCtrl._id,sender: srAcc._id,     title: 'GL Approved — Budget Check', message: `"${paymentRequests[4].title}" ready for budget verification.`,                               type: 'payment_request', paymentRequest: paymentRequests[4]._id, isRead: false },
    { recipient: users[1]._id,  sender: users[4]._id,  title: 'Request Rejected',        message: `"${paymentRequests[5].title}" was rejected: ${paymentRequests[5].rejectionReason}`,             type: 'rejection',        paymentRequest: paymentRequests[5]._id, isRead: false },
    { recipient: users[2]._id,  sender: users[4]._id,  title: 'Request Returned',        message: `"${paymentRequests[6].title}" returned for correction.`,                                        type: 'return',           paymentRequest: paymentRequests[6]._id, isRead: false },
    { recipient: finMgr._id,    sender: budgetCtrl._id,title: 'Finance Review Required', message: `"${paymentRequests[7].title}" awaiting your final approval.`,                                   type: 'payment_request', paymentRequest: paymentRequests[7]._id, isRead: false },
    { recipient: treasury._id,  sender: finMgr._id,    title: 'Process Payment',         message: `"${paymentRequests[8].title}" approved. Please process payment.`,                               type: 'payment_request', paymentRequest: paymentRequests[8]._id, isRead: false },
    { recipient: filing._id,    sender: treasury._id,  title: 'Archive Documents',       message: `"${paymentRequests[9].title}" payment done. Please archive all documents.`,                     type: 'payment',          paymentRequest: paymentRequests[9]._id, isRead: false },
  ]);
  console.log('✅ Created notifications');

  console.log('\n════════════════════════════════════════════════════════');
  console.log('🎉  Database seeded successfully!');
  console.log('════════════════════════════════════════════════════════');
  console.log('\n📋  LOGIN CREDENTIALS  (password: Password123)\n');
  [['admin','admin@erp.com'],['employee','john.smith@erp.com'],['employee','sarah.connor@erp.com'],
   ['department_head','emily.davis@erp.com'],['junior_accountant','lisa.anderson@erp.com'],
   ['senior_accountant','david.martinez@erp.com'],['budget_control','jennifer.taylor@erp.com'],
   ['finance_manager','william.brown@erp.com'],
  ].forEach(([r,e]) => console.log(`  ${r.padEnd(22)}  ${e}`));
  console.log('');
  await mongoose.connection.close();
  process.exit(0);
};

seed().catch((err) => {
  console.error('\n❌ Seed failed:', err.message);
  if (err.errors) Object.entries(err.errors).forEach(([f,e]) => console.error(`   → ${f}: ${e.message}`));
  process.exit(1);
});
