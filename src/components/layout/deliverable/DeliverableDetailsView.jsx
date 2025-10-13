import React from 'react';
import { Plus, X } from 'lucide-react';

export default function DeliverableDetailsView({
  formData,
  newAudience,
  formatDueDateForDisplay,
  onInputChange,
  onRemoveAudience,
  onAddAudience,
  onImproveBrief,
  onGenerateStoryline,
  isGeneratingStoryline,
  onNewAudienceChange,
  onNewAudienceKeyDown,
  onSave
}) {
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
            <select
              value={formData.type}
              onChange={(e) => onInputChange('type', e.target.value)}
              className="w-full rounded-sm border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            >
              <option value="Strategy Presentation">Strategy Presentation</option>
              <option value="Presentation">Presentation</option>
              <option value="Report">Report</option>
              <option value="Analysis">Analysis</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Format</label>
            <div className="flex gap-2">
              {['PPT', 'DOC', 'XLS'].map((format) => (
                <button
                  key={format}
                  onClick={() => onInputChange('format', format)}
                  className={`flex-1 rounded-sm border px-3 py-2 text-sm transition-colors ${
                    formData.format === format
                      ? 'border-gray-900 bg-gray-900 text-white'
                      : 'border-gray-300 bg-gray-50 text-gray-700 hover:border-gray-900'
                  }`}
                  type="button"
                >
                  {format}
                </button>
              ))}
            </div>
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
        <label className="block text-sm font-medium text-gray-700">Document Length</label>
        <input
          type="range"
          min="2"
          max="200"
          value={formData.document_length}
          onChange={(e) => onInputChange('document_length', parseInt(e.target.value, 10) || 0)}
          className="w-full h-1 rounded-sm appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #374151 0%, #374151 ${((formData.document_length - 2) / 198) * 100}%, #e5e7eb ${((formData.document_length - 2) / 198) * 100}%, #e5e7eb 100%)`
          }}
        />
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>2 pages</span>
          <span className="text-gray-600 font-medium">{formData.document_length} pages</span>
          <span>200 pages</span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-gray-700">Brief</label>
          <button
            type="button"
            onClick={onImproveBrief}
            className="rounded-sm bg-gray-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-gray-800"
          >
            Improve Brief
          </button>
        </div>
        
        {/* Check if brief contains HTML tags */}
        {formData.brief && formData.brief.includes('<') && formData.brief.includes('>') ? (
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
        
        {formData.brief && formData.brief.includes('<') && formData.brief.includes('>') && (
          <p className="text-xs text-gray-500">
            This brief contains HTML formatting. Use "Improve Brief" to modify the content.
          </p>
        )}
      </div>

      <div className="space-y-4 rounded-sm border border-gray-200 bg-gray-50 p-6">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700">Brief Quality Score</span>
          <span className="font-semibold text-gray-900">{formData.brief_quality} / 10</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-sm bg-gray-200">
          <div
            className="h-full rounded-sm bg-gray-900"
            style={{ width: `${(formData.brief_quality / 10) * 100}%` }}
          />
        </div>
        <div className="space-y-1 text-sm">
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">Strengths:</span> {formData.strengths}
          </p>
          <p className="text-gray-600">
            <span className="font-medium text-gray-900">Improve:</span> {formData.improvements}
          </p>
        </div>
      </div>

      {/* Generate Storyline Button */}
      {onGenerateStoryline && (
        <div className="flex justify-end pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={onGenerateStoryline}
            disabled={isGeneratingStoryline || !formData.brief?.trim()}
            className={`px-6 py-3 rounded-sm text-sm font-medium ${
              isGeneratingStoryline || !formData.brief?.trim()
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isGeneratingStoryline ? 'Generating Storyline...' : 'Generate Storyline'}
          </button>
        </div>
      )}

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={onSave}
          className="px-6 py-2 bg-gray-900 text-white text-sm font-medium rounded-sm hover:bg-gray-800 transition-colors"
        >
          Save Changes
        </button>
      </div>

    </div>
  );
}
