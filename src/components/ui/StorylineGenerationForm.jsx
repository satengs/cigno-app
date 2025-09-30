'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar,
  FileText,
  Users,
  Target,
  BarChart3,
  Sparkles,
  Wand2,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Settings,
  Trash2
} from 'lucide-react';

export default function StorylineGenerationForm({ 
  isOpen, 
  onClose, 
  onGenerate, 
  initialData = null,
  isGenerating = false 
}) {
  const [formData, setFormData] = useState({
    name: '',
    audience: [],
    type: 'Strategy Presentation',
    format: 'PPT',
    dueDate: '',
    documentLength: 25,
    brief: '',
    industry: 'Financial Services',
    objectives: '',
    complexity: 'intermediate'
  });

  const [briefQuality, setBriefQuality] = useState({
    score: 0,
    strengths: [],
    improvements: []
  });

  const [audienceInput, setAudienceInput] = useState('');
  const [showAudienceSuggestions, setShowAudienceSuggestions] = useState(false);

  const audienceSuggestions = [
    'Board of Directors',
    'Technical Teams', 
    'C-Level Executives',
    'Project Managers',
    'Stakeholders',
    'Investors',
    'Regulatory Bodies',
    'Implementation Teams'
  ];

  const presentationTypes = [
    'Strategy Presentation',
    'Technical Report',
    'Implementation Plan',
    'Market Analysis',
    'Financial Review',
    'Risk Assessment',
    'Compliance Report'
  ];

  const industries = [
    'Financial Services',
    'Technology',
    'Healthcare',
    'Manufacturing',
    'Retail',
    'Energy',
    'Government',
    'Education'
  ];

  const complexityLevels = [
    { value: 'beginner', label: 'Beginner', description: 'High-level overview' },
    { value: 'intermediate', label: 'Intermediate', description: 'Detailed analysis' },
    { value: 'advanced', label: 'Advanced', description: 'Expert-level content' },
    { value: 'expert', label: 'Expert', description: 'Technical deep-dive' }
  ];

  // Initialize form with data if provided
  useEffect(() => {
    if (initialData) {
      setFormData(prev => ({
        ...prev,
        ...initialData
      }));
    }
  }, [initialData]);

  // Calculate brief quality score
  useEffect(() => {
    if (formData.brief) {
      calculateBriefQuality(formData.brief);
    }
  }, [formData.brief]);

  const calculateBriefQuality = (brief) => {
    let score = 0;
    const strengths = [];
    const improvements = [];

    // Check for technical requirements
    if (brief.toLowerCase().includes('technical') || brief.toLowerCase().includes('infrastructure')) {
      score += 2;
      strengths.push('Technical requirements well defined');
    } else {
      improvements.push('Add technical requirements');
    }

    // Check for regulatory compliance
    if (brief.toLowerCase().includes('regulatory') || brief.toLowerCase().includes('compliance')) {
      score += 2;
      strengths.push('Regulatory considerations included');
    } else {
      improvements.push('Include regulatory compliance aspects');
    }

    // Check for strategic positioning
    if (brief.toLowerCase().includes('strategic') || brief.toLowerCase().includes('positioning')) {
      score += 2;
      strengths.push('Strategic positioning addressed');
    } else {
      improvements.push('Define strategic positioning');
    }

    // Check for geographical scope
    if (brief.toLowerCase().includes('geographical') || brief.toLowerCase().includes('region') || brief.toLowerCase().includes('scope')) {
      score += 1;
      strengths.push('Geographical scope specified');
    } else {
      improvements.push('Add geographical scope');
    }

    // Check for timeline constraints
    if (brief.toLowerCase().includes('timeline') || brief.toLowerCase().includes('deadline') || brief.toLowerCase().includes('schedule')) {
      score += 1;
      strengths.push('Timeline constraints mentioned');
    } else {
      improvements.push('Add timeline constraints');
    }

    // Check for competitive advantage
    if (brief.toLowerCase().includes('competitive') || brief.toLowerCase().includes('advantage')) {
      score += 1;
      strengths.push('Competitive advantage considered');
    } else {
      improvements.push('Address competitive advantage');
    }

    // Check brief length
    if (brief.length > 100) {
      score += 1;
      strengths.push('Comprehensive brief provided');
    } else {
      improvements.push('Expand brief with more details');
    }

    const finalScore = Math.min(10, Math.max(0, score));
    setBriefQuality({
      score: finalScore,
      strengths: strengths.length > 0 ? strengths : ['Brief provided'],
      improvements: improvements.length > 0 ? improvements : ['Brief looks good']
    });
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAudienceAdd = (audience) => {
    if (audience && !formData.audience.includes(audience)) {
      setFormData(prev => ({
        ...prev,
        audience: [...prev.audience, audience]
      }));
    }
    setAudienceInput('');
    setShowAudienceSuggestions(false);
  };

  const handleAudienceRemove = (audienceToRemove) => {
    setFormData(prev => ({
      ...prev,
      audience: prev.audience.filter(audience => audience !== audienceToRemove)
    }));
  };

  const handleImproveBrief = () => {
    const improvedBrief = `Global Banking Corp requires a comprehensive strategy for implementing Central Bank Digital Currency (CBDC) capabilities. The presentation should address technical infrastructure requirements, regulatory compliance considerations, strategic positioning for competitive advantage in the evolving digital currency landscape, geographical scope covering EMEA region, timeline constraints for 18-month implementation, and competitive positioning against traditional payment systems.`;
    
    setFormData(prev => ({
      ...prev,
      brief: improvedBrief
    }));
  };

  const handleGenerate = () => {
    if (onGenerate) {
      onGenerate(formData);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      audience: [],
      type: 'Strategy Presentation',
      format: 'PPT',
      dueDate: '',
      documentLength: 25,
      brief: '',
      industry: 'Financial Services',
      objectives: '',
      complexity: 'intermediate'
    });
    setBriefQuality({
      score: 0,
      strengths: [],
      improvements: []
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wand2 className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Storyline</h2>
              <p className="text-sm text-gray-500">Create AI-powered presentation structure</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleReset}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Reset form"
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Enter presentation name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => handleInputChange('industry', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Audience
            </label>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {formData.audience.map((audience, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
                  >
                    {audience}
                    <button
                      onClick={() => handleAudienceRemove(audience)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={audienceInput}
                  onChange={(e) => {
                    setAudienceInput(e.target.value);
                    setShowAudienceSuggestions(true);
                  }}
                  onFocus={() => setShowAudienceSuggestions(true)}
                  placeholder="Add audience..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showAudienceSuggestions && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                    {audienceSuggestions
                      .filter(suggestion => 
                        suggestion.toLowerCase().includes(audienceInput.toLowerCase()) &&
                        !formData.audience.includes(suggestion)
                      )
                      .map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleAudienceAdd(suggestion)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                        >
                          {suggestion}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Type and Format */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => handleInputChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {presentationTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Format
              </label>
              <div className="flex space-x-2">
                {['PPT', 'DOC', 'XLS'].map(format => (
                  <button
                    key={format}
                    onClick={() => handleInputChange('format', format)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      formData.format === format
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {format}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date and Document Length */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => handleInputChange('dueDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Calendar className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Document Length: {formData.documentLength} pages
              </label>
              <input
                type="range"
                min="2"
                max="200"
                value={formData.documentLength}
                onChange={(e) => handleInputChange('documentLength', parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>2 pages</span>
                <span>200 pages</span>
              </div>
            </div>
          </div>

          {/* Brief */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Brief
              </label>
              <button
                onClick={handleImproveBrief}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Improve Brief
              </button>
            </div>
            <textarea
              value={formData.brief}
              onChange={(e) => handleInputChange('brief', e.target.value)}
              placeholder="Enter detailed brief for the presentation..."
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Brief Quality Score */}
          {formData.brief && (
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-700">Brief Quality Score</h3>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    <BarChart3 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {briefQuality.score}/10
                    </span>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(briefQuality.score / 10) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-green-700 mb-2">Strengths:</h4>
                  <ul className="space-y-1">
                    {briefQuality.strengths.map((strength, index) => (
                      <li key={index} className="text-xs text-green-600 flex items-center">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-medium text-orange-700 mb-2">Improve:</h4>
                  <ul className="space-y-1">
                    {briefQuality.improvements.map((improvement, index) => (
                      <li key={index} className="text-xs text-orange-600 flex items-center">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Complexity Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Complexity Level
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {complexityLevels.map(level => (
                <button
                  key={level.value}
                  onClick={() => handleInputChange('complexity', level.value)}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.complexity === level.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-sm font-medium text-gray-900">{level.label}</div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-500">
            AI will generate a structured storyline based on your inputs
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !formData.name || !formData.brief}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Storyline</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
