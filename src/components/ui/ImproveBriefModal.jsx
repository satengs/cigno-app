'use client';

import { useState, useEffect } from 'react';
import { Sparkles, Save, X, Loader2, RefreshCw } from 'lucide-react';
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

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setImprovedBrief('');
      setError('');
      setHasImproved(false);
      // Don't automatically start improving - wait for user to click
    }
  }, [isOpen]);

  const improveBrief = async () => {
    if (!currentBrief.trim()) {
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
          currentBrief: currentBrief,
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
        setHasImproved(true);
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
    if (!improvedBrief.trim()) {
      setError('No improved brief to save');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      if (onSave) {
        await onSave(improvedBrief);
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
      subtitle="AI-enhanced brief based on your current content"
      size="lg"
      className="max-h-[90vh] overflow-hidden flex flex-col"
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

        {/* Improved Brief Content */}
        {hasImproved && !isImproving && (
          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-700">
                Improved Brief Content
              </label>
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
            
            <textarea
              value={improvedBrief}
              onChange={(e) => setImprovedBrief(e.target.value)}
              placeholder="Improved brief content will appear here..."
              className="flex-1 w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              style={{ minHeight: '300px' }}
            />
            
            <p className="text-xs text-gray-500 mt-2">
              You can edit the improved brief above before saving.
            </p>
          </div>
        )}

        {/* Original Brief Reference */}
        {currentBrief && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Original Brief:</h4>
            <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 max-h-32 overflow-y-auto">
              {currentBrief}
            </div>
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
          disabled={!hasImproved || !improvedBrief.trim() || isImproving || isSaving}
        >
          <Save className="w-4 h-4 mr-2" />
          {isSaving ? 'Saving...' : 'Save Improved Brief'}
        </Button>
      </div>
    </Modal>
  );
}