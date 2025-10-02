'use client';

import { useState } from 'react';
import { format } from 'date-fns';

export default function ProjectHeader({ project }) {
  const [isExporting, setIsExporting] = useState(false);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'in_progress':
        return 'bg-green-100 text-green-800';
      case 'on_hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/projects/${project._id}/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: 'pdf' })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}-export.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-6">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
              {project.status || 'Active'}
            </span>
            {project.priority && (
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(project.priority)}`}>
                {project.priority} Priority
              </span>
            )}
          </div>
          
          {project.description && (
            <p className="text-gray-600 mb-4 max-w-3xl">{project.description}</p>
          )}

          <div className="flex items-center gap-6 text-sm text-gray-500">
            {project.client_name && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Client:</span>
                <span>{project.client_name}</span>
              </div>
            )}
            {project.start_date && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Start:</span>
                <span>{format(new Date(project.start_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {project.end_date && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Due:</span>
                <span>{format(new Date(project.end_date), 'MMM d, yyyy')}</span>
              </div>
            )}
            {project.assigned_team?.length > 0 && (
              <div className="flex items-center gap-1">
                <span className="font-medium">Team:</span>
                <span>{project.assigned_team.length} members</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                Exporting...
              </>
            ) : (
              <>
                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </>
            )}
          </button>
          
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
            <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit Project
          </button>
        </div>
      </div>

      {/* Project Health Summary */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Overall Progress</div>
          <div className="mt-1 flex items-center">
            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${project.progress_percentage || 0}%` }}
              ></div>
            </div>
            <span className="text-sm font-semibold text-gray-900">{project.progress_percentage || 0}%</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Deliverables</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {project.deliverables_count || 0}
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Budget Used</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {project.budget_percentage || 0}%
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-4">
          <div className="text-sm font-medium text-gray-500">Days Remaining</div>
          <div className="mt-1 text-2xl font-semibold text-gray-900">
            {project.days_remaining || '-'}
          </div>
        </div>
      </div>
    </div>
  );
}