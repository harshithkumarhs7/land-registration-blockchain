import React from 'react';
import { LandStatus } from '../types';

interface StatusBadgeProps {
  status: LandStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  let badgeStyle = 'bg-slate-100 text-slate-700 border-slate-300';

  switch (status) {
    case 'REGISTERED':
    case 'APPROVED':
    case 'COMPLETED':
    case 'ACTIVE':
    case 'VERIFIED':
      badgeStyle = 'bg-emerald-50 text-emerald-700 border-emerald-300';
      break;

    case 'PENDING_VERIFICATION':
    case 'PENDING':
    case 'UNDER_REVIEW':
      badgeStyle = 'bg-amber-50 text-amber-700 border-amber-300';
      break;

    case 'BLOCKCHAIN_PENDING':
    case 'TRANSFER_PENDING':
      badgeStyle = 'bg-blue-50 text-blue-700 border-blue-300 animate-pulse';
      break;

    case 'REJECTED':
    case 'BLOCKCHAIN_FAILED':
    case 'CANCELLED':
    case 'SUSPENDED':
      badgeStyle = 'bg-rose-50 text-rose-700 border-rose-300';
      break;

    default:
      break;
  }

  const label = status.replace(/_/g, ' ');

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeStyle} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></span>
      {label}
    </span>
  );
};
