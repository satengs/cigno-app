import React, { useState, useEffect } from 'react';
import { X, Lock, Unlock, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { filterSectionsForRegeneration, validateRegenerationRequest } from '../../lib/storyline/regenerationUtils';

export default function RegenerationConfirmModal({
  storyline,
  onConfirm,
  onCancel
}) {
  const [validation, setValidation] = useState(null);
  const [lockedSections, setLockedSections] = useState([]);
  const [draftSections, setDraftSections] = useState([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  useEffect(() => {
    if (storyline) {
      setIsAnalyzing(true);
      
      // Analyze storyline for regeneration
      const validationResult = validateRegenerationRequest(storyline);
      const { lockedSections: locked, draftSections: draft } = filterSectionsForRegeneration(storyline);
      
      setValidation(validationResult);
      setLockedSections(locked);
      setDraftSections(draft);
      setIsAnalyzing(false);
    }
  }, [storyline]);

  const handleConfirm = () => {
    onConfirm({
      preserveLocked: true,
      regenerationType: 'partial'
    });
  };

  if (isAnalyzing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center space-x-3">
            <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-gray-600">Analyzing storyline...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-20 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <RefreshCw className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Regenerate Storyline</h2>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Validation Messages */}
          {validation?.errors?.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <h3 className="font-medium text-red-800">Cannot Regenerate</h3>
              </div>
              <ul className="text-sm text-red-700 space-y-1">
                {validation.errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {validation?.warnings?.length > 0 && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center space-x-2 mb-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium text-yellow-800">Warning</h3>
              </div>
              <ul className="text-sm text-yellow-700 space-y-1">
                {validation.warnings.map((warning, index) => (
                  <li key={index}>• {warning}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Statistics */}
          {validation?.stats && (
            <div className="mb-6 grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{validation.stats.totalSections}</div>
                <div className="text-sm text-gray-600">Total Sections</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-700">{validation.stats.lockedSections}</div>
                <div className="text-sm text-green-600">Locked (Preserved)</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-700">{validation.stats.draftSections}</div>
                <div className="text-sm text-blue-600">Draft (Will Regenerate)</div>
              </div>
            </div>
          )}

          {/* Explanation */}
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start space-x-2">
              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-blue-800 mb-1">How Regeneration Works</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Locked sections</strong> will be preserved exactly as they are</li>
                  <li>• <strong>Draft sections</strong> will be regenerated with new AI content</li>
                  <li>• Section order and flow will be maintained</li>
                  <li>• You can undo changes by reverting to the previous version</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Section Lists */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Locked Sections */}
            <div>
              <h3 className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
                <Lock className="h-4 w-4 text-green-600" />
                <span>Preserved Sections ({lockedSections.length})</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {lockedSections.length > 0 ? (
                  lockedSections.map((section, index) => (
                    <div key={section.id || index} className="flex items-center space-x-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-medium text-green-700">
                        {section.order + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-green-900 truncate">
                          {section.title || `Section ${section.order + 1}`}
                        </p>
                        <p className="text-xs text-green-600">Status: {section.status || 'final'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No locked sections</p>
                )}
              </div>
            </div>

            {/* Draft Sections */}
            <div>
              <h3 className="flex items-center space-x-2 font-medium text-gray-900 mb-3">
                <Unlock className="h-4 w-4 text-blue-600" />
                <span>Will Regenerate ({draftSections.length})</span>
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {draftSections.length > 0 ? (
                  draftSections.map((section, index) => (
                    <div key={section.id || index} className="flex items-center space-x-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-xs font-medium text-blue-700">
                        {section.order + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-blue-900 truncate">
                          {section.title || `Section ${section.order + 1}`}
                        </p>
                        <p className="text-xs text-blue-600">Status: {section.status || 'draft'}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">No draft sections to regenerate</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {draftSections.length > 0 
              ? `${draftSections.length} section${draftSections.length === 1 ? '' : 's'} will be regenerated`
              : 'No sections will be changed'
            }
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!validation?.isValid || draftSections.length === 0}
              className={`flex items-center space-x-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                validation?.isValid && draftSections.length > 0
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="h-4 w-4" />
              <span>Regenerate Storyline</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}