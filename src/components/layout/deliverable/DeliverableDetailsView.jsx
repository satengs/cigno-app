import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { normalizeScoreValue, isScoreAboveThreshold } from '../../../utils/scoreUtils';


const getScoreStyles = (score) => {
  // Simple neutral styling without predefined status thresholds
  return {
    card: 'border-gray-200 bg-gray-50',
    value: 'text-gray-900',
    note: 'text-gray-600',
    progress: 'bg-blue-500'
  };
};

export default function DeliverableDetailsView({
  formData,
  newAudience,
  formatDueDateForDisplay,
  onInputChange,
  onRemoveAudience,
  onAddAudience,
  onTestBrief,
  isTestingBrief = false,
  onImproveBrief,
  onResetBrief,
  onGenerateStoryline,
  isGeneratingStoryline,
  onNewAudienceChange,
  onNewAudienceKeyDown,
  onSave
}) {
  const recognizedStrengths = Array.isArray(formData.brief_strengths)
    ? formData.brief_strengths
    : (formData.strengths ? [formData.strengths] : []);

  const suggestedImprovements = Array.isArray(formData.brief_improvements)
    ? formData.brief_improvements
    : (formData.improvements ? [formData.improvements] : []);

  const qualityScore = normalizeScoreValue(formData.brief_quality);
  
  // Debug logging to check values
  if (typeof window !== 'undefined') {
    console.log('🔍 DEBUG VALUES:', {
      'formData.brief_quality': formData.brief_quality,
      'typeof formData.brief_quality': typeof formData.brief_quality,
      'qualityScore': qualityScore,
      'typeof qualityScore': typeof qualityScore,
      'qualityScore === null': qualityScore === null,
      'qualityScore !== null': qualityScore !== null,
      'isScoreAboveThreshold(qualityScore, 7.5)': qualityScore !== null ? isScoreAboveThreshold(qualityScore, 7.5) : 'N/A'
    });
  }
  
  const qualityPercent = qualityScore !== null ? Math.min(100, Math.max(0, (qualityScore / 10) * 100)) : 0;
  const qualityStyles = getScoreStyles(qualityScore);
  const canGenerateBasedOnScore = qualityScore !== null && isScoreAboveThreshold(qualityScore, 7.5);
  const storylineDisabled = isGeneratingStoryline || !formData.brief?.trim() || !canGenerateBasedOnScore;
  const storylineDisabledMessage = !formData.brief?.trim() 
    ? 'Add a brief before generating a storyline.' 
    : qualityScore === null
      ? 'Test brief first to get a quality score before generating storyline.'
    : !canGenerateBasedOnScore 
      ? 'Brief quality score must be 7.5 or higher to generate storyline.'
      : null;
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const hasRichTextBrief = typeof formData.brief === 'string' && /<[^>]+>/.test(formData.brief);

  return (
    <div className="p-6 space-y-8">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => onInputChange('name', e.target.value)}
          className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">Audience</label>
          <div className="flex flex-wrap gap-2">
            {formData.audience.map((item, index) => (
              <span key={index} className="flex items-center gap-1 rounded-sm bg-blue-50 px-3 py-1 text-sm text-blue-700">
                {item}
                <button
                  type="button"
                  onClick={() => onRemoveAudience(item)}
                  className="text-blue-500 hover:text-blue-700"
                  aria-label={`Remove ${item}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {formData.audience.length === 0 && (
              <span className="text-sm text-gray-400">No audience defined yet</span>
            )}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newAudience}
              onChange={(e) => onNewAudienceChange(e.target.value)}
              onKeyDown={onNewAudienceKeyDown}
              placeholder="Add audience..."
              className="flex-1 rounded-sm border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-gray-900"
            />
            <button
              type="button"
              onClick={onAddAudience}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-gray-200 bg-white text-gray-500 transition-colors hover:border-gray-900 hover:text-gray-700"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <input
              type="text"
              value="Recommendation"
              readOnly
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm bg-gray-50 text-gray-600 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
        <input
          type="text"
          inputMode="numeric"
          placeholder="DD.MM.YYYY"
          value={formatDueDateForDisplay(formData.due_date)}
          onChange={(e) => onInputChange('due_date', e.target.value)}
          className="w-full rounded-sm border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
        />
      </div>

      <div className="space-y-3">
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onTestBrief}
            disabled={isTestingBrief}
            className={`rounded-sm border border-gray-300 px-3 py-1.5 text-sm font-medium ${
              isTestingBrief
                ? 'text-gray-400 cursor-not-allowed bg-gray-100'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
          >
            {isTestingBrief ? 'Testing...' : 'Test Brief'}
          </button>
          <button
            type="button"
            onClick={() => onImproveBrief?.()}
            className="rounded-sm bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Improve Brief
          </button>
          <button
            type="button"
            onClick={() => {
              onResetBrief?.();
              if (isEditingBrief) {
                setIsEditingBrief(false);
              }
            }}
            className="rounded-sm border border-red-200 px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
          >
            Reset Brief
          </button>
          {hasRichTextBrief && (
            <button
              type="button"
              onClick={() => setIsEditingBrief(prev => !prev)}
              className="rounded-sm border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {isEditingBrief ? 'Preview Brief' : 'Edit Brief'}
            </button>
          )}
        </div>
        
        {hasRichTextBrief && !isEditingBrief ? (
          <div className="w-full rounded-sm border border-gray-300 p-3 min-h-[120px] bg-white">
            <div 
              className="prose prose-sm max-w-none text-sm"
              dangerouslySetInnerHTML={{ __html: formData.brief }}
            />
          </div>
        ) : (
          <textarea
            value={formData.brief}
            onChange={(e) => onInputChange('brief', e.target.value)}
            rows={5}
            className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        )}
        
        {hasRichTextBrief && !isEditingBrief && (
          <p className="text-xs text-gray-500">
            Switch to edit mode to update the brief content.
          </p>
        )}
      </div>

      {/* Only show Brief Quality Score if brief has been tested/evaluated */}
      {(qualityScore !== null && ( recognizedStrengths.length > 0 || suggestedImprovements.length > 0)) && (
        <div className={`space-y-4 rounded-sm border p-6 ${qualityStyles.card}`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-sm font-medium text-gray-700">Brief Quality Score</span>
            </div>
            <div className="text-right">
              <span className={`text-sm font-semibold ${qualityStyles.value}`}>
                {qualityScore !== null ? `${qualityScore.toFixed(1)} / 10` : 'Not evaluated'}
              </span>
            </div>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-sm bg-gray-200">
            <div
              className={`h-full rounded-sm transition-all ${qualityStyles.progress}`}
              style={{ width: `${qualityPercent}%` }}
            />
          </div>

          {(recognizedStrengths.length > 0 || suggestedImprovements.length > 0) && (
            <div className="grid gap-3 md:grid-cols-2">
              {recognizedStrengths.length > 0 && (
                <div className="border border-emerald-200 bg-white rounded-md p-3">
                  <p className="text-sm font-medium text-emerald-800">Recognized Strengths</p>
                  <ul className="mt-2 space-y-1 text-xs text-emerald-700">
                    {recognizedStrengths.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
              {suggestedImprovements.length > 0 && (
                <div className="border border-blue-200 bg-white rounded-md p-3">
                  <p className="text-sm font-medium text-blue-800">Suggested Improvements</p>
                  <ul className="mt-2 space-y-1 text-xs text-blue-700">
                    {suggestedImprovements.map((item, index) => (
                      <li key={`${item}-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
        {onGenerateStoryline && (
          <button
            type="button"
            onClick={onGenerateStoryline}
            disabled={storylineDisabled}
            className={`px-6 py-3 rounded-sm text-sm font-medium transition-colors ${
              storylineDisabled
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
            title={storylineDisabledMessage || ''}
          >
            {isGeneratingStoryline ? 'Generating Storyline...' : 'Generate Storyline'}
          </button>
        )}
        <button
          onClick={onSave}
          className="px-6 py-3 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
