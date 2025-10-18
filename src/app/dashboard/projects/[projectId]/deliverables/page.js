'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { 
  Settings, 
  Trash2, 
  X, 
  Plus,
  Calendar,
  FileText,
  BarChart3,
  ChevronRight,
  Eye,
  Share,
  Download
} from 'lucide-react';

const DeliverableDetailPage = () => {
  const params = useParams();
  const searchParams = useSearchParams();
  const projectId = params.projectId;
  const deliverableId = searchParams.get('id');
  
  const [deliverable, setDeliverable] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [audiences, setAudiences] = useState(['Board of Directors', 'Technical Teams']);
  const [newAudience, setNewAudience] = useState('');
  const [currentView, setCurrentView] = useState('detail'); // 'detail' or 'storyline'

  // Mock data for development
  const mockDeliverable = {
    _id: deliverableId || 'mock-id',
    name: 'CBDC Implementation Strategy for Global Banking',
    type: 'Strategy Presentation',
    format: 'PPT',
    due_date: '2025-02-15',
    pages: 25,
    maxPages: 200,
    audience: ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
    brief: 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.',
    qualityScore: null,
    strengths: null,
    improvements: null,
    sources: [
      { name: 'CBDC Market Analysis Report', type: 'PDF', pages: 45, progress: 85 },
      { name: 'Global Banking Corp Brief', type: 'Document', pages: 12, progress: 92 },
      { name: 'Regulatory Framework Guidelines', type: 'PDF', pages: 28, progress: 78 },
      { name: 'Technical Infrastructure Specs', type: 'Document', pages: 22, progress: 71 },
      { name: 'BIS Working Paper on CBDCs', source: 'bis.org', progress: 94 },
      { name: 'IMF Digital Money Report', source: 'imf.org', progress: 88 },
      { name: 'Federal Reserve CBDC Paper', source: 'federalreserve.gov', progress: 82 }
    ]
  };

  // TODO: Replace with API call to get real storyline data
  // This will be replaced with actual API data
  const mockStoryline = {
    title: '',
    author: '',
    pageInfo: '',
    sections: []
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // For development, use mock data
        setDeliverable(mockDeliverable);
        setProject({ name: 'Global Banking Corp Digital Transformation' });
        setError(null);
      } catch (err) {
        console.error('Error fetching deliverable:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (projectId) {
      fetchData();
    }
  }, [projectId, deliverableId]);

  const handleUpdateDeliverable = async (updates) => {
    try {
      // In real implementation, this would call the API
      setDeliverable(prev => ({ ...prev, ...updates }));
    } catch (err) {
      console.error('Error updating deliverable:', err);
    }
  };

  const handleAddAudience = () => {
    if (newAudience.trim() && !audiences.includes(newAudience.trim())) {
      const updatedAudiences = [...audiences, newAudience.trim()];
      setAudiences(updatedAudiences);
      handleUpdateDeliverable({ audience: updatedAudiences });
      setNewAudience('');
    }
  };

  const handleRemoveAudience = (audienceToRemove) => {
    const updatedAudiences = audiences.filter(audience => audience !== audienceToRemove);
    setAudiences(updatedAudiences);
    handleUpdateDeliverable({ audience: updatedAudiences });
  };

  const formatOptions = ['PPT', 'DOC', 'XLS'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading deliverable...</p>
        </div>
      </div>
    );
  }

  if (error || !deliverable) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading deliverable</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'storyline') {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setCurrentView('detail')}
              className="flex items-center text-gray-500 hover:text-gray-700"
            >
              <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
              Back to Details
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{deliverable.name}</h1>
          </div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
              Must Read
            </span>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Share className="w-4 h-4" />
            </button>
            <button className="p-2 text-gray-400 hover:text-gray-600">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 bg-white rounded-lg shadow-sm border border-gray-200 p-8">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold text-gray-800">{mockStoryline.author}</h2>
                <span className="text-sm text-gray-500">{mockStoryline.pageInfo}</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{mockStoryline.title}</h1>
            </div>

            {mockStoryline.sections.map((section, index) => (
              <div key={index} className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">{section.title}</h2>
                <p className="text-gray-700 leading-relaxed mb-6">{section.content}</p>
                
                {section.subsections?.map((subsection, subIndex) => (
                  <div key={subIndex} className="mb-6">
                    <div className="bg-gray-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
                      <h3 className="text-lg font-semibold text-gray-900 mb-3">{subsection.title}</h3>
                      <p className="text-gray-700 leading-relaxed mb-4">{subsection.content}</p>
                      
                      {subsection.phases && (
                        <div className="space-y-2">
                          {subsection.phases.map((phase, phaseIndex) => (
                            <div key={phaseIndex} className="text-sm text-gray-600">
                              <strong>{phase.split(':')[0]}:</strong> {phase.split(':')[1]}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            <p className="text-gray-700 leading-relaxed">
              The institutions that begin preparation now will be positioned to capitalize on the competitive 
              advantages that CBDC integration offers, including reduced transaction costs, enhanced customer 
              experiences, and new revenue opportunities through programmable money features.
            </p>
          </div>

          {/* Sources Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources & References</h3>
              <div className="space-y-4">
                {deliverable.sources.map((source, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-3">
                    <h4 className="font-medium text-gray-900 text-sm mb-1">{source.name}</h4>
                    <p className="text-xs text-gray-500 mb-2">
                      {source.source || `${source.type} • ${source.pages} pages`}
                    </p>
                    <div className="flex items-center space-x-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gray-900 h-2 rounded-full" 
                          style={{ width: `${source.progress}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500">{source.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Assistant</h3>
              <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Ask Questions
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{deliverable.name}</h1>
        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            Must Read
          </span>
          <span className="text-sm text-gray-500">4</span>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Deliverable Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Name */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-600 mb-3">Name</label>
              <input
                type="text"
                value={deliverable.name}
                onChange={(e) => handleUpdateDeliverable({ name: e.target.value })}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base bg-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            {/* Audience and Type Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Audience */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Audience</label>
                <div className="space-y-2">
                  {deliverable.audience.map((audience, index) => (
                    <div key={index} className="inline-flex items-center bg-gray-100 rounded px-3 py-1 mr-2 mb-2">
                      <span className="text-sm text-gray-700">{audience}</span>
                      <button
                        onClick={() => handleRemoveAudience(audience)}
                        className="ml-2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <div className="flex items-center">
                    <input
                      type="text"
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddAudience()}
                      placeholder="Add audience..."
                      className="text-sm border-0 border-b border-gray-300 px-0 py-1 bg-transparent focus:border-blue-500 focus:outline-none focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
                <select
                  value={deliverable.type}
                  onChange={(e) => handleUpdateDeliverable({ type: e.target.value })}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="Strategy Presentation">Strategy Presentation</option>
                  <option value="Technical Report">Technical Report</option>
                  <option value="Implementation Roadmap">Implementation Roadmap</option>
                  <option value="Analysis Report">Analysis Report</option>
                </select>
              </div>
            </div>

            {/* Format and Due Date Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Format */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Format</label>
                <div className="flex space-x-2">
                  {formatOptions.map(format => (
                    <button
                      key={format}
                      onClick={() => handleUpdateDeliverable({ format })}
                      className={`px-6 py-2 text-sm font-medium transition-colors ${
                        deliverable.format === format
                          ? 'bg-white text-gray-900 border border-gray-900 rounded'
                          : 'bg-gray-100 text-gray-700 rounded hover:bg-gray-200'
                      }`}
                    >
                      {format}
                    </button>
                  ))}
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                <div className="relative">
                  <input
                    type="text"
                    value="15.02.2025"
                    onChange={(e) => handleUpdateDeliverable({ due_date: e.target.value })}
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Document Length */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Document Length</label>
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">2 pages</span>
                <div className="flex-1 relative">
                  <input
                    type="range"
                    min="2"
                    max="200"
                    value={25}
                    onChange={(e) => handleUpdateDeliverable({ pages: parseInt(e.target.value) })}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div 
                    className="absolute top-1 w-3 h-3 bg-blue-600 rounded-full transform -translate-y-1/2 cursor-pointer" 
                    style={{ left: `${((25 - 2) / (200 - 2)) * 100}%` }}
                  ></div>
                </div>
                <span className="text-sm text-gray-500">200 pages</span>
              </div>
              <div className="flex justify-between mt-1">
                <span></span>
                <span className="text-sm text-gray-700">25 pages</span>
                <span></span>
              </div>
            </div>

            {/* Brief Section */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Brief</label>
                <button className="px-4 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors">
                  Improve Brief
                </button>
              </div>
              <textarea
                value={deliverable.brief}
                onChange={(e) => handleUpdateDeliverable({ brief: e.target.value })}
                rows={4}
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm bg-white focus:border-blue-500 focus:outline-none"
              />
            </div>

            {/* Brief Quality Score - only show if evaluated */}
            {(mockDeliverable.qualityScore || mockDeliverable.strengths || mockDeliverable.improvements) && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">Brief Quality Score</label>
                  <span className="text-sm font-medium text-gray-900">
                    {mockDeliverable.qualityScore ? `${mockDeliverable.qualityScore} / 10` : 'Not evaluated'}
                  </span>
                </div>
                {mockDeliverable.qualityScore && (
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                    <div 
                      className="bg-gray-900 h-2 rounded-full" 
                      style={{ width: `${(mockDeliverable.qualityScore / 10) * 100}%` }}
                    ></div>
                  </div>
                )}
                <div className="space-y-1">
                  {mockDeliverable.strengths && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Strengths:</span> {mockDeliverable.strengths}
                    </div>
                  )}
                  {mockDeliverable.improvements && (
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Improve:</span> {mockDeliverable.improvements}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Generate Storyline Button */}
            <div className="flex justify-end">
              <button 
                onClick={() => setCurrentView('storyline')}
                className="px-6 py-2 bg-gray-900 text-white rounded text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Generate Storyline
              </button>
            </div>
          </div>
        </div>

        {/* Sources Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sources & References</h3>
            <div className="space-y-4">
              {deliverable.sources.map((source, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center space-x-2 mb-2">
                    <Eye className="w-4 h-4 text-gray-400" />
                    <h4 className="font-medium text-gray-900 text-sm">{source.name}</h4>
                  </div>
                  <p className="text-xs text-gray-500 mb-2">
                    {source.source || `${source.type} • ${source.pages} pages`}
                  </p>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gray-900 h-2 rounded-full" 
                        style={{ width: `${source.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-gray-500">{source.progress}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Assistant</h3>
            <button className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Ask Questions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliverableDetailPage;