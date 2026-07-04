import api from './api';

const authService = {
  login:         (email, password) => api.post('/auth/login', { email, password }),
  logout:        ()                => api.post('/auth/logout'),
  getProfile:    ()                => api.get('/auth/profile'),
  updateProfile: (data)            => api.put('/auth/profile', data),
};

export default authService;
