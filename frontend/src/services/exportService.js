import api from './api';

const exportService = {
  exportRequests: (params = {}) =>
    api.get('/export/requests', { params, responseType: 'blob' }),
  exportAuditLogs: (params = {}) =>
    api.get('/export/audit-logs', { params, responseType: 'blob' }),
  exportUsers: () =>
    api.get('/export/users', { responseType: 'blob' }),
  downloadPDF: (type, id) =>
    api.get(`/pdf/${type}/${id}`, { responseType: 'blob' }),
};

// Helper — trigger browser download from blob
export const downloadBlob = (blob, filename) => {
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export default exportService;
