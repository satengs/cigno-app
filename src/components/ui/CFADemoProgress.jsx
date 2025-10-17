'use client';

import React from 'react';
import { 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw,
  BarChart3,
  Users,
  Target,
  Zap,
  Network
} from 'lucide-react';

export default function CFADemoProgress({ 
  isVisible, 
  progress = {}, 
  className = '' 
}) {
  const phases = [
    {
      name: 'Market Sizing',
      icon: BarChart3,
      description: 'Analyzing Swiss pension market by product',
      color: 'blue'
    },
    {
      name: 'Competitive Analysis',
      icon: Users,
      description: 'Mapping competitive landscape and business models',
      color: 'green'
    },
    {
      name: 'Capability Assessment',
      icon: Target,
      description: 'Benchmarking UBS capabilities vs competitors',
      color: 'orange'
    },
    {
      name: 'Strategic Planning',
      icon: Zap,
      description: 'Developing ecosystem strategy options',
      color: 'purple'
    },
    {
      name: 'Partnership Strategy',
      icon: Network,
      description: 'Identifying implementation partnerships',
      color: 'teal'
    }
  ];

  const currentPhase = progress.currentPhase || 0;
  const progressPercent = progress.progress || 0;
  const status = progress.status || 'not_started';
  const elapsed = progress.elapsed || 0;
  const estimatedRemaining = progress.estimatedRemaining;

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m ${Math.round((ms % 60000) / 1000)}s`;
  };

  const getPhaseStatus = (index) => {
    if (index < currentPhase) return 'completed';
    if (index === currentPhase && status === 'in_progress') return 'current';
    if (index === currentPhase && status === 'failed') return 'failed';
    return 'pending';
  };

  const getStatusIcon = (phaseStatus) => {
    switch (phaseStatus) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getPhaseClasses = (phaseStatus, color) => {
    const baseClasses = "relative p-3 rounded-lg border text-left transition-all duration-300";
    
    switch (phaseStatus) {
      case 'completed':
        return `${baseClasses} bg-green-50 border-green-200 text-green-900`;
      case 'current':
        return `${baseClasses} bg-${color}-50 border-${color}-300 text-${color}-900 ring-2 ring-${color}-200`;
      case 'failed':
        return `${baseClasses} bg-red-50 border-red-200 text-red-900`;
      default:
        return `${baseClasses} bg-gray-50 border-gray-200 text-gray-600`;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900">
                CFA-DEMO Analysis
              </h3>
              <p className="text-sm text-blue-700">
                {progress.phase || 'Comprehensive strategic analysis'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-900">
              {Math.round(progressPercent)}%
            </div>
            <div className="text-xs text-blue-600">
              {status === 'completed' ? 'Complete' : 
               status === 'failed' ? 'Failed' : 
               status === 'in_progress' ? 'In Progress' : 'Ready'}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="w-full bg-blue-200 rounded-full h-3 mb-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
          />
        </div>
        
        {/* Timing Information */}
        <div className="flex items-center justify-between text-sm text-blue-700">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>Elapsed: {formatDuration(elapsed)}</span>
            </div>
            {estimatedRemaining && status === 'in_progress' && (
              <div className="flex items-center space-x-1">
                <span>Remaining: ~{formatDuration(estimatedRemaining)}</span>
              </div>
            )}
          </div>
          <div className="text-xs">
            Phase {currentPhase + 1} of {phases.length}
          </div>
        </div>
      </div>

      {/* Phase Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        {phases.map((phase, index) => {
          const phaseStatus = getPhaseStatus(index);
          const Icon = phase.icon;
          
          return (
            <div 
              key={index}
              className={getPhaseClasses(phaseStatus, phase.color)}
            >
              <div className="flex items-start justify-between mb-2">
                <Icon className="h-5 w-5 flex-shrink-0" />
                {getStatusIcon(phaseStatus)}
              </div>
              
              <div className="space-y-1">
                <div className="font-medium text-sm leading-tight">
                  {phase.name}
                </div>
                <div className="text-xs opacity-75 leading-tight">
                  {phase.description}
                </div>
              </div>
              
              {/* Phase-specific status info */}
              {phaseStatus === 'current' && (
                <div className="mt-2 pt-2 border-t border-current opacity-50">
                  <div className="text-xs">Processing...</div>
                </div>
              )}
              
              {phaseStatus === 'completed' && progress.phaseResults?.[index] && (
                <div className="mt-2 pt-2 border-t border-current opacity-50">
                  <div className="text-xs">
                    {formatDuration(progress.phaseResults[index].duration)}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Status Messages */}
      {progress.message && (
        <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
          <div className="text-sm text-gray-700">
            {progress.message}
          </div>
        </div>
      )}

      {/* Error or Warning Messages */}
      {status === 'failed' && (
        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-sm text-red-700">
              Analysis failed. Fallback data will be provided.
            </div>
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {status === 'completed' && progress.summary && (
        <div className="bg-green-50 rounded-lg p-4 border border-green-200">
          <div className="flex items-center space-x-2 mb-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div className="font-medium text-green-900">
              Analysis Complete
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-green-700">
            <div>
              <div className="font-medium">Duration</div>
              <div>{formatDuration(progress.summary.totalDuration)}</div>
            </div>
            <div>
              <div className="font-medium">Phases</div>
              <div>{progress.summary.completedPhases}/{progress.summary.totalPhases}</div>
            </div>
            <div>
              <div className="font-medium">Success Rate</div>
              <div>{Math.round(progress.summary.successRate * 100)}%</div>
            </div>
            <div>
              <div className="font-medium">Slides</div>
              <div>5 strategic slides</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}