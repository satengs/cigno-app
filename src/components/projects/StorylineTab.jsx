'use client';

import { useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function StorylineTab({ projectId }) {
  const [activeView, setActiveView] = useState('storyline'); // 'storyline', 'detailed', 'layout'
  const [selectedSection, setSelectedSection] = useState(null);

  const { data: storyline, error, isLoading } = useSWR(
    projectId ? `/api/projects/${projectId}/storyline` : null,
    fetcher
  );

  const sections = storyline?.sections || [];

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'final':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'not started':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="border border-gray-200 rounded-lg p-4">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full"></div>
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
        {/* View Toggle */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
          {[
            { id: 'storyline', label: 'Storyline' },
            { id: 'detailed', label: 'Detailed' },
            { id: 'layout', label: 'Layout' }
          ].map((view) => (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                activeView === view.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {view.label}
            </button>
          ))}
        </div>

        {activeView === 'storyline' && (
          <div className="space-y-3">
            {sections.map((section) => (
              <div
                key={section.id}
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  selectedSection?.id === section.id
                    ? 'border-blue-300 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setSelectedSection(section)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <span className="text-sm font-medium text-gray-900">
                        {section.number} {section.title}
                      </span>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(section.status)}`}>
                        {section.status}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 112.828 2.828L16 9.172" />
                          </svg>
                        </button>
                        <button className="p-1 text-gray-400 hover:text-gray-600">
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{section.description}</p>
                    <div className="text-xs text-gray-500">Sources: {section.sources}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeView === 'detailed' && selectedSection && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedSection(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {selectedSection.number} {selectedSection.title}
                  </h2>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedSection.status)}`}>
                    {selectedSection.status}
                  </span>
                </div>
                <button className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800">
                  Improve Brief
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-sm text-gray-900">
                  {selectedSection.content || selectedSection.description}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeView === 'layout' && (
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 text-gray-400 mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Layout Options</h3>
            <p className="text-gray-500">Choose a layout for your presentation slides</p>
          </div>
        )}

        {/* Generate Storyline Button */}
        <div className="mt-8 text-center">
          <button className="bg-gray-900 text-white px-6 py-3 rounded-md text-sm font-medium hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-900">
            Generate Storyline
          </button>
        </div>
      </div>

      {/* Right Sidebar - Related Insights */}
      <div className="w-80 bg-gray-50 border-l border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-900">Related Insights</h3>
          <button className="text-xs text-blue-600 hover:text-blue-800">
            + Add Insights
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-4">Supporting research for this section</p>
        
        <div className="space-y-4">
          {[
            {
              title: 'CBDCs will impact 80% of central banks by 2025',
              source: 'BIS Annual Report',
              confidence: 9
            },
            {
              title: 'Financial institutions need 12-18 month preparation window',
              source: 'McKinsey Analysis',
              confidence: 8
            },
            {
              title: 'Retail CBDC models show 32% higher adoption rates',
              source: 'ECB Research Paper',
              confidence: 7
            },
            {
              title: 'Digital currency infrastructure requires $2.4T investment by 2030',
              source: 'PWC Global Survey',
              confidence: 8
            }
          ].map((insight, index) => (
            <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex items-start justify-between mb-2">
                <p className="text-sm font-medium text-gray-900 leading-tight">
                  {insight.title}
                </p>
                <button className="text-gray-400 hover:text-gray-600 ml-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{insight.source}</span>
                <div className="flex items-center space-x-1">
                  <span className="text-xs text-gray-500">Confidence:</span>
                  <div className="flex items-center">
                    <div className="w-16 h-1 bg-gray-200 rounded-full">
                      <div 
                        className="h-1 bg-gray-900 rounded-full" 
                        style={{ width: `${insight.confidence * 10}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-900 ml-1">{insight.confidence}/10</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}