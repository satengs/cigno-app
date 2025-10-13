import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import SectionNavigator from '../../storyline/SectionNavigator';
import RegenerationConfirmModal from '../../ui/RegenerationConfirmModal';

export default function DeliverableStorylineView({
  generatedStoryline,
  storylineDirty,
  isSavingStoryline,
  isGeneratingStoryline,
  onSaveStoryline,
  onGenerateStoryline,
  onRegenerateStoryline,
  currentSectionIndex,
  onSectionChange,
  onUpdateSection,
  onStatusChange,
  onToggleLock,
  onKeyPointsChange,
  title
}) {
  const [showRegenerationModal, setShowRegenerationModal] = useState(false);
  if (!generatedStoryline) {
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg font-medium mb-3">No storyline yet</p>
        <p className="text-sm mb-6">Generate a storyline to populate this view.</p>
        <button
          onClick={onGenerateStoryline}
          disabled={isGeneratingStoryline}
          className={`px-4 py-2 rounded-sm text-sm font-medium ${
            isGeneratingStoryline
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}
        </button>
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
            onClick={() => setShowRegenerationModal(true)}
            disabled={isGeneratingStoryline || isSavingStoryline}
            className={`flex items-center space-x-2 px-3 py-2 rounded-sm text-sm font-medium transition-colors ${
              isGeneratingStoryline || isSavingStoryline
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
            title="Regenerate storyline while preserving locked sections"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Regenerate</span>
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
        <SectionNavigator
          sections={generatedStoryline.sections || []}
          currentSectionIndex={currentSectionIndex}
          onSectionChange={onSectionChange}
          onUpdateSection={onUpdateSection}
          onStatusChange={onStatusChange}
          onToggleLock={onToggleLock}
          onKeyPointsChange={onKeyPointsChange}
        />
      </div>

      {/* Regeneration Confirmation Modal */}
      {showRegenerationModal && (
        <RegenerationConfirmModal
          storyline={generatedStoryline}
          onConfirm={(options) => {
            setShowRegenerationModal(false);
            onRegenerateStoryline?.(options);
          }}
          onCancel={() => setShowRegenerationModal(false)}
        />
      )}
    </div>
  );
}
