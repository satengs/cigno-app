'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Sparkles, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target,
  Edit3,
  Save,
  RefreshCw,
  Lightbulb
} from 'lucide-react';
import Button from './buttons/Button';
import Modal from './modals/Modal';

export default function BriefEditor({ 
  brief = '', 
  onSave, 
  onClose, 
  isOpen = false,
  className = ''
}) {
  const [content, setContent] = useState(brief);
  const [isEditing, setIsEditing] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const editorRef = useRef(null);

  // Initialize content when brief prop changes
  useEffect(() => {
    setContent(brief);
  }, [brief]);

  // Auto-analyze content when it changes significantly
  useEffect(() => {
    if (content.length > 50 && !isEditing) {
      const timer = setTimeout(() => {
        analyzeQuality();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, isEditing]);

  // Analyze brief quality using AI
  const analyzeQuality = async () => {
    if (content.length < 20) return;
    
    setIsAnalyzing(true);
    try {
      // Simulate AI analysis - replace with actual AI call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const score = Math.floor(Math.random() * 40) + 60; // 60-100 for demo
      setQualityScore(score);
      
      // Generate suggestions based on score
      const newSuggestions = generateSuggestions(score, content);
      setSuggestions(newSuggestions);
      
    } catch (error) {
      console.error('Error analyzing brief quality:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate AI improvement suggestions
  const generateSuggestions = (score, briefContent) => {
    const suggestions = [];
    
    if (score < 70) {
      suggestions.push({
        type: 'critical',
        title: 'Add Specific Objectives',
        description: 'Include measurable goals and success criteria',
        icon: Target
      });
    }
    
    if (briefContent.length < 200) {
      suggestions.push({
        type: 'warning',
        title: 'Expand Scope Description',
        description: 'Provide more detail about deliverables and requirements',
        icon: Edit3
      });
    }
    
    if (!briefContent.includes('timeline') && !briefContent.includes('deadline')) {
      suggestions.push({
        type: 'info',
        title: 'Include Timeline',
        description: 'Add project timeline and key milestones',
        icon: Clock
      });
    }
    
    if (!briefContent.includes('stakeholder') && !briefContent.includes('audience')) {
      suggestions.push({
        type: 'info',
        title: 'Define Stakeholders',
        description: 'Identify target audience and key stakeholders',
        icon: Target
      });
    }
    
    return suggestions;
  };

  // Get quality level and color
  const getQualityLevel = (score) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/20' };
    if (score >= 80) return { level: 'Good', color: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/20' };
    if (score >= 70) return { level: 'Fair', color: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/20' };
    return { level: 'Needs Work', color: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/20' };
  };

  // Handle content changes
  const handleContentChange = (e) => {
    setContent(e.target.value);
    if (isEditing) {
      // Reset quality score when editing
      setQualityScore(null);
    }
  };

  // Toggle edit mode
  const toggleEdit = () => {
    setIsEditing(!isEditing);
    if (isEditing) {
      // Save changes when exiting edit mode
      handleSave();
    }
  };

  // Save brief content
  const handleSave = () => {
    if (onSave) {
      onSave(content);
    }
    setIsEditing(false);
  };

  // AI-powered brief improvement
  const improveBrief = async () => {
    setIsGenerating(true);
    try {
      // Simulate AI improvement - replace with actual AI call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const improvedContent = content + '\n\n' + 
        'Additional AI-generated content:\n' +
        '• Enhanced scope definition\n' +
        '• Clearer success metrics\n' +
        '• Stakeholder identification\n' +
        '• Risk considerations';
      
      setContent(improvedContent);
      setQualityScore(Math.min(100, (qualityScore || 70) + 15));
      
    } catch (error) {
      console.error('Error improving brief:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const qualityLevel = qualityScore ? getQualityLevel(qualityScore) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header with Quality Score */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Deliverable Brief
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Quality Score */}
          {qualityScore && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${qualityLevel.bgColor}`} 
                 style={{ borderColor: 'var(--border-secondary)' }}>
              <span className={`text-sm font-medium ${qualityLevel.color}`}>
                {qualityScore}/100
              </span>
              <span className={`text-xs ${qualityLevel.color}`}>
                {qualityLevel.level}
              </span>
            </div>
          )}
          
          {/* Action Buttons */}
          <Button
            variant="outline"
            size="sm"
            onClick={toggleEdit}
            disabled={isGenerating}
          >
            {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
            {isEditing ? 'Save' : 'Edit'}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={analyzeQuality}
            disabled={isAnalyzing || content.length < 20}
          >
            <RefreshCw className={`w-4 h-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
            Analyze
          </Button>
        </div>
      </div>

      {/* Brief Content Editor */}
      <div className="relative">
        <textarea
          ref={editorRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Enter your deliverable brief here. Include objectives, scope, requirements, timeline, and success criteria..."
          className={`w-full min-h-[200px] p-4 rounded-lg border resize-none transition-all duration-200 ${
            isEditing 
              ? 'border-blue-300 dark:border-blue-600 bg-white dark:bg-gray-800' 
              : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900'
          }`}
          style={{
            color: 'var(--text-primary)',
            borderColor: isEditing ? 'var(--border-primary)' : 'var(--border-secondary)'
          }}
          disabled={!isEditing}
        />
        
        {/* Character Count */}
        <div className="absolute bottom-2 right-2 text-xs text-gray-500">
          {content.length} characters
        </div>
      </div>

      {/* AI Improvement Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
          <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Improvements
          </h4>
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={improveBrief}
            disabled={isGenerating || content.length < 50}
            className="flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Improving...' : 'Improve Brief'}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="flex items-center gap-2"
          >
            <Lightbulb className="w-4 h-4" />
            Suggestions ({suggestions.length})
          </Button>
        </div>
      </div>

      {/* Quality Suggestions */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="space-y-3 p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-secondary)' 
        }}>
          <h5 className="font-medium" style={{ color: 'var(--text-primary)' }}>
            Quality Improvement Suggestions
          </h5>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon;
              return (
                <div key={index} className="flex items-start gap-3 p-3 rounded-lg" 
                     style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                  <Icon className={`w-5 h-5 mt-0.5 ${
                    suggestion.type === 'critical' ? 'text-red-500' :
                    suggestion.type === 'warning' ? 'text-yellow-500' :
                    'text-blue-500'
                  }`} />
                  
                  <div className="flex-1">
                    <h6 className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>
                      {suggestion.title}
                    </h6>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {suggestion.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analysis Status */}
      {isAnalyzing && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Analyzing brief quality...
        </div>
      )}

      {/* Generation Status */}
      {isGenerating && (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <Sparkles className="w-4 h-4 animate-pulse" />
          Generating improvements...
        </div>
      )}
    </div>
  );
}
