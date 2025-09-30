'use client';

import { useState } from 'react';
import { 
  Settings, 
  Bot, 
  Target, 
  Clock, 
  Users, 
  FileText, 
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button, Input, Select, Textarea } from './index';

export default function DeliverableSettings({ 
  settings = {}, 
  onSave, 
  className = '' 
}) {
  const [localSettings, setLocalSettings] = useState({
    // AI Settings
    aiEnabled: true,
    autoImproveBrief: true,
    qualityThreshold: 80,
    maxImprovementAttempts: 3,
    
    // Workflow Settings
    autoGenerateStoryline: false,
    requireApproval: true,
    allowCollaboration: true,
    notificationPreferences: 'all',
    
    // Content Settings
    defaultTemplate: 'standard',
    includeExamples: true,
    maxSections: 10,
    allowCustomFields: true,
    
    // Team Settings
    defaultTeamSize: 3,
    requireTeamLead: true,
    allowExternalCollaborators: false,
    
    ...settings
  });

  const [expandedSections, setExpandedSections] = useState({
    ai: true,
    workflow: false,
    content: false,
    team: false
  });

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Handle setting changes
  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle toggle changes
  const handleToggle = (key) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Save settings
  const handleSave = () => {
    if (onSave) {
      onSave(localSettings);
    }
  };

  // Reset to defaults
  const handleReset = () => {
    setLocalSettings({
      aiEnabled: true,
      autoImproveBrief: true,
      qualityThreshold: 80,
      maxImprovementAttempts: 3,
      autoGenerateStoryline: false,
      requireApproval: true,
      allowCollaboration: true,
      notificationPreferences: 'all',
      defaultTemplate: 'standard',
      includeExamples: true,
      maxSections: 10,
      allowCustomFields: true,
      defaultTeamSize: 3,
      requireTeamLead: true,
      allowExternalCollaborators: false
    });
  };

  // Render section header
  const renderSectionHeader = (section, title, icon) => (
    <button
      onClick={() => toggleSection(section)}
      className="flex items-center justify-between w-full p-3 rounded-lg hover:bg-opacity-80 transition-colors"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      <div className="flex items-center gap-2">
        <Icon className="w-5 h-5" style={{ color: 'var(--text-primary)' }} />
        <span className="font-medium" style={{ color: 'var(--text-primary)' }}>
          {title}
        </span>
      </div>
      {expandedSections[section] ? (
        <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
      ) : (
        <ChevronRight className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
      )}
    </button>
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-6 h-6" style={{ color: 'var(--text-primary)' }} />
          <h3 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>
            Deliverable Settings
          </h3>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleReset}>
            Reset to Defaults
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>

      {/* AI Settings Section */}
      <div className="space-y-3">
        {renderSectionHeader('ai', 'AI Configuration', Bot)}
        
        {expandedSections.ai && (
          <div className="space-y-4 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)' 
          }}>
            {/* AI Enable/Disable */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Enable AI Assistance
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Allow AI to help with brief improvement and storyline generation
                </p>
              </div>
              <button
                onClick={() => handleToggle('aiEnabled')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.aiEnabled ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.aiEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Auto-improve Brief */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Auto-improve Brief
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Automatically suggest improvements when brief quality is low
                </p>
              </div>
              <button
                onClick={() => handleToggle('autoImproveBrief')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.autoImproveBrief ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoImproveBrief ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Quality Threshold */}
            <div className="space-y-2">
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Quality Threshold: {localSettings.qualityThreshold}%
              </label>
              <input
                type="range"
                min="50"
                max="95"
                step="5"
                value={localSettings.qualityThreshold}
                onChange={(e) => handleSettingChange('qualityThreshold', parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  outline: 'none'
                }}
              />
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Minimum quality score before AI suggests improvements
              </p>
            </div>

            {/* Max Improvement Attempts */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                  Max Improvement Attempts
                </label>
                <Select
                  value={localSettings.maxImprovementAttempts}
                  onChange={(e) => handleSettingChange('maxImprovementAttempts', parseInt(e.target.value))}
                  options={[
                    { value: 1, label: '1 attempt' },
                    { value: 2, label: '2 attempts' },
                    { value: 3, label: '3 attempts' },
                    { value: 5, label: '5 attempts' }
                  ]}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Settings Section */}
      <div className="space-y-3">
        {renderSectionHeader('workflow', 'Workflow & Approval', Clock)}
        
        {expandedSections.workflow && (
          <div className="space-y-4 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)' 
          }}>
            {/* Auto-generate Storyline */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Auto-generate Storyline
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Automatically create storyline when brief is approved
                </p>
              </div>
              <button
                onClick={() => handleToggle('autoGenerateStoryline')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.autoGenerateStoryline ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoGenerateStoryline ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Require Approval */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Require Approval
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Require stakeholder approval before proceeding
                </p>
              </div>
              <button
                onClick={() => handleToggle('requireApproval')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.requireApproval ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.requireApproval ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Notification Preferences */}
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Notification Preferences
              </label>
              <Select
                value={localSettings.notificationPreferences}
                onChange={(e) => handleSettingChange('notificationPreferences', e.target.value)}
                options={[
                  { value: 'all', label: 'All notifications' },
                  { value: 'important', label: 'Important only' },
                  { value: 'minimal', label: 'Minimal' },
                  { value: 'none', label: 'None' }
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* Content Settings Section */}
      <div className="space-y-3">
        {renderSectionHeader('content', 'Content & Templates', FileText)}
        
        {expandedSections.content && (
          <div className="space-y-4 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)' 
          }}>
            {/* Default Template */}
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Default Template
              </label>
              <Select
                value={localSettings.defaultTemplate}
                onChange={(e) => handleSettingChange('defaultTemplate', e.target.value)}
                options={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'executive', label: 'Executive Summary' },
                  { value: 'technical', label: 'Technical' },
                  { value: 'creative', label: 'Creative' }
                ]}
              />
            </div>

            {/* Include Examples */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Include Examples
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Include relevant examples in generated content
                </p>
              </div>
              <button
                onClick={() => handleToggle('includeExamples')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.includeExamples ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.includeExamples ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Max Sections */}
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Maximum Sections: {localSettings.maxSections}
              </label>
              <input
                type="range"
                min="3"
                max="20"
                step="1"
                value={localSettings.maxSections}
                onChange={(e) => handleSettingChange('maxSections', parseInt(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)',
                  outline: 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Team Settings Section */}
      <div className="space-y-3">
        {renderSectionHeader('team', 'Team & Collaboration', Users)}
        
        {expandedSections.team && (
          <div className="space-y-4 p-4 rounded-lg border" style={{ 
            backgroundColor: 'var(--bg-secondary)',
            borderColor: 'var(--border-secondary)' 
          }}>
            {/* Default Team Size */}
            <div>
              <label className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                Default Team Size
              </label>
              <Select
                value={localSettings.defaultTeamSize}
                onChange={(e) => handleSettingChange('defaultTeamSize', parseInt(e.target.value))}
                options={[
                  { value: 1, label: '1 person' },
                  { value: 2, label: '2 people' },
                  { value: 3, label: '3 people' },
                  { value: 5, label: '5 people' },
                  { value: 10, label: '10+ people' }
                ]}
              />
            </div>

            {/* Require Team Lead */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Require Team Lead
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Every deliverable must have a designated team lead
                </p>
              </div>
              <button
                onClick={() => handleToggle('requireTeamLead')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.requireTeamLead ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.requireTeamLead ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Allow External Collaborators */}
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  Allow External Collaborators
                </h4>
                <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                  Allow non-team members to contribute
                </p>
              </div>
              <button
                onClick={() => handleToggle('allowExternalCollaborators')}
                className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
                style={{ 
                  backgroundColor: localSettings.allowExternalCollaborators ? 'var(--text-success)' : 'var(--border-primary)' 
                }}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.allowExternalCollaborators ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
