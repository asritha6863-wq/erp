import React from 'react';
import { STATUS_CONFIG } from '../utils/constants';

const COLOR_MAP = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
  success: 'bg-success',
  danger: 'bg-danger',
  warning: 'bg-warning text-dark',
  info: 'bg-info text-dark',
  dark: 'bg-dark',
  purple: 'bg-purple',
  teal: 'bg-teal',
  orange: 'bg-orange',
};

const INLINE_COLORS = {
  purple: '#6f42c1',
  teal:   '#20c997',
  orange: '#fd7e14',
};

const StatusBadge = ({ status, className = '' }) => {
  const config  = STATUS_CONFIG[status] || { label: status, color: 'secondary', icon: 'bi-circle' };
  const bsClass = COLOR_MAP[config.color];
  const style   = INLINE_COLORS[config.color] ? { background: INLINE_COLORS[config.color], color: '#fff' } : {};

  return (
    <span
      className={`badge workflow-badge ${bsClass || ''} ${className}`}
      style={style}
    >
      <i className={`bi ${config.icon} me-1`}></i>
      {config.label}
    </span>
  );
};

export default StatusBadge;
