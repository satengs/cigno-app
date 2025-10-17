'use client';

import React from 'react';
import { Lightbulb } from 'lucide-react';
import { InsightsListProps } from '../types';

export function InsightsList({ insights, className = '' }: InsightsListProps) {
  if (!insights || insights.length === 0) return null;

  return (
    <div className={`mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200 ${className}`}>
      <div className="flex items-center mb-2">
        <Lightbulb className="h-4 w-4 text-blue-600 mr-2" />
        <h4 className="text-sm font-semibold text-blue-800">Key Insights</h4>
      </div>
      <ul className="space-y-1">
        {insights.map((insight, index) => (
          <li key={index} className="text-xs text-blue-700 flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            {insight}
          </li>
        ))}
      </ul>
    </div>
  );
}
