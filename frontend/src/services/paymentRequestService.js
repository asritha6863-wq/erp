import api from './api';

const paymentRequestService = {
  getRequests:   (params) => api.get('/payment-requests', { params }),
  getRequest:    (id)     => api.get(`/payment-requests/${id}`),
  createRequest: (data)   => api.post('/payment-requests', data),
  updateRequest: (id, data) => api.put(`/payment-requests/${id}`, data),
  deleteRequest: (id)     => api.delete(`/payment-requests/${id}`),
  submitRequest: (id)     => api.put(`/payment-requests/${id}/submit`),

  uploadAttachments: (id, formData) =>
    api.post(`/payment-requests/${id}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};

export default paymentRequestService;
