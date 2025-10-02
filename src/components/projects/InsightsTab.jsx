'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function InsightsTab({ projectId }) {
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: insights, error, isLoading, mutate } = useSWR(
    projectId ? `/api/projects/${projectId}/insights` : null,
    fetcher
  );

  const projectInsights = insights?.insights || [];

  const getConfidenceColor = (confidence) => {
    if (confidence >= 85) return 'text-green-600';
    if (confidence >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'Market Research':
        return 'bg-blue-100 text-blue-800';
      case 'Strategic Planning':
        return 'bg-purple-100 text-purple-800';
      case 'Financial Analysis':
        return 'bg-green-100 text-green-800';
      case 'Regulatory':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleSaveInsight = async (insightData) => {
    try {
      const response = await fetch(`/api/projects/${projectId}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(insightData)
      });

      if (response.ok) {
        mutate(); // Refresh the list
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Insights</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI-generated and manual insights to support project decisions
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Insight
        </button>
      </div>

      {/* Insights Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projectInsights.map((insight) => (
          <div
            key={insight.id}
            className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => setSelectedInsight(insight)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-sm font-medium text-gray-900 leading-tight mb-2">
                  {insight.title}
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(insight.category)}`}>
                  {insight.category}
                </span>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </button>
            </div>

            <p className="text-sm text-gray-600 mb-4 line-clamp-3">
              {insight.content}
            </p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-3">
                <span>{insight.source}</span>
                <span>{insight.created_by}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>Confidence:</span>
                <div className="flex items-center">
                  <div className="w-12 h-1 bg-gray-200 rounded-full">
                    <div 
                      className={`h-1 rounded-full ${
                        insight.confidence >= 85 ? 'bg-green-500' :
                        insight.confidence >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${insight.confidence}%` }}
                    ></div>
                  </div>
                  <span className={`ml-1 font-medium ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence}%
                  </span>
                </div>
              </div>
            </div>

            {insight.tags && (
              <div className="flex flex-wrap gap-1 mt-3">
                {insight.tags.slice(0, 3).map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                  >
                    {tag}
                  </span>
                ))}
                {insight.tags.length > 3 && (
                  <span className="text-xs text-gray-500">
                    +{insight.tags.length - 3} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add empty state if no insights */}
      {projectInsights.length === 0 && (
        <div className="text-center py-12">
          <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No insights yet</h3>
          <p className="text-gray-500 mb-4">Start by adding manual insights or generate them using AI</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            Add First Insight
          </button>
        </div>
      )}

      {/* Insight Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Insight Details</h2>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {selectedInsight.title}
                </h3>
                <div className="flex items-center space-x-3 mb-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(selectedInsight.category)}`}>
                    {selectedInsight.category}
                  </span>
                  <div className="flex items-center space-x-2 text-sm text-gray-500">
                    <span>Confidence:</span>
                    <span className={`font-medium ${getConfidenceColor(selectedInsight.confidence)}`}>
                      {selectedInsight.confidence}%
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="prose max-w-none mb-6">
                <p className="text-gray-700">{selectedInsight.content}</p>
              </div>
              
              <div className="border-t border-gray-200 pt-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Source:</span>
                    <span className="text-gray-600 ml-2">{selectedInsight.source}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Created by:</span>
                    <span className="text-gray-600 ml-2">{selectedInsight.created_by}</span>
                  </div>
                </div>
                
                {selectedInsight.tags && (
                  <div className="mt-4">
                    <span className="font-medium text-gray-900 text-sm">Tags:</span>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedInsight.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Insight Modal */}
      {isModalOpen && (
        <AddInsightModal
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveInsight}
        />
      )}
    </div>
  );
}

function AddInsightModal({ onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    source: '',
    category: 'Market Research',
    confidence: 80,
    tags: []
  });

  const [tagInput, setTagInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Add New Insight</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter insight title..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={4}
              placeholder="Describe the insight in detail..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source
              </label>
              <input
                type="text"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Research source..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Market Research">Market Research</option>
                <option value="Strategic Planning">Strategic Planning</option>
                <option value="Financial Analysis">Financial Analysis</option>
                <option value="Regulatory">Regulatory</option>
                <option value="Technical">Technical</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Level: {formData.confidence}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.confidence}
              onChange={(e) => setFormData({ ...formData, confidence: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <div className="flex space-x-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Add a tag..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2 bg-gray-200 text-gray-700 rounded-md text-sm hover:bg-gray-300"
              >
                Add
              </button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {formData.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

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
              className="bg-blue-600 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
            >
              Add Insight
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}