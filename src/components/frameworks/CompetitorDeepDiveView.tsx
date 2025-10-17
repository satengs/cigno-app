'use client';

import React from 'react';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

export function CompetitorDeepDiveView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
  const competitors = data.competitors || [
    { name: 'Competitor A', strengths: ['Strong brand', 'Market leader'], weaknesses: ['High costs', 'Slow innovation'] },
    { name: 'Competitor B', strengths: ['Innovation', 'Customer focus'], weaknesses: ['Limited scale', 'New entrant'] },
    { name: 'Competitor C', strengths: ['Cost advantage', 'Global reach'], weaknesses: ['Weak brand', 'Quality issues'] }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Competitor Deep Dive</h3>
        
        <div className="space-y-4">
          {competitors.map((competitor, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-2">{competitor.name}</h4>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-green-700 mb-2">Strengths</h5>
                  <ul className="space-y-1">
                    {competitor.strengths.map((strength, i) => (
                      <li key={i} className="text-xs text-green-600 flex items-start">
                        <span className="text-green-500 mr-2">+</span>
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h5 className="text-sm font-medium text-red-700 mb-2">Weaknesses</h5>
                  <ul className="space-y-1">
                    {competitor.weaknesses.map((weakness, i) => (
                      <li key={i} className="text-xs text-red-600 flex items-start">
                        <span className="text-red-500 mr-2">-</span>
                        {weakness}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {insights && insights.length > 0 && (
        <InsightsList insights={insights} />
      )}
      
      {takeaway && (
        <Takeaway takeaway={takeaway} />
      )}
    </div>
  );
}
