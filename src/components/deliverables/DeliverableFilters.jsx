import React from 'react';

const DeliverableFilters = ({ filters, onFilterChange, deliverables = [] }) => {
  // Extract unique values for filter options
  const statuses = [...new Set(deliverables.map(d => d.status))].filter(Boolean);
  const priorities = [...new Set(deliverables.map(d => d.priority))].filter(Boolean);
  const teamMembers = [...new Set(deliverables.flatMap(d => d.assigned_to || []).map(m => m.id))].filter(Boolean);
  const teamMemberNames = [...new Set(deliverables.flatMap(d => d.assigned_to || []).map(m => m.name))].filter(Boolean);

  const handleFilterChange = (filterType, value) => {
    onFilterChange({ [filterType]: value });
  };

  return (
    <div className="flex flex-wrap gap-4">
      {/* Status Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">Status</label>
        <select
          value={filters.status}
          onChange={(e) => handleFilterChange('status', e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
        >
          <option value="all">All Statuses</option>
          {statuses.map(status => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </div>

      {/* Priority Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">Priority</label>
        <select
          value={filters.priority}
          onChange={(e) => handleFilterChange('priority', e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
        >
          <option value="all">All Priorities</option>
          {priorities.map(priority => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </div>

      {/* Team Member Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">Team Member</label>
        <select
          value={filters.teamMember}
          onChange={(e) => handleFilterChange('teamMember', e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
        >
          <option value="all">All Team Members</option>
          {teamMemberNames.map((name, index) => (
            <option key={teamMembers[index] || name} value={teamMembers[index] || name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Date Range Filter */}
      <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">Due Date</label>
        <select
          value={filters.dateRange}
          onChange={(e) => handleFilterChange('dateRange', e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
        >
          <option value="all">All Dates</option>
          <option value="overdue">Overdue</option>
          <option value="today">Due Today</option>
          <option value="week">Due This Week</option>
          <option value="month">Due This Month</option>
        </select>
      </div>

      {/* Clear Filters */}
      <div className="flex items-end">
        <button
          onClick={() => onFilterChange({
            status: 'all',
            priority: 'all',
            teamMember: 'all',
            dateRange: 'all'
          })}
          className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
};

export default DeliverableFilters;
