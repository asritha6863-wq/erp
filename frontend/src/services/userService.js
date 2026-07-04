import api from './api';

const userService = {
  getUsers:       (params) => api.get('/users', { params }),
  getUser:        (id)     => api.get(`/users/${id}`),
  createUser:     (data)   => api.post('/users', data),
  updateUser:     (id, data) => api.put(`/users/${id}`, data),
  deleteUser:     (id)     => api.delete(`/users/${id}`),
  toggleStatus:   (id)     => api.put(`/users/${id}/toggle-status`),
  resetPassword:  (id, password) => api.put(`/users/${id}/reset-password`, { password }),
};

export default userService;
