'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  GripVertical,
  Lock,
  Unlock,
  FileText
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'final', label: 'Final' }
];

const STATUS_BADGE_STYLES = {
  final: 'bg-green-100 text-green-800 border border-green-200',
  in_review: 'bg-orange-100 text-orange-800 border border-orange-200',
  draft: 'bg-blue-100 text-blue-800 border border-blue-200',
  not_started: 'bg-gray-100 text-gray-700 border border-gray-200'
};

export default function SectionNavigator({
  sections = [],
  currentSectionIndex = 0,
  onSectionChange,
  onUpdateSection,
  onStatusChange,
  onToggleLock,
  onKeyPointsChange
}) {
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [draftKeyPoints, setDraftKeyPoints] = useState({});

  // Removed auto-expansion based on currentSectionIndex
  // useEffect(() => {
  //   setExpandedSectionId(sections[currentSectionIndex]?.id);
  // }, [currentSectionIndex, sections]);

  useEffect(() => {
    setDraftKeyPoints({});
  }, [sections]);

  const statusBadgeClasses = useMemo(() => STATUS_BADGE_STYLES, []);

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">No sections available yet</p>
        <p className="text-xs text-gray-500 mt-1">Generate a storyline to get started</p>
      </div>
    );
  }

  const handleToggleExpand = (sectionId, index) => {
    setExpandedSectionId(prev => (prev === sectionId ? null : sectionId));
    // Don't change the current section index just for expanding/collapsing
    // onSectionChange?.(index);
  };

  const handleTitleChange = (sectionId, value) => {
    onUpdateSection?.(sectionId, { title: value });
  };

  const handleDescriptionChange = (sectionId, value) => {
    onUpdateSection?.(sectionId, { description: value });
  };


  const handleAddKeyPoint = (sectionId) => {
    const draft = (draftKeyPoints[sectionId] || '').trim();
    if (!draft) return;
    const section = sections.find(item => item.id === sectionId);
    const updated = [...(section?.keyPoints || []), draft];
    onKeyPointsChange?.(sectionId, updated);
    setDraftKeyPoints(prev => ({ ...prev, [sectionId]: '' }));
  };

  const handleRemoveKeyPoint = (sectionId, indexToRemove) => {
    const section = sections.find(item => item.id === sectionId);
    const updated = (section?.keyPoints || []).filter((_, index) => index !== indexToRemove);
    onKeyPointsChange?.(sectionId, updated);
  };

  const setDraftForSection = (sectionId, value) => {
    setDraftKeyPoints(prev => ({ ...prev, [sectionId]: value }));
  };

  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isExpanded = expandedSectionId === section.id;
        const isLocked = !!section.locked;
        const statusClass = statusBadgeClasses[section.status] || statusBadgeClasses.not_started;
        const draftValue = draftKeyPoints[section.id] || '';
        const isCurrentSection = index === currentSectionIndex;

        return (
          <div
            key={section.id || index}
            className={`group rounded-xl border bg-white transition-all duration-200 hover:shadow-md ${
              isExpanded 
                ? 'shadow-lg border-blue-200 ring-1 ring-blue-100' 
                : isCurrentSection 
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Collapse Arrow */}
                <button
                  onClick={() => handleToggleExpand(section.id, index)}
                  className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors"
                  title={isExpanded ? 'Collapse section' : 'Expand section'}
                  style={{ backgroundColor: 'transparent' }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
                
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isCurrentSection 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 truncate">
                      {section.title || `Section ${index + 1}`}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                      {(section.status || 'draft').replace('_', ' ')}
                    </span>
                  </div>
                  
                  {section.description ? (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                      {section.description}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-400 italic mb-1">Add a description to outline this section</p>
                  )}
                  
                  {section.sources?.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <FileText className="h-3 w-3 mr-1" />
                      Sources: {section.sources.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleLock?.(section.id, !section.locked);
                  }}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                    section.locked 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={section.locked ? 'Unlock section' : 'Lock section'}
                >
                  {section.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50">
                <div className="p-5 space-y-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Section Title</label>
                      <input
                        type="text"
                        id={`section-title-${section.id}`}
                        value={section.title || ''}
                        onChange={(e) => handleTitleChange(section.id, e.target.value)}
                        disabled={isLocked}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          isLocked 
                            ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'
                        }`}
                        placeholder="Enter section title..."
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={section.description || ''}
                        onChange={(e) => handleDescriptionChange(section.id, e.target.value)}
                        disabled={isLocked}
                        rows={3}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors resize-none ${
                          isLocked 
                            ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'
                        }`}
                        placeholder="Describe the purpose and coverage of this section..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                      <select
                        value={section.status || 'draft'}
                        onChange={(e) => onStatusChange?.(section.id, e.target.value)}
                        disabled={isLocked}
                        className={`w-full rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                          isLocked 
                            ? 'border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed'
                            : 'border-gray-300 bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'
                        }`}
                      >
                        {STATUS_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>


                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Key Points</label>
                    <div className="space-y-2">
                      {(section.keyPoints || []).map((point, pointIndex) => (
                        <div key={pointIndex} className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                            {pointIndex + 1}
                          </div>
                          <span className="flex-1 text-sm text-gray-700">{point}</span>
                          {!isLocked && (
                            <button
                              onClick={() => handleRemoveKeyPoint(section.id, pointIndex)}
                              className="text-xs text-gray-400 hover:text-red-600 transition-colors px-2 py-1 rounded hover:bg-red-50"
                            >
                              Remove
                            </button>
                          )}
                        </div>
                      ))}
                      
                      {(section.keyPoints || []).length === 0 && (
                        <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                          No key points added yet
                        </div>
                      )}
                    </div>
                    
                    {!isLocked && (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={draftValue}
                          onChange={(e) => setDraftForSection(section.id, e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddKeyPoint(section.id);
                            }
                          }}
                          placeholder="Add a key point..."
                          className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm bg-white hover:border-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100 transition-colors"
                        />
                        <button
                          onClick={() => handleAddKeyPoint(section.id)}
                          disabled={!draftValue.trim()}
                          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    )}
                  </div>
                  </div>

                  <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 mt-4">
                    <div className="flex items-center space-x-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isLocked ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        {isLocked ? (
                          <Lock className="h-4 w-4 text-green-600" />
                        ) : (
                          <Unlock className="h-4 w-4 text-gray-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {isLocked ? 'Section Locked' : 'Section Unlocked'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {isLocked
                            ? 'This section is locked and marked as Final'
                            : 'Lock the section once finalized to prevent further edits'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => onToggleLock?.(section.id, !isLocked)}
                      className={`flex items-center space-x-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
                        isLocked 
                          ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isLocked ? (
                        <><Unlock className="h-4 w-4" /><span>Unlock</span></>
                      ) : (
                        <><Lock className="h-4 w-4" /><span>Lock & Finalize</span></>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
