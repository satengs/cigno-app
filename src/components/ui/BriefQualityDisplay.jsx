/**
 * BriefQualityDisplay Component
 * Single source of truth for displaying brief quality scores
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const getScoreStyles = (score) => {
  if (score === null || score === undefined) {
    return {
      card: 'border-gray-200 bg-gray-50',
      value: 'text-gray-500',
      progress: 'bg-gray-300'
    };
  }
  
  if (score >= 7.5) {
    return {
      card: 'border-green-200 bg-green-50',
      value: 'text-green-700',
      progress: 'bg-green-500'
    };
  }
  
  if (score >= 5) {
    return {
      card: 'border-yellow-200 bg-yellow-50',
      value: 'text-yellow-700',
      progress: 'bg-yellow-500'
    };
  }
  
  return {
    card: 'border-red-200 bg-red-50',
    value: 'text-red-700',
    progress: 'bg-red-500'
  };
};

export default function BriefQualityDisplay({ 
  score, 
  strengths = [], 
  improvements = [],
  compact = false
}) {
  const [expandedStrengths, setExpandedStrengths] = useState(false);
  const [expandedImprovements, setExpandedImprovements] = useState(false);
  
  const qualityScore = typeof score === 'number' ? score : null;
  const qualityPercent = qualityScore !== null ? Math.min(100, Math.max(0, (qualityScore / 10) * 100)) : 0;
  const qualityStyles = getScoreStyles(qualityScore);

  if (qualityScore === null && strengths.length === 0 && improvements.length === 0) {
    return null;
  }
  
  const PREVIEW_LIMIT = 3;

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${qualityStyles.card}`}>
        <span className={`text-sm font-semibold ${qualityStyles.value}`}>
          {qualityScore !== null ? `${qualityScore.toFixed(1)} / 10` : 'Not scored'}
        </span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 rounded-lg border p-6 ${qualityStyles.card}`}>
      <div className="flex items-center justify-between">
        <span className="block text-sm font-medium text-gray-700">Brief Quality Score</span>
        <span className={`text-lg font-semibold ${qualityStyles.value}`}>
          {qualityScore !== null ? `${qualityScore.toFixed(1)} / 10` : 'Not evaluated'}
        </span>
      </div>
      
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className={`h-full rounded-full transition-all ${qualityStyles.progress}`}
          style={{ width: `${qualityPercent}%` }}
        />
      </div>

      {strengths.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Strengths</p>
            {strengths.length > PREVIEW_LIMIT && (
              <button
                onClick={() => setExpandedStrengths(!expandedStrengths)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {expandedStrengths ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show all ({strengths.length})</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
          <ul className="space-y-1 text-xs text-gray-600">
            {(expandedStrengths ? strengths : strengths.slice(0, PREVIEW_LIMIT)).map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements.length > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-gray-700">Areas to Improve</p>
            {improvements.length > PREVIEW_LIMIT && (
              <button
                onClick={() => setExpandedImprovements(!expandedImprovements)}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
              >
                {expandedImprovements ? (
                  <>
                    <span>Show less</span>
                    <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    <span>Show all ({improvements.length})</span>
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>
          <ul className="space-y-1 text-xs text-gray-600">
            {(expandedImprovements ? improvements : improvements.slice(0, PREVIEW_LIMIT)).map((item, index) => (
              <li key={index}>• {item}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

