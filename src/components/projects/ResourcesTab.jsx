'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function ResourcesTab({ projectId }) {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isUploading, setIsUploading] = useState(false);

  const { data: resources, error, isLoading, mutate } = useSWR(
    projectId ? `/api/projects/${projectId}/resources` : null,
    fetcher
  );

  const projectResources = resources?.resources || { internal: [], external: [] };
  const allResources = [...(projectResources.internal || []), ...(projectResources.external || [])];
  const filteredResources = selectedCategory === 'all' ? allResources : projectResources[selectedCategory] || [];

  const getTypeIcon = (type) => {
    switch (type) {
      case 'checklist':
        return '✅';
      case 'template':
        return '📋';
      case 'framework':
        return '🔄';
      case 'guidelines':
        return '📋';
      case 'templates':
        return '📄';
      case 'platform':
        return '💻';
      case 'research':
        return '🔍';
      case 'report':
        return '📊';
      default:
        return '📄';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'auto-retrieved':
        return 'text-blue-600';
      case 'added by user':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const handleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    setIsUploading(true);
    
    try {
      // Simulate file upload
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('projectId', projectId);

        // In real implementation, this would be an actual API call
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      mutate(); // Refresh resources
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg">
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex">
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
            <p className="text-sm text-gray-600 mt-1">
              Project documents, templates, and external references
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <label className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              {isUploading ? 'Uploading...' : 'Upload Files'}
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                disabled={isUploading}
              />
            </label>
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700">
              <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Add Link
            </button>
          </div>
        </div>

        {/* Category Filter */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'all', label: 'All Resources' },
            { id: 'internal', label: 'Internal Resources' },
            { id: 'external', label: 'External Resources' }
          ].map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                selectedCategory === category.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {category.label}
            </button>
          ))}
        </div>

        {/* Resources List */}
        <div className="space-y-3">
          {filteredResources.map((resource) => (
            <div
              key={resource.id}
              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">
                  {getTypeIcon(resource.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-sm font-medium text-gray-900">
                      {resource.name}
                    </h3>
                    {resource.confidence && (
                      <div className="flex items-center space-x-1">
                        <div className="w-12 h-1 bg-gray-200 rounded-full">
                          <div 
                            className="h-1 bg-blue-500 rounded-full" 
                            style={{ width: `${resource.confidence}%` }}
                          ></div>
                        </div>
                        <span className="text-xs text-gray-600">{resource.confidence}%</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
                  <div className="flex items-center space-x-4 mt-2">
                    <span className="text-xs text-gray-500 capitalize">
                      {resource.type}
                    </span>
                    <span className={`text-xs ${getStatusColor(resource.status)}`}>
                      {resource.status}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button className="p-1 text-gray-400 hover:text-gray-600" title="Download">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-gray-600" title="Share">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                  </svg>
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600" title="Remove">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredResources.length === 0 && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No resources yet</h3>
            <p className="text-gray-500 mb-4">Upload files or add links to get started</p>
            <label className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 cursor-pointer">
              Upload First Resource
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              />
            </label>
          </div>
        )}
      </div>

      {/* Right Sidebar - Resource Stats */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-4">Resource Summary</h3>
        
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">Internal Resources</div>
            <div className="text-2xl font-semibold text-blue-600 mb-1">{mockResources.internal.length}</div>
            <div className="text-xs text-gray-500">Templates, checklists, frameworks</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">External Resources</div>
            <div className="text-2xl font-semibold text-green-600 mb-1">{mockResources.external.length}</div>
            <div className="text-xs text-gray-500">Research, platforms, reports</div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm font-medium text-gray-900 mb-2">Auto-Retrieved</div>
            <div className="text-2xl font-semibold text-purple-600 mb-1">
              {allResources.filter(r => r.status === 'auto-retrieved').length}
            </div>
            <div className="text-xs text-gray-500">AI-suggested resources</div>
          </div>
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Recent Activity</h4>
          <div className="space-y-3">
            <div className="text-sm">
              <div className="text-gray-900">McKinsey Insights added</div>
              <div className="text-gray-500 text-xs">2 hours ago</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-900">Contract Template Library uploaded</div>
              <div className="text-gray-500 text-xs">1 day ago</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-900">Risk Assessment Guidelines auto-retrieved</div>
              <div className="text-gray-500 text-xs">2 days ago</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}