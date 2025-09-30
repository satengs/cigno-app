'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import DeliverableList from '../../../../../components/deliverables/DeliverableList';
import CreateDeliverableModal from '../../../../../components/ui/CreateDeliverableModal';

const ProjectDeliverablesPage = () => {
  const params = useParams();
  const projectId = params.projectId;
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch project details
  useEffect(() => {
    const fetchProject = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/projects/${projectId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch project: ${response.status}`);
        }
        
        const data = await response.json();
        setProject(data.data.project);
        setError(null);
      } catch (err) {
        console.error('Error fetching project:', err);
        setError(err.message);
        // Mock data for development
        setProject({
          id: projectId,
          name: 'Global Banking Corp Digital Transformation',
          description: 'Strategic advisory services for digital transformation initiative',
          status: 'Active',
          client: {
            name: 'Global Banking Corp',
            industry: 'Financial Services'
          },
          start_date: '2024-01-15',
          end_date: '2024-06-30',
          budget: {
            amount: 500000,
            currency: 'USD',
            type: 'Fixed'
          }
        });
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchProject();
    }
  }, [projectId]);

  const handleDeliverableCreated = (newDeliverable) => {
    console.log('New deliverable created:', newDeliverable);
    setShowCreateModal(false);
    // The DeliverableList component will automatically refresh
  };

  const handleDeliverableSelect = (deliverable) => {
    console.log('Deliverable selected:', deliverable);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
        <span className="ml-4 text-lg text-gray-600">Loading project...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading project</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {project?.name || 'Project Deliverables'}
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                  {project?.description || 'Manage project deliverables and track progress'}
                </p>
                {project?.client && (
                  <div className="mt-2 flex items-center text-sm text-gray-500">
                    <span>Client: {project.client.name}</span>
                    {project.client.industry && (
                      <span className="ml-4">Industry: {project.client.industry}</span>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Create Deliverable
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DeliverableList 
          projectId={projectId}
          onDeliverableSelect={handleDeliverableSelect}
        />
      </div>

      {/* Create Deliverable Modal */}
      {showCreateModal && (
        <CreateDeliverableModal
          projectId={projectId}
          onClose={() => setShowCreateModal(false)}
          onDeliverableCreated={handleDeliverableCreated}
        />
      )}
    </div>
  );
};

export default ProjectDeliverablesPage;
