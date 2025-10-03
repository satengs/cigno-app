'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings,
  Trash2,
  Calendar,
  Plus,
  X
} from 'lucide-react';
import ClientDetailView from '../ui/ClientDetailView';
import ProjectAwareChat from '../ui/ProjectAwareChat';
import ImproveBriefModal from '../ui/ImproveBriefModal';
import SectionNavigator from '../storyline/SectionNavigator';

export default function ContentPart({ selectedItem, onItemSelect, onItemDeleted }) {
  const [formData, setFormData] = useState({
    name: '',
    audience: [],
    type: 'Strategy Presentation',
    format: 'PPT',
    due_date: '',
    document_length: 25,
    brief: '',
    brief_quality: 7.5,
    strengths: 'Technical requirements well defined',
    improvements: 'Add geographical scope and timeline constraints'
  });

  const [newAudience, setNewAudience] = useState('');
  const [showImproveBrief, setShowImproveBrief] = useState(false);
  const [currentView, setCurrentView] = useState('detailed'); // 'detailed' or 'storyline'
  const [generatedStoryline, setGeneratedStoryline] = useState(null);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [isGeneratingStoryline, setIsGeneratingStoryline] = useState(false);

  // Update form data when selectedItem changes
  useEffect(() => {
    if (selectedItem && selectedItem.type === 'deliverable') {
      setFormData({
        name: selectedItem.name || 'CBDC Implementation Strategy for Global Banking',
        audience: selectedItem.audience || ['Board of Directors', 'Technical Teams', 'Sarah Mitchell (CEO)'],
        type: selectedItem.type || 'Strategy Presentation',
        format: selectedItem.format || 'PPT',
        due_date: selectedItem.due_date ? new Date(selectedItem.due_date).toISOString().split('T')[0] : '2025-02-15',
        document_length: selectedItem.document_length || 25,
        brief: selectedItem.brief || 'Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, and strategic positioning for competitive advantage in the evolving digital currency landscape.',
        brief_quality: selectedItem.brief_quality || 7.5,
        strengths: selectedItem.strengths || 'Technical requirements well defined',
        improvements: selectedItem.improvements || 'Add geographical scope and timeline constraints'
      });

      // Load existing storyline if available
      loadExistingStoryline(selectedItem._id || selectedItem.id);
    }
  }, [selectedItem]);

  // Load existing storyline for the deliverable
  const loadExistingStoryline = async (deliverableId) => {
    if (!deliverableId) return;

    try {
      console.log('🔍 Loading existing storyline for deliverable:', deliverableId);
      
      const response = await fetch(`/api/storylines?deliverableId=${deliverableId}`);
      if (!response.ok) {
        console.log('❌ Failed to fetch storylines from API');
        return;
      }

      const result = await response.json();
      if (result.ok && result.data.storylines.length > 0) {
        const existingStoryline = result.data.storylines[0];
        console.log('✅ Found existing storyline:', existingStoryline._id);
        
        setGeneratedStoryline(existingStoryline);
        setCurrentView('storyline'); // Switch to storyline view if storyline exists
      } else {
        console.log('📝 No existing storyline found for this deliverable');
        setGeneratedStoryline(null);
        setCurrentView('detailed'); // Default to detailed view
      }
    } catch (error) {
      console.error('❌ Error loading existing storyline:', error);
      setGeneratedStoryline(null);
      setCurrentView('detailed');
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddAudience = () => {
    if (newAudience.trim() && !formData.audience.includes(newAudience.trim())) {
      setFormData(prev => ({
        ...prev,
        audience: [...prev.audience, newAudience.trim()]
      }));
      setNewAudience('');
    }
  };

  const handleRemoveAudience = (audienceToRemove) => {
    setFormData(prev => ({
      ...prev,
      audience: prev.audience.filter(item => item !== audienceToRemove)
    }));
  };

  const handleDelete = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert(`Delete is only available for deliverables. Selected item type: ${selectedItem?.type}`);
      return;
    }

    if (window.confirm('Are you sure you want to delete this deliverable?')) {
      try {
        const response = await fetch(`/api/deliverables/${selectedItem._id}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          if (onItemDeleted) {
            onItemDeleted(selectedItem);
          }
          if (onItemSelect) {
            onItemSelect(null);
          }
        } else {
          alert('Failed to delete deliverable');
        }
      } catch (error) {
        console.error('Error deleting deliverable:', error);
        alert('Error deleting deliverable');
      }
    }
  };

  const handleImproveBrief = () => {
    setShowImproveBrief(true);
  };

  const handleBriefSave = (improvedBrief, qualityScore, strengths, improvements) => {
    setFormData(prev => ({
      ...prev,
      brief: improvedBrief,
      brief_quality: qualityScore,
      strengths: strengths,
      improvements: improvements
    }));
    setShowImproveBrief(false);
  };

  const handleGenerateStoryline = async () => {
    if (!selectedItem || selectedItem.type !== 'deliverable') {
      alert('Storyline generation is only available for deliverables');
      return;
    }

    setIsGeneratingStoryline(true);
    
    try {
      const requestData = {
        topic: formData.name || 'Business Strategy',
        industry: 'financial-services',
        audience: formData.audience.join(', ') || 'Business Stakeholders',
        objectives: formData.brief || 'Strategic analysis and recommendations',
        sectionsCount: Math.ceil(formData.document_length / 4), // Estimate sections based on document length
        presentationStyle: 'consulting',
        complexity: 'intermediate',
        deliverableId: selectedItem._id || selectedItem.id
      };

      console.log('🎭 Generating storyline with data:', requestData);

      const response = await fetch('/api/storyline/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate storyline');
      }

      const result = await response.json();
      console.log('✅ Storyline generated successfully:', result);
      
      if (result.ok && result.data) {
        setGeneratedStoryline(result.data.storyline);
        setCurrentView('storyline'); // Switch to storyline view
        setCurrentSectionIndex(0); // Start with first section
      } else {
        throw new Error(result.error || 'Invalid response format');
      }

    } catch (error) {
      console.error('❌ Error generating storyline:', error);
      alert(`Failed to generate storyline: ${error.message}`);
    } finally {
      setIsGeneratingStoryline(false);
    }
  };

  // Handle different content types
  if (!selectedItem) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <p className="text-lg mb-2">Select an item from the menu</p>
          <p className="text-sm">Choose a client, project, or deliverable to view details</p>
        </div>
      </div>
    );
  }

  if (selectedItem.type === 'client') {
    return (
      <div className="flex-1 p-6 flex flex-col min-h-0">
        <ClientDetailView 
          client={selectedItem}
          onUpdate={async (updatedClient) => {
            console.log('Updating client:', updatedClient);
          }}
          onDelete={async (clientToDelete) => {
            console.log('Deleting client:', clientToDelete);
          }}
        />
      </div>
    );
  }

  if (selectedItem.type === 'project') {
    return (
      <div className="flex-1 p-2 flex flex-col min-h-0">
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex justify-end mb-4">
            {/* Empty theme toggle space */}
          </div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedItem.name || selectedItem.title || 'Project Details'}
            </h1>
            <p className="text-gray-600">
              {selectedItem.description || 'Project description will appear here'}
            </p>
          </div>

          <div className="flex-1 min-h-0">
            <ProjectAwareChat 
              key={selectedItem._id || selectedItem.id}
              currentProject={selectedItem}
            />
          </div>
        </div>
      </div>
    );
  }

  // Deliverable view - matches the screenshot
  if (selectedItem.type === 'deliverable') {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: 'var(--bg-primary)' }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {formData.name}
          </h1>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => setCurrentView('detailed')}
              className="p-2 rounded transition-colors cursor-pointer"
              style={{
                backgroundColor: currentView === 'detailed' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'detailed' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              title="Deliverable settings"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button 
              onClick={handleDelete}
              className="p-2 rounded transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-secondary)'
              }}
              title="Delete deliverable"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-6" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('storyline')}
              className="px-4 py-2 rounded-t-lg font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'storyline' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'storyline' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              disabled={!generatedStoryline}
            >
              Storyline
            </button>
            <button
              onClick={() => setCurrentView('layout')}
              className="px-4 py-2 rounded-t-lg font-medium transition-colors"
              style={{
                backgroundColor: currentView === 'layout' ? 'var(--text-primary)' : 'var(--bg-secondary)',
                color: currentView === 'layout' ? 'var(--bg-primary)' : 'var(--text-secondary)'
              }}
              disabled={!generatedStoryline}
            >
              Layout
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {currentView === 'storyline' && generatedStoryline ? (
            <div className="p-6 h-full overflow-y-auto">
              <SectionNavigator
                sections={generatedStoryline.sections || []}
                currentSectionIndex={currentSectionIndex}
                onSectionChange={setCurrentSectionIndex}
              />
            </div>
          ) : currentView === 'layout' && generatedStoryline ? (
            <div className="p-6 h-full overflow-y-auto">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">Layout View</p>
                <p className="text-sm">Layout editing functionality coming soon</p>
              </div>
            </div>
          ) : currentView === 'detailed' ? (
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>

              {/* Audience & Type */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Audience</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {formData.audience.map((item, index) => (
                      <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center">
                        {item}
                        <button onClick={() => handleRemoveAudience(item)} className="ml-1 text-blue-600 hover:text-blue-800">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={newAudience}
                      onChange={(e) => setNewAudience(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddAudience())}
                      placeholder="Add audience..."
                      className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-l focus:outline-none focus:ring-1 focus:ring-gray-900"
                    />
                    <button
                      onClick={handleAddAudience}
                      className="px-2 py-1 bg-gray-900 text-white rounded-r hover:bg-gray-800"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => handleInputChange('type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  >
                    <option value="Strategy Presentation">Strategy Presentation</option>
                    <option value="Presentation">Presentation</option>
                    <option value="Report">Report</option>
                    <option value="Analysis">Analysis</option>
                  </select>
                </div>
              </div>

              {/* Format & Due Date */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Format</label>
                  <div className="flex space-x-2">
                    {['PPT', 'DOC', 'XLS'].map((format) => (
                      <button
                        key={format}
                        onClick={() => handleInputChange('format', format)}
                        className={`px-4 py-2 border rounded ${
                          formData.format === format
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-gray-900'
                        }`}
                      >
                        {format}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Due Date</label>
                  <input
                    type="date"
                    value={formData.due_date}
                    onChange={(e) => handleInputChange('due_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900"
                  />
                </div>
              </div>

              {/* Document Length */}
              <div>
                <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Document Length</label>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>2 pages</span>
                  <div className="flex-1 relative">
                    <input
                      type="range"
                      min="2"
                      max="200"
                      value={formData.document_length}
                      onChange={(e) => handleInputChange('document_length', parseInt(e.target.value))}
                      className="w-full h-2 rounded-lg appearance-none cursor-pointer slider"
                      style={{
                        background: `linear-gradient(to right, var(--text-primary) 0%, var(--text-primary) ${((formData.document_length - 2) / 198) * 100}%, var(--bg-tertiary) ${((formData.document_length - 2) / 198) * 100}%, var(--bg-tertiary) 100%)`
                      }}
                    />
                  </div>
                  <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>200 pages</span>
                </div>
                <div className="text-center mt-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formData.document_length} pages</span>
                </div>
              </div>

              {/* Brief */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Brief</label>
                  <button
                    onClick={handleImproveBrief}
                    className="px-3 py-1 text-sm bg-gray-900 text-white rounded hover:bg-gray-800"
                  >
                    Improve Brief
                  </button>
                </div>
                <textarea
                  value={formData.brief}
                  onChange={(e) => handleInputChange('brief', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                />
              </div>

              {/* Brief Quality Score */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Brief Quality Score</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formData.brief_quality} / 10</span>
                </div>
                <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <div 
                    className="h-2 rounded-full" 
                    style={{ 
                      width: `${(formData.brief_quality / 10) * 100}%`,
                      backgroundColor: 'var(--text-primary)'
                    }}
                  />
                </div>
                <div className="mt-2 space-y-1">
                  <p className="text-sm" style={{ color: 'var(--text-success)' }}>
                    <strong>Strengths:</strong> {formData.strengths}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-warning)' }}>
                    <strong>Improve:</strong> {formData.improvements}
                  </p>
                </div>
              </div>

              {/* Generate Storyline Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleGenerateStoryline}
                  disabled={isGeneratingStoryline}
                  className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50"
                >
                  {isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 h-full overflow-y-auto flex items-center justify-center">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No Content Available</p>
                <p className="text-sm">Generate a storyline or switch to settings view</p>
              </div>
            </div>
          )}
        </div>

        {/* Improve Brief Modal */}
        <ImproveBriefModal
          isOpen={showImproveBrief}
          onClose={() => setShowImproveBrief(false)}
          onSave={handleBriefSave}
          currentBrief={formData.brief}
          deliverable={selectedItem}
          projectData={{}}
        />
      </div>
    );
  }

  // Default fallback
  return (
    <div className="flex-1 flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-500">
        <p className="text-lg mb-2">Unsupported item type</p>
        <p className="text-sm">Item type: {selectedItem?.type}</p>
      </div>
    </div>
  );
}