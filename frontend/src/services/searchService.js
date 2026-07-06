import api from './api';

const searchService = {
  search: (q, type = 'all', page = 1, limit = 10) =>
    api.get('/search', { params: { q, type, page, limit } }),
};

export default searchService;
