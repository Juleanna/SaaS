import React from 'react';

interface EmptyStateProps {
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title = 'Нічого не знайдено',
  description,
  action,
  actionLabel,
  className = '',
}) => (
  <div className={`text-center py-16 px-6 ${className}`}>
    {Icon && (
      <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
    )}
    <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">{description}</p>
    )}
    {action && actionLabel && (
      <button
        onClick={action}
        className="inline-flex items-center px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl hover:shadow-lg hover:shadow-blue-500/25 transition-all"
      >
        {actionLabel}
      </button>
    )}
  </div>
);

export default EmptyState;
