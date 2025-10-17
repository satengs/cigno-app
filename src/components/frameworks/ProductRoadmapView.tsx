'use client';

import React from 'react';
import { Calendar, CheckCircle, Clock, ArrowRight } from 'lucide-react';
import { InsightsList } from './shared/InsightsList';
import { Takeaway } from './shared/Takeaway';
import { FrameworkComponentProps } from './types';

export function ProductRoadmapView({ data, insights, takeaway, className = '' }: FrameworkComponentProps) {
  // Check if we have real data
  const hasRealData = data && (data.phases || data.labels || data.datasets);
  
  if (!hasRealData) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                No Roadmap Data Available
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>
                  The AI agent for <strong>Product Roadmap</strong> did not return roadmap data.
                </p>
                <p className="mt-1">
                  This could be because:
                </p>
                <ul className="mt-1 list-disc list-inside space-y-1">
                  <li>No AI agent is configured for this framework</li>
                  <li>The agent failed to generate roadmap data</li>
                  <li>The agent response format is not supported</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Extract phases from data
  const phases = data.phases || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in-progress':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Calendar className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'in-progress':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Roadmap</h3>
        
        <div className="space-y-4">
          {phases.map((phase, index) => (
            <div key={index} className="relative">
              {/* Timeline line */}
              {index < phases.length - 1 && (
                <div className="absolute left-4 top-8 w-0.5 h-16 bg-gray-200"></div>
              )}
              
              {/* Phase card */}
              <div className={`p-4 rounded-lg border ${getStatusColor(phase.status)}`}>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(phase.status)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {phase.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {phase.duration}
                      </span>
                    </div>
                    
                    <div className="mt-2">
                      <ul className="space-y-1">
                        {phase.milestones.map((milestone, milestoneIndex) => (
                          <li key={milestoneIndex} className="flex items-start space-x-2 text-xs text-gray-600">
                            <span className="text-gray-400 mt-1">•</span>
                            <span>{milestone}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
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
