'use client';

import { useState } from 'react';

export default function DeliverableModal({ projectId, deliverable, onClose }) {
  const [formData, setFormData] = useState({
    title: deliverable?.title || '',
    description: deliverable?.description || '',
    type: deliverable?.type || 'presentation',
    format: deliverable?.format || 'PPT',
    status: deliverable?.status || 'draft',
    priority: deliverable?.priority || 'medium',
    due_date: deliverable?.due_date || '',
    audience: deliverable?.audience || [],
    assigned_team: deliverable?.assigned_team || [],
    pages: deliverable?.pages || 25,
    brief: deliverable?.brief || ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const audienceOptions = [
    'Board of Directors',
    'Technical Teams', 
    'Senior Management',
    'Regulatory Bodies',
    'Stakeholders'
  ];

  const teamOptions = [
    'john-doe',
    'jane-smith', 
    'mike-johnson',
    'sarah-wilson'
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const url = deliverable 
        ? `/api/deliverables/${deliverable._id}`
        : `/api/projects/${projectId}/deliverables`;
      
      const method = deliverable ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          project_id: projectId
        })
      });

      if (response.ok) {
        onClose();
      } else {
        console.error('Failed to save deliverable');
      }
    } catch (error) {
      console.error('Error saving deliverable:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAudienceToggle = (audience) => {
    setFormData(prev => ({
      ...prev,
      audience: prev.audience.includes(audience)
        ? prev.audience.filter(a => a !== audience)
        : [...prev.audience, audience]
    }));
  };

  const handleTeamToggle = (member) => {
    setFormData(prev => ({
      ...prev,
      assigned_team: prev.assigned_team.includes(member)
        ? prev.assigned_team.filter(m => m !== member)
        : [...prev.assigned_team, member]
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {deliverable ? 'Edit Deliverable' : 'Create New Deliverable'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter deliverable name..."
              required
            />
            <p className="text-xs text-gray-500 mt-1">From: Client Proposal Document</p>
          </div>

          {/* Type and Format */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="presentation">Strategy Presentation</option>
                <option value="report">Technical Report</option>
                <option value="strategy">Implementation Strategy</option>
                <option value="analysis">Market Analysis</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">From: Project Brief</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format
              </label>
              <div className="flex space-x-2">
                {['PPT', 'DOC', 'XLS'].map((format) => (
                  <button
                    key={format}
                    type="button"
                    onClick={() => setFormData({ ...formData, format })}
                    className={`px-3 py-1 text-xs rounded border ${
                      formData.format === format
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1">From: Client Requirements</p>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience
            </label>
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((audience) => (
                <button
                  key={audience}
                  type="button"
                  onClick={() => handleAudienceToggle(audience)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    formData.audience.includes(audience)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {audience}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">From: Stakeholder Analysis</p>
          </div>

          {/* Due Date and Size */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Due Date
              </label>
              <input
                type="date"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">From: Project Timeline</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Size
              </label>
              <select
                value={formData.pages}
                onChange={(e) => setFormData({ ...formData, pages: parseInt(e.target.value) })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value={15}>15 slides</option>
                <option value={25}>25 slides</option>
                <option value={35}>35 slides</option>
                <option value={50}>50 slides</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">From: Scope Document</p>
            </div>
          </div>

          {/* Brief */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Brief
            </label>
            <textarea
              value={formData.brief}
              onChange={(e) => setFormData({ ...formData, brief: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities..."
            />
          </div>

          {/* Assigned Team */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assigned Team
            </label>
            <div className="flex flex-wrap gap-2">
              {teamOptions.map((member) => (
                <button
                  key={member}
                  type="button"
                  onClick={() => handleTeamToggle(member)}
                  className={`px-3 py-1 text-xs rounded-full border ${
                    formData.assigned_team.includes(member)
                      ? 'bg-blue-100 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {member.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gray-900 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900 disabled:opacity-50"
            >
              {isSubmitting ? 'Creating...' : (deliverable ? 'Update Deliverable' : 'Create Deliverable')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}