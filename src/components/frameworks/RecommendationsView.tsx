'use client';

import React from 'react';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

export function RecommendationsView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
  const recommendations = data.recommendations || [
    {
      title: 'Immediate Action Required',
      priority: 'high',
      description: 'Address critical capability gaps in digital transformation',
      timeline: 'Q1 2024'
    },
    {
      title: 'Strategic Investment',
      priority: 'medium',
      description: 'Invest in AI and automation capabilities',
      timeline: 'Q2-Q3 2024'
    },
    {
      title: 'Long-term Planning',
      priority: 'low',
      description: 'Develop comprehensive digital strategy',
      timeline: 'Q4 2024'
    }
  ];

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'medium':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-green-200 bg-green-50';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Strategic Recommendations</h3>
        
        <div className="space-y-3">
          {recommendations.map((rec, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getPriorityColor(rec.priority)}`}>
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-1">
                  {getPriorityIcon(rec.priority)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm font-semibold text-gray-900">
                      {rec.title}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {rec.timeline}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-600">
                    {rec.description}
                  </p>
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
