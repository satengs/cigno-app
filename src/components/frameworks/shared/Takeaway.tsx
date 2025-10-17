'use client';

import React from 'react';
import { Target } from 'lucide-react';
import { TakeawayProps } from '../types';

export function Takeaway({ takeaway, className = '' }: TakeawayProps) {
  if (!takeaway) return null;

  return (
    <div className={`mt-4 p-4 bg-green-50 rounded-lg border border-green-200 ${className}`}>
      <div className="flex items-center mb-2">
        <Target className="h-4 w-4 text-green-600 mr-2" />
        <h4 className="text-sm font-semibold text-green-800">Key Takeaway</h4>
      </div>
      <p className="text-xs text-green-700">{takeaway}</p>
    </div>
  );
}
