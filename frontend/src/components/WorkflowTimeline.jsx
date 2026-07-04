import React from 'react';
import { WORKFLOW_STEPS } from '../utils/constants';
import { formatDateTime } from '../utils/formatters';

const WorkflowTimeline = ({ currentStep, approvals = [] }) => {
  const stepIndex = WORKFLOW_STEPS.findIndex((s) => s.key === currentStep);
  const isRejected = currentStep === 'rejected';
  const isReturned = currentStep === 'returned';

  const getApprovalForStep = (stepKey) => {
    return approvals.find((a) => a.fromStep === stepKey);
  };

  return (
    <div className="workflow-timeline">
      {WORKFLOW_STEPS.map((step, idx) => {
        const isDone   = idx < stepIndex || currentStep === 'completed';
        const isActive = step.key === currentStep;
        const approval = getApprovalForStep(step.key);

        let iconClass = 'pending';
        let icon = `${idx + 1}`;
        if (isDone)   { iconClass = 'done';   icon = '✓'; }
        if (isActive && !['completed','rejected','returned'].includes(currentStep)) { iconClass = 'active'; }
        if (isRejected && approval?.action === 'rejected') iconClass = 'danger';

        return (
          <div key={step.key} className="workflow-step">
            <div className={`workflow-step-icon ${iconClass}`} style={iconClass === 'danger' ? { background: '#dc3545', color: '#fff', boxShadow: '0 0 0 2px #dc3545' } : {}}>
              {icon}
            </div>
            <div className="ms-2">
              <div className="fw-semibold" style={{ fontSize: '0.85rem', color: isActive ? '#0d6efd' : '#343a40' }}>
                {step.label}
                {isActive && !['completed','rejected','returned'].includes(currentStep) && (
                  <span className="badge bg-primary ms-2" style={{ fontSize: '0.65rem' }}>Current</span>
                )}
              </div>
              {approval && (
                <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>
                  <span className={`badge me-1 ${approval.action === 'approved' || approval.action === 'forwarded' ? 'bg-success' : approval.action === 'rejected' ? 'bg-danger' : 'bg-warning text-dark'}`} style={{ fontSize: '0.65rem' }}>
                    {approval.action}
                  </span>
                  by {approval.approver?.firstName} {approval.approver?.lastName}
                  {approval.actionDate && <span className="ms-1 text-muted">· {formatDateTime(approval.actionDate)}</span>}
                  {approval.comments && <div className="fst-italic mt-1">"{approval.comments}"</div>}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {(isRejected || isReturned) && (
        <div className="workflow-step">
          <div className="workflow-step-icon" style={{ background: isRejected ? '#dc3545' : '#ffc107', color: '#fff', boxShadow: `0 0 0 2px ${isRejected ? '#dc3545' : '#ffc107'}` }}>
            <i className={`bi ${isRejected ? 'bi-x' : 'bi-arrow-return-left'}`} style={{ fontSize: '0.7rem' }}></i>
          </div>
          <div className="ms-2">
            <div className="fw-semibold" style={{ fontSize: '0.85rem', color: isRejected ? '#dc3545' : '#ffc107' }}>
              {isRejected ? 'Rejected' : 'Returned for Correction'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowTimeline;
