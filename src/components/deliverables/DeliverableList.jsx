import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import PriorityIndicator from './PriorityIndicator';
import StatusTracker from './StatusTracker';
import DueDateTracker from './DueDateTracker';
import TeamMembers from './TeamMembers';
import DeliverableFilters from './DeliverableFilters';
import DeliverableSorter from './DeliverableSorter';
import DeliverableDetail from './DeliverableDetail';

const DeliverableList = ({ projectId, onDeliverableSelect }) => {
  const [deliverables, setDeliverables] = useState([]);
  const [filteredDeliverables, setFilteredDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    priority: 'all',
    teamMember: 'all',
    dateRange: 'all'
  });
  const [sortBy, setSortBy] = useState('due_date');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedDeliverable, setSelectedDeliverable] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  // Fetch deliverables for the project
  useEffect(() => {
    const fetchDeliverables = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/deliverables?projectId=${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch deliverables: ${response.status}`);
        }
        
        const data = await response.json();
        const deliverables = (data.data?.deliverables || []).map(deliverable => ({
          ...deliverable,
          id: deliverable._id || deliverable.id,
          assigned_to: deliverable.assigned_to || [],
          completion_percentage: deliverable.metrics?.completion_percentage || 0
        }));
        setDeliverables(deliverables);
        setError(null);
      } catch (err) {
        console.error('Error fetching deliverables:', err);
        setError(err.message);
        setDeliverables([]);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchDeliverables();
    }
  }, [projectId]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...deliverables];

    // Apply filters
    if (filters.status !== 'all') {
      filtered = filtered.filter(d => d.status === filters.status);
    }
    if (filters.priority !== 'all') {
      filtered = filtered.filter(d => d.priority === filters.priority);
    }
    if (filters.teamMember !== 'all') {
      filtered = filtered.filter(d => 
        d.assigned_to.some(member => member.id === filters.teamMember)
      );
    }
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const days = {
        'today': 0,
        'week': 7,
        'month': 30,
        'overdue': -1
      };
      
      if (filters.dateRange === 'overdue') {
        filtered = filtered.filter(d => new Date(d.due_date) < now);
      } else {
        const daysAhead = days[filters.dateRange];
        const futureDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(d => {
          const dueDate = new Date(d.due_date);
          return dueDate >= now && dueDate <= futureDate;
        });
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'due_date':
          aValue = new Date(a.due_date);
          bValue = new Date(b.due_date);
          break;
        case 'priority':
          const priorityOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
          aValue = priorityOrder[a.priority] || 0;
          bValue = priorityOrder[b.priority] || 0;
          break;
        case 'status':
          const statusOrder = { 'Completed': 5, 'In Progress': 4, 'Planning': 3, 'On Hold': 2, 'Cancelled': 1 };
          aValue = statusOrder[a.status] || 0;
          bValue = statusOrder[b.status] || 0;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        default:
          aValue = a[sortBy];
          bValue = b[sortBy];
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredDeliverables(filtered);
  }, [deliverables, filters, sortBy, sortOrder]);

  const handleDeliverableClick = (deliverable) => {
    setSelectedDeliverable(deliverable);
    setShowDetail(true);
    if (onDeliverableSelect) {
      onDeliverableSelect(deliverable);
    }
  };

  const handleCloseDetail = () => {
    setShowDetail(false);
    setSelectedDeliverable(null);
  };

  const handleFilterChange = (newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const handleSortChange = (newSortBy, newSortOrder) => {
    setSortBy(newSortBy);
    setSortOrder(newSortOrder);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        <span className="ml-2 text-gray-600">Loading deliverables...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading deliverables</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters and Sorting */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <DeliverableFilters 
            filters={filters} 
            onFilterChange={handleFilterChange}
            deliverables={deliverables}
          />
          <DeliverableSorter 
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        </div>
      </div>

      {/* Deliverables Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredDeliverables.map((deliverable) => (
          <div
            key={deliverable.id}
            onClick={() => handleDeliverableClick(deliverable)}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {deliverable.name}
              </h3>
              <PriorityIndicator priority={deliverable.priority} />
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Type:</span>
                <span className="text-sm font-medium text-gray-900">{deliverable.type}</span>
              </div>
              
              <StatusTracker 
                status={deliverable.status} 
                completionPercentage={deliverable.completion_percentage}
              />
              
              <DueDateTracker dueDate={deliverable.due_date} />
              
              <TeamMembers members={deliverable.assigned_to} />
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>Created {format(new Date(deliverable.created_at), 'MMM d, yyyy')}</span>
              <span className="text-purple-600 hover:text-purple-700">View Details →</span>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredDeliverables.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No deliverables found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {deliverables.length === 0 
              ? "Get started by creating your first deliverable."
              : "Try adjusting your filters to see more results."
            }
          </p>
        </div>
      )}

      {/* Deliverable Detail Modal */}
      {showDetail && selectedDeliverable && (
        <DeliverableDetail 
          deliverable={selectedDeliverable}
          onClose={handleCloseDetail}
        />
      )}
    </div>
  );
};

export default DeliverableList;
