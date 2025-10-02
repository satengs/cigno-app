'use client';

import { useState } from 'react';
import useSWR from 'swr';
import DeliverableList from '../deliverables/DeliverableList';
import DeliverableModal from '../deliverables/DeliverableModal';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function DeliverablesTab({ projectId }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignee: '',
    search: ''
  });

  const { data: deliverables, error, isLoading, mutate } = useSWR(
    projectId ? `/api/projects/${projectId}/deliverables` : null,
    fetcher
  );

  const handleCreateDeliverable = () => {
    setSelectedDeliverable(null);
    setIsModalOpen(true);
  };

  const handleEditDeliverable = (deliverable) => {
    setSelectedDeliverable(deliverable);
    setIsModalOpen(true);
  };

  const handleDeleteDeliverable = async (deliverableId) => {
    if (!confirm('Are you sure you want to delete this deliverable?')) return;

    try {
      const response = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        mutate(); // Refresh the list
      } else {
        console.error('Failed to delete deliverable');
      }
    } catch (error) {
      console.error('Error deleting deliverable:', error);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDeliverable(null);
    mutate(); // Refresh the list
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Deliverables</h3>
          <p className="text-gray-600">Unable to load project deliverables. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Deliverables</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage project deliverables, track progress, and monitor deadlines
          </p>
        </div>
        <button
          onClick={handleCreateDeliverable}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Deliverable
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="p-4 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="review">Under Review</option>
                <option value="complete">Complete</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
              <select
                value={filters.priority}
                onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Priorities</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Assignee</label>
              <select
                value={filters.assignee}
                onChange={(e) => setFilters({ ...filters, assignee: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Assignees</option>
                <option value="john-doe">John Doe</option>
                <option value="jane-smith">Jane Smith</option>
                <option value="mike-johnson">Mike Johnson</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <input
                type="text"
                placeholder="Search deliverables..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Deliverables List */}
      <DeliverableList
        deliverables={deliverables || []}
        isLoading={isLoading}
        filters={filters}
        onEdit={handleEditDeliverable}
        onDelete={handleDeleteDeliverable}
      />

      {/* Modal */}
      {isModalOpen && (
        <DeliverableModal
          projectId={projectId}
          deliverable={selectedDeliverable}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
}