import React from 'react';

interface StatusBadgeProps {
  status: 'nominal' | 'warning' | 'critical' | 'info';
  label: string;
  pulse?: boolean;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulse, className = '' }) => {
  let colorClasses = '';
  let dotColor = '';

  switch (status) {
    case 'nominal':
      colorClasses = 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20';
      dotColor = 'bg-emerald-500';
      break;
    case 'warning':
      colorClasses = 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
      dotColor = 'bg-amber-500';
      break;
    case 'critical':
      colorClasses = 'bg-red-500/10 text-red-500 border border-red-500/20';
      dotColor = 'bg-red-500';
      break;
    case 'info':
      colorClasses = 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      dotColor = 'bg-blue-500';
      break;
  }

  const pulseClass = pulse && status === 'critical' ? 'critical-pulse' : '';

  return (
    <div className={`badge flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${colorClasses} ${className}`}>
      <span className={`w-2 h-2 rounded-full ${dotColor} ${pulseClass}`}></span>
      {label}
    </div>
  );
};
