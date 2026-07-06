import api from './api';

const commentService = {
  getComments:   (prId)        => api.get(`/payment-requests/${prId}/comments`),
  addComment:    (prId, text)  => api.post(`/payment-requests/${prId}/comments`, { text }),
  deleteComment: (prId, cId)  => api.delete(`/payment-requests/${prId}/comments/${cId}`),
};

export default commentService;
