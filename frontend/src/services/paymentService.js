import api from './api';

const paymentService = {
  processPayment: (data)   => api.post('/payments', data),
  getPayments:    (params) => api.get('/payments', { params }),
  getPayment:     (id)     => api.get(`/payments/${id}`),
};

export default paymentService;
