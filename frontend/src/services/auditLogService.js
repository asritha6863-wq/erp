import api from './api';

const auditLogService = {
  getLogs: (params) => api.get('/audit-logs', { params }),
};

export default auditLogService;
