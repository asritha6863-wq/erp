import api from './api';

const departmentService = {
  getDepartments:   (params) => api.get('/departments', { params }),
  getDepartment:    (id)     => api.get(`/departments/${id}`),
  createDepartment: (data)   => api.post('/departments', data),
  updateDepartment: (id, data) => api.put(`/departments/${id}`, data),
  deleteDepartment: (id)     => api.delete(`/departments/${id}`),
};

export default departmentService;
