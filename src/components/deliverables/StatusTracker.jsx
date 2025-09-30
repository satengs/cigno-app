import React from 'react';

const StatusTracker = ({ status, completionPercentage = 0, showProgress = true }) => {
  const getStatusConfig = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '✅',
          label: 'Completed',
          progressColor: 'bg-green-500'
        };
      case 'in progress':
        return {
          color: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: '🔄',
          label: 'In Progress',
          progressColor: 'bg-blue-500'
        };
      case 'planning':
        return {
          color: 'bg-purple-100 text-purple-800 border-purple-200',
          icon: '📋',
          label: 'Planning',
          progressColor: 'bg-purple-500'
        };
      case 'on hold':
        return {
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: '⏸️',
          label: 'On Hold',
          progressColor: 'bg-yellow-500'
        };
      case 'cancelled':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '❌',
          label: 'Cancelled',
          progressColor: 'bg-red-500'
        };
      case 'draft':
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '📝',
          label: 'Draft',
          progressColor: 'bg-gray-500'
        };
      case 'in review':
        return {
          color: 'bg-indigo-100 text-indigo-800 border-indigo-200',
          icon: '👀',
          label: 'In Review',
          progressColor: 'bg-indigo-500'
        };
      case 'approved':
        return {
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          icon: '👍',
          label: 'Approved',
          progressColor: 'bg-emerald-500'
        };
      case 'delivered':
        return {
          color: 'bg-green-100 text-green-800 border-green-200',
          icon: '📤',
          label: 'Delivered',
          progressColor: 'bg-green-500'
        };
      case 'rejected':
        return {
          color: 'bg-red-100 text-red-800 border-red-200',
          icon: '👎',
          label: 'Rejected',
          progressColor: 'bg-red-500'
        };
      default:
        return {
          color: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: '❓',
          label: 'Unknown',
          progressColor: 'bg-gray-500'
        };
    }
  };

  const config = getStatusConfig(status);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Status:</span>
        <div className={`inline-flex items-center rounded-full border px-2.5 py-1.5 text-sm font-medium ${config.color}`}>
          <span className="mr-1">{config.icon}</span>
          <span>{config.label}</span>
        </div>
      </div>
      
      {showProgress && status?.toLowerCase() !== 'completed' && status?.toLowerCase() !== 'cancelled' && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${config.progressColor}`}
              style={{ width: `${Math.min(100, Math.max(0, completionPercentage))}%` }}
            ></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatusTracker;
