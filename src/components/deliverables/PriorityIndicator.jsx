import React from 'react';

const PriorityIndicator = ({ priority, size = 'default' }) => {
  const getPriorityConfig = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '🔴',
          label: 'Critical'
        };
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 border-orange-200',
          icon: '🟠',
          label: 'High'
        };
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '🟡',
          label: 'Medium'
        };
      case 'low':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '🟢',
          label: 'Low'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '⚪',
          label: 'Unknown'
        };
    }
  };

  const config = getPriorityConfig(priority);
  const sizeClasses = {
    small: 'px-2 py-1 text-xs',
    default: 'px-2.5 py-1.5 text-sm',
    large: 'px-3 py-2 text-base'
  };

  return (
    <div className={`inline-flex items-center rounded-full border font-medium ${config.color} ${sizeClasses[size]}`}>
      <span className="mr-1">{config.icon}</span>
      <span>{config.label}</span>
    </div>
  );
};

export default PriorityIndicator;
