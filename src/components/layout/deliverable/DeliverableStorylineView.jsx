import React from 'react';
import SectionNavigator from '../../storyline/SectionNavigator';
import { normalizeScoreValue } from '../../../utils/scoreUtils';


export default function DeliverableStorylineView({
  generatedStoryline,
  storylineDirty,
  isSavingStoryline,
  isGeneratingStoryline,
  onSaveStoryline,
  onGenerateStoryline,
  onRegenerateStoryline,
  onResetStoryline,
  currentSectionIndex,
  onSectionChange,
  onUpdateSection,
  onStatusChange,
  onToggleLock,
  onRemoveSection,
  onRegenerateSection,
  title,
  briefQuality = null
}) {
  const normalizedBriefQuality = normalizeScoreValue(briefQuality);
  const canGenerateStoryline = normalizedBriefQuality !== null && normalizedBriefQuality >= 7.5;
  if (!generatedStoryline) {
    const disabled = isGeneratingStoryline || !canGenerateStoryline;
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg font-medium mb-3">No storyline yet</p>
        <p className="text-sm mb-6">Generate a storyline to populate this view.</p>
        <button
          onClick={onGenerateStoryline}
          disabled={disabled}
          className={`px-4 py-2 rounded-sm text-sm font-medium ${
            disabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}
        </button>
        {!canGenerateStoryline && (
          <p className="text-xs text-red-600 mt-3">
            {normalizedBriefQuality === null 
              ? 'Test brief first to get a quality score before generating storyline.'
              : 'Brief quality score must be 7.5 or higher to generate storyline.'
            }
          </p>
        )}
      </div>
    );
  }


  return (
    <div className="flex flex-col min-h-0">
      <div className="flex items-center justify-between px-6 py-3 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            {generatedStoryline.title || title}
          </h2>
          {storylineDirty && (
            <p className="text-xs text-orange-500">Unsaved changes</p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={onResetStoryline}
            disabled={isGeneratingStoryline || isSavingStoryline}
            className={`px-3 py-2 rounded-sm text-sm font-medium border transition-colors ${
              isGeneratingStoryline || isSavingStoryline
                ? 'border-gray-200 text-gray-400 bg-gray-100 cursor-not-allowed'
                : 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50'
            }`}
          >
            Reset
          </button>
          <button
            onClick={onSaveStoryline}
            disabled={!storylineDirty || isSavingStoryline}
            className={`px-4 py-2 rounded-sm text-sm font-medium ${
              !storylineDirty || isSavingStoryline
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isSavingStoryline ? 'Saving...' : 'Save Storyline'}
          </button>
        </div>
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        {console.log('🔍 DeliverableStorylineView - generatedStoryline:', generatedStoryline)}
        {console.log('🔍 DeliverableStorylineView - sections:', generatedStoryline?.sections)}
        <SectionNavigator
          sections={generatedStoryline.sections || []}
          currentSectionIndex={currentSectionIndex}
          onSectionChange={onSectionChange}
          onUpdateSection={onUpdateSection}
          onStatusChange={onStatusChange}
          onToggleLock={onToggleLock}
          onRemoveSection={onRemoveSection}
          onRegenerateSection={onRegenerateSection}
          viewMode="storyline"
        />
      </div>
    </div>
  );
}
