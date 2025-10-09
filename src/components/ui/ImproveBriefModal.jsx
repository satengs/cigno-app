'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Save, X, Loader2, RefreshCw, Eye, Edit3 } from 'lucide-react';
import Modal from './modals/Modal';
import Button from './buttons/Button';

export default function ImproveBriefModal({ 
  isOpen, 
  onClose, 
  onSave,
  currentBrief = '',
  deliverable = {},
  projectData = {}
}) {
  const [improvedBrief, setImprovedBrief] = useState('');
  const [isImproving, setIsImproving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [hasImproved, setHasImproved] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [qualityScore, setQualityScore] = useState(null);
  const [improvements, setImprovements] = useState([]);
  const [editableBrief, setEditableBrief] = useState('');

  // Helper function to convert HTML to plain text
  const htmlToText = (html) => {
    const temp = document.createElement('div');
    temp.innerHTML = html;
    return temp.textContent || temp.innerText || '';
  };

  // Helper function to convert plain text to HTML (basic)
  const textToHtml = (text) => {
    return text.replace(/\n/g, '<br>');
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImprovedBrief('');
      setError('');
      setHasImproved(false);
      setShowComparison(false);
      setQualityScore(null);
      setImprovements([]);
      setEditableBrief('');
      // Don't automatically start improving - wait for user to click
    }
  }, [isOpen]);

  const improveBrief = async () => {
    // Use the current improved brief if available, otherwise use the original brief
    const briefToImprove = improvedBrief.trim() || currentBrief.trim();
    
    if (!briefToImprove) {
      setError('No brief content to improve');
      return;
    }

    setIsImproving(true);
    setError('');

    try {
      const deliverableId = deliverable._id || deliverable.id;
      
      const response = await fetch('/api/ai/improve-brief', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliverableId: deliverableId,
          currentBrief: briefToImprove,
          deliverableData: {
            title: deliverable.name,
            type: deliverable.type,
            audience: deliverable.audience,
            format: deliverable.format,
            priority: deliverable.priority,
            size: deliverable.size
          },
          projectData: projectData
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to improve brief: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Handle different response formats from the API
        let briefContent = '';
        
        if (result.data.improvedBrief) {
          briefContent = result.data.improvedBrief;
        } else if (result.data.message) {
          briefContent = result.data.message;
        } else if (result.data.response) {
          // Check if response is a JSON string that needs parsing
          try {
            const parsedResponse = JSON.parse(result.data.response);
            if (parsedResponse.improvedBrief) {
              briefContent = parsedResponse.improvedBrief;
            } else {
              briefContent = result.data.response;
            }
          } catch (e) {
            // If not JSON, use the response as is
            briefContent = result.data.response;
          }
        } else {
          // Fallback to the whole data object as string if structured response not found
          briefContent = typeof result.data === 'string' ? result.data : JSON.stringify(result.data, null, 2);
        }
        
        setImprovedBrief(briefContent);
        setEditableBrief(htmlToText(briefContent));
        setHasImproved(true);
        setShowComparison(true);
        
        // Extract quality score and improvements if available
        if (result.data.response) {
          try {
            const parsedResponse = JSON.parse(result.data.response);
            if (parsedResponse.qualityScore) {
              setQualityScore(parsedResponse.qualityScore);
            }
            if (parsedResponse.improvements) {
              setImprovements(parsedResponse.improvements);
            }
          } catch (e) {
            // Ignore parsing errors for quality score
          }
        }
      } else {
        throw new Error(result.error || 'Failed to improve brief');
      }
    } catch (error) {
      console.error('Error improving brief:', error);
      setError(error.message || 'Failed to improve brief. Please try again.');
    } finally {
      setIsImproving(false);
    }
  };

  const handleSave = async () => {
    const briefToSave = showComparison ? improvedBrief : textToHtml(editableBrief);
    
    if (!briefToSave.trim()) {
      setError('No improved brief to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        await onSave(briefToSave);
      }
      onClose();
    } catch (error) {
      console.error('Error saving improved brief:', error);
      setError(error.message || 'Failed to save improved brief. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    // Always allow closing the modal
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Improve Brief with AI"
      subtitle="Compare and enhance your brief with AI assistance"
      size="xl"
      className="max-h-[95vh] overflow-hidden flex flex-col"
    >
      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Initial State - Show Improve Button */}
        {!hasImproved && !isImproving && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Improve Your Brief</h3>
              <p className="text-sm text-gray-600 mb-6">
                Click the button below to let AI analyze and enhance your brief content.
              </p>
              <Button
                onClick={improveBrief}
                disabled={isImproving}
                className="flex items-center space-x-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Improve Brief with AI</span>
              </Button>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isImproving && (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
              <p className="text-sm text-gray-600">
                AI is analyzing and improving your brief...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <X className="w-5 h-5 text-red-500" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={improveBrief}
              className="mt-3"
              disabled={isImproving}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </div>
        )}

        {/* Comparison View */}
        {hasImproved && !isImproving && showComparison && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Header with Quality Score and Actions */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium text-gray-900">Brief Comparison</h3>
                {qualityScore && (
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-600">Quality Score:</span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                      {qualityScore}/10
                    </span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowComparison(!showComparison)}
                  className="flex items-center space-x-2"
                >
                  {showComparison ? <Edit3 className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  <span>{showComparison ? 'Edit Mode' : 'Compare Mode'}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={improveBrief}
                  disabled={isImproving}
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Improve Again</span>
                </Button>
              </div>
            </div>

            {/* Side by Side Comparison */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
              {/* Current Brief */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">Current Brief</label>
                  <span className="text-xs text-gray-500">{currentBrief.length} characters</span>
                </div>
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-y-auto">
                  <div className="text-sm text-gray-700 whitespace-pre-wrap">
                    {currentBrief || 'No brief content available'}
                  </div>
                </div>
              </div>

              {/* Improved Brief */}
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">AI-Improved Brief</label>
                  <span className="text-xs text-gray-500">{improvedBrief.length} characters</span>
                </div>
                <div className="flex-1 border border-gray-300 rounded-lg overflow-hidden">
                  <div className="h-full p-4 bg-white overflow-y-auto">
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: improvedBrief }}
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  This is the AI-improved brief rendered as HTML. Click "Edit Mode" to modify the content.
                </p>
              </div>
            </div>

            {/* Improvements List */}
            {improvements.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Key Improvements Made:</h4>
                <ul className="space-y-1">
                  {improvements.slice(0, 5).map((improvement, index) => (
                    <li key={index} className="text-xs text-gray-600 flex items-start space-x-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                  {improvements.length > 5 && (
                    <li className="text-xs text-gray-500">
                      +{improvements.length - 5} more improvements...
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Edit Mode - Full Screen Improved Brief */}
        {hasImproved && !isImproving && !showComparison && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Edit Improved Brief
              </label>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditableBrief(htmlToText(improvedBrief));
                    setShowComparison(true);
                  }}
                  className="flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>Compare Mode</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setImprovedBrief(textToHtml(editableBrief));
                    improveBrief();
                  }}
                  disabled={isImproving}
                  className="flex items-center space-x-2"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Improve Again</span>
                </Button>
              </div>
            </div>
            
            <textarea
              value={editableBrief}
              onChange={(e) => setEditableBrief(e.target.value)}
              placeholder="Improved brief content will appear here..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            
            <p className="text-xs text-gray-500 mt-2">
              You can edit the improved brief above before saving. Changes will be converted to HTML when saved.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-4">
        <Button
          variant="outline"
          onClick={handleClose}
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={!hasImproved || (!improvedBrief.trim() && !editableBrief.trim()) || isImproving || isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Improved Brief'}
        </Button>
      </div>
    </Modal>
  );
}