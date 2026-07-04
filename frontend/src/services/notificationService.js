import api from './api';

const notificationService = {
  getNotifications:    (params) => api.get('/notifications', { params }),
  markAsRead:          (ids)    => api.put('/notifications/read', { ids }),
  deleteNotification:  (id)     => api.delete(`/notifications/${id}`),
};

export default notificationService;
