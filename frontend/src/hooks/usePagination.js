import { useState, useCallback } from 'react';

const usePagination = (initialPage = 1, initialLimit = 10) => {
  const [page, setPage]   = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [total, setTotal] = useState(0);

  const pages = Math.ceil(total / limit) || 1;

  const goToPage = useCallback((p) => {
    if (p < 1 || p > pages) return;
    setPage(p);
  }, [pages]);

  const updateTotal = useCallback((t) => setTotal(t), []);

  return { page, limit, total, pages, setPage: goToPage, setLimit, updateTotal };
};

export default usePagination;
