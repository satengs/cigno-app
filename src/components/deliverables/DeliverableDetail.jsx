import React, { useState } from 'react';
import { format } from 'date-fns';
import PriorityIndicator from './PriorityIndicator';
import StatusTracker from './StatusTracker';
import DueDateTracker from './DueDateTracker';
import TeamMembers from './TeamMembers';

const DeliverableDetail = ({ deliverable, onClose, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeliverable, setEditedDeliverable] = useState(deliverable);

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the deliverable
      console.log('Saving deliverable:', editedDeliverable);
      setIsEditing(false);
      if (onEdit) {
        onEdit(editedDeliverable);
      }
    } catch (error) {
      console.error('Error saving deliverable:', error);
    }
  };

  const handleCancel = () => {
    setEditedDeliverable(deliverable);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this deliverable?')) {
      try {
        // Here you would typically make an API call to delete the deliverable
        console.log('Deleting deliverable:', deliverable.id);
        if (onDelete) {
          onDelete(deliverable.id);
        }
        onClose();
      } catch (error) {
        console.error('Error deleting deliverable:', error);
      }
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedDeliverable(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {isEditing ? 'Edit Deliverable' : 'Deliverable Details'}
          </h2>
          <div className="flex items-center space-x-2">
            {!isEditing && (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  Edit
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  Delete
                </button>
              </>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deliverable Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={editedDeliverable.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <p className="text-lg font-semibold text-gray-900">{deliverable.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              {isEditing ? (
                <select
                  value={editedDeliverable.type}
                  onChange={(e) => handleFieldChange('type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Presentation">Presentation</option>
                  <option value="Report">Report</option>
                  <option value="Strategy">Strategy</option>
                  <option value="Analysis">Analysis</option>
                  <option value="Design">Design</option>
                  <option value="Code">Code</option>
                  <option value="Documentation">Documentation</option>
                  <option value="Other">Other</option>
                </select>
              ) : (
                <p className="text-lg text-gray-900">{deliverable.type}</p>
              )}
            </div>
          </div>

          {/* Status and Priority */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              {isEditing ? (
                <select
                  value={editedDeliverable.status}
                  onChange={(e) => handleFieldChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Planning">Planning</option>
                  <option value="In Progress">In Progress</option>
                  <option value="In Review">In Review</option>
                  <option value="Approved">Approved</option>
                  <option value="Completed">Completed</option>
                  <option value="Delivered">Delivered</option>
                  <option value="On Hold">On Hold</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Rejected">Rejected</option>
                </select>
              ) : (
                <StatusTracker 
                  status={deliverable.status} 
                  completionPercentage={deliverable.completion_percentage}
                  showProgress={false}
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              {isEditing ? (
                <select
                  value={editedDeliverable.priority}
                  onChange={(e) => handleFieldChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              ) : (
                <PriorityIndicator priority={deliverable.priority} />
              )}
            </div>
          </div>

          {/* Due Date and Progress */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              {isEditing ? (
                <input
                  type="date"
                  value={editedDeliverable.due_date ? format(new Date(editedDeliverable.due_date), 'yyyy-MM-dd') : ''}
                  onChange={(e) => handleFieldChange('due_date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              ) : (
                <DueDateTracker dueDate={deliverable.due_date} showIcon={false} />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Progress
              </label>
              {isEditing ? (
                <div className="space-y-2">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={editedDeliverable.completion_percentage || 0}
                    onChange={(e) => handleFieldChange('completion_percentage', parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>0%</span>
                    <span className="font-medium">{editedDeliverable.completion_percentage || 0}%</span>
                    <span>100%</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium text-gray-900">{deliverable.completion_percentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-purple-500 transition-all duration-300"
                      style={{ width: `${Math.min(100, Math.max(0, deliverable.completion_percentage || 0))}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Team Members */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Team Members
            </label>
            <TeamMembers 
              members={deliverable.assigned_to || []} 
              maxDisplay={10}
              showCount={true}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            {isEditing ? (
              <textarea
                value={editedDeliverable.description || ''}
                onChange={(e) => handleFieldChange('description', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter deliverable description..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {deliverable.description || 'No description provided'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            {isEditing ? (
              <textarea
                value={editedDeliverable.notes || ''}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Enter notes..."
              />
            ) : (
              <p className="text-gray-900 whitespace-pre-wrap">
                {deliverable.notes || 'No notes'}
              </p>
            )}
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Created
              </label>
              <p className="text-sm text-gray-600">
                {format(new Date(deliverable.created_at), 'MMM d, yyyy')}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Updated
              </label>
              <p className="text-sm text-gray-600">
                {format(new Date(deliverable.updated_at || deliverable.created_at), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end space-x-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              Save Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeliverableDetail;
