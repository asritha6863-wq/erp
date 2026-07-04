import React from 'react';

const Pagination = ({ page, pages, total, limit, onPageChange }) => {
  if (pages <= 1) return null;

  const from = (page - 1) * limit + 1;
  const to   = Math.min(page * limit, total);

  const getPages = () => {
    const arr = [];
    const delta = 2;
    for (let i = Math.max(1, page - delta); i <= Math.min(pages, page + delta); i++) arr.push(i);
    if (arr[0] > 1) { arr.unshift('...'); arr.unshift(1); }
    if (arr[arr.length - 1] < pages) { arr.push('...'); arr.push(pages); }
    return arr;
  };

  return (
    <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-3">
      <div className="text-muted" style={{ fontSize: '0.82rem' }}>
        Showing {from}–{to} of {total} records
      </div>
      <nav>
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${page === 1 ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page - 1)}>
              <i className="bi bi-chevron-left"></i>
            </button>
          </li>
          {getPages().map((p, idx) => (
            <li key={idx} className={`page-item ${p === page ? 'active' : ''} ${p === '...' ? 'disabled' : ''}`}>
              <button className="page-link" onClick={() => p !== '...' && onPageChange(p)}>
                {p}
              </button>
            </li>
          ))}
          <li className={`page-item ${page === pages ? 'disabled' : ''}`}>
            <button className="page-link" onClick={() => onPageChange(page + 1)}>
              <i className="bi bi-chevron-right"></i>
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
};

export default Pagination;
