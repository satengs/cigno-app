import React from 'react';

const DeliverableSorter = ({ sortBy, sortOrder, onSortChange }) => {
  const sortOptions = [
    { value: 'due_date', label: 'Due Date' },
    { value: 'priority', label: 'Priority' },
    { value: 'status', label: 'Status' },
    { value: 'name', label: 'Name' },
    { value: 'created_at', label: 'Created Date' },
    { value: 'completion_percentage', label: 'Progress' }
  ];

  const handleSortByChange = (e) => {
    onSortChange(e.target.value, sortOrder);
  };

  const handleSortOrderChange = () => {
    onSortChange(sortBy, sortOrder === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="flex items-center space-x-4">
      <div className="flex items-center space-x-2">
        <label className="text-sm font-medium text-gray-700">Sort by:</label>
        <select
          value={sortBy}
          onChange={handleSortByChange}
          className="rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-sm"
        >
          {sortOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSortOrderChange}
        className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
      >
        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
        <span>{sortOrder === 'asc' ? 'Ascending' : 'Descending'}</span>
      </button>
    </div>
  );
};

export default DeliverableSorter;
