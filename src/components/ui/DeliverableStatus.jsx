'use client';

import { useState } from 'react';
import { Clock, AlertTriangle, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

export default function DeliverableStatus({ 
  deliverable = {}, 
  showDetails = false,
  className = '' 
}) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Return early if deliverable is not provided
  if (!deliverable || Object.keys(deliverable).length === 0) {
    return (
      <div className={`text-sm text-gray-500 ${className}`}>
        No deliverable data available
      </div>
    );
  }

  // Get priority configuration
  const getPriorityConfig = (priority) => {
    switch (priority) {
      case 'urgent':
        return {
          label: 'Urgent',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: AlertTriangle
        };
      case 'high':
        return {
          label: 'High',
          color: 'text-orange-500',
          bgColor: 'bg-orange-100 dark:bg-orange-900/20',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: AlertTriangle
        };
      case 'medium':
        return {
          label: 'Medium',
          color: 'text-yellow-500',
          bgColor: 'bg-yellow-100 dark:bg-yellow-900/20',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: Clock
        };
      case 'low':
        return {
          label: 'Low',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: MinusCircle
        };
      default:
        return {
          label: 'Medium',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
          icon: Clock
        };
    }
  };

  // Get status configuration
  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return {
          label: 'Completed',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
      case 'in-progress':
        return {
          label: 'In Progress',
          color: 'text-blue-500',
          bgColor: 'bg-blue-100 dark:bg-blue-900/20',
          borderColor: 'border-blue-200 dark:border-blue-800',
          icon: Clock
        };
      case 'not-started':
        return {
          label: 'Not Started',
          color: 'text-gray-500',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          borderColor: 'border-gray-200 dark:border-gray-700',
          icon: MinusCircle
        };
      case 'blocked':
        return {
          label: 'Blocked',
          color: 'text-red-500',
          bgColor: 'bg-red-100 dark:bg-red-900/20',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: XCircle
        };
      default:
        return {
          label: 'Active',
          color: 'text-green-500',
          bgColor: 'bg-green-100 dark:bg-green-900/20',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: CheckCircle
        };
    }
  };

  // Check if deliverable is overdue
  const isOverdue = () => {
    if (!deliverable.dueDate && !deliverable.due_date) return false;
    const dueDate = new Date(deliverable.dueDate || deliverable.due_date);
    const today = new Date();
    return dueDate < today && deliverable.status !== 'completed';
  };

  // Get days until due or overdue
  const getDueInfo = () => {
    if (!deliverable.dueDate && !deliverable.due_date) return null;
    
    const dueDate = new Date(deliverable.dueDate || deliverable.due_date);
    const today = new Date();
    const diffTime = dueDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days overdue`, color: 'text-red-500' };
    } else if (diffDays === 0) {
      return { text: 'Due today', color: 'text-orange-500' };
    } else if (diffDays === 1) {
      return { text: 'Due tomorrow', color: 'text-yellow-500' };
    } else if (diffDays <= 7) {
      return { text: `Due in ${diffDays} days`, color: 'text-yellow-500' };
    } else {
      return { text: `Due in ${diffDays} days`, color: 'text-gray-500' };
    }
  };

  const priorityConfig = getPriorityConfig(deliverable.priority || 'medium');
  const statusConfig = getStatusConfig(deliverable.status || 'draft');
  const dueInfo = getDueInfo();
  const PriorityIcon = priorityConfig.icon;
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Priority and Status Row */}
      <div className="flex items-center justify-between gap-2">
        {/* Priority Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${priorityConfig.bgColor} ${priorityConfig.borderColor} ${priorityConfig.color}`}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          <PriorityIcon className="w-3 h-3" />
          {priorityConfig.label}
        </div>

        {/* Status Badge */}
        <div
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${statusConfig.bgColor} ${statusConfig.borderColor} ${statusConfig.color}`}
        >
          <StatusIcon className="w-3 h-3" />
          {statusConfig.label}
        </div>
      </div>

      {/* Due Date Info */}
      {dueInfo && (
        <div className={`text-xs font-medium ${dueInfo.color}`}>
          {dueInfo.text}
        </div>
      )}

      {/* Overdue Warning */}
      {isOverdue() && (
        <div className="text-xs text-red-500 font-medium flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Overdue
        </div>
      )}

      {/* Additional Details (when showDetails is true) */}
      {showDetails && (
        <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--border-secondary)' }}>
          {/* Team Members */}
          {deliverable.teamMembers && deliverable.teamMembers.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Team: {Array.isArray(deliverable.teamMembers) ? deliverable.teamMembers.join(', ') : deliverable.teamMembers}
            </div>
          )}

          {/* Assigned To */}
          {deliverable.assigned_to && deliverable.assigned_to.length > 0 && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              Assigned: {Array.isArray(deliverable.assigned_to) ? deliverable.assigned_to.length : 1} member(s)
            </div>
          )}

          {/* Brief Preview */}
          {deliverable.brief && (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="font-medium mb-1">Brief:</div>
              <div className="line-clamp-2">
                {deliverable.brief.length > 100 
                  ? `${deliverable.brief.substring(0, 100)}...` 
                  : deliverable.brief
                }
              </div>
            </div>
          )}

          {/* Progress Indicators */}
          <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
            <span>Insights: {deliverable.insights?.length || 0}</span>
            <span>Materials: {deliverable.materials?.length || 0}</span>
            <span>Storyline: {deliverable.storyline ? '✓' : '✗'}</span>
          </div>
        </div>
      )}
    </div>
  );
}
