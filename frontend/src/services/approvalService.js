import api from './api';

const approvalService = {
  processApproval: (data)            => api.post('/approvals', data),
  getApprovals:    (paymentRequestId) => api.get(`/approvals/${paymentRequestId}`),
};

export default approvalService;
