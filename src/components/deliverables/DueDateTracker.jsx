import React from 'react';
import { format, isAfter, isBefore, differenceInDays } from 'date-fns';

const DueDateTracker = ({ dueDate, showIcon = true }) => {
  if (!dueDate) {
    return (
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-600">Due Date:</span>
        <span className="text-sm text-gray-400">Not set</span>
      </div>
    );
  }

  const now = new Date();
  const due = new Date(dueDate);
  const daysUntilDue = differenceInDays(due, now);
  const isOverdue = isBefore(due, now);
  const isDueSoon = daysUntilDue <= 3 && daysUntilDue >= 0;
  const isDueToday = daysUntilDue === 0;

  const getDueDateConfig = () => {
    if (isOverdue) {
      return {
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '⚠️',
        label: 'Overdue',
        text: `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) === 1 ? '' : 's'} overdue`
      };
    } else if (isDueToday) {
      return {
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        icon: '🔥',
        label: 'Due Today',
        text: 'Due today'
      };
    } else if (isDueSoon) {
      return {
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        icon: '⏰',
        label: 'Due Soon',
        text: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
      };
    } else {
      return {
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        borderColor: 'border-gray-200',
        icon: '📅',
        label: 'Due Later',
        text: `Due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`
      };
    }
  };

  const config = getDueDateConfig();

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600">Due Date:</span>
      <div className={`inline-flex items-center rounded-md border px-2 py-1 text-sm font-medium ${config.bgColor} ${config.borderColor} ${config.color}`}>
        {showIcon && <span className="mr-1">{config.icon}</span>}
        <span>{format(due, 'MMM d, yyyy')}</span>
      </div>
    </div>
  );
};

export default DueDateTracker;
