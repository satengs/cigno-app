'use client';

import { useState } from 'react';
import { 
  FileText, 
  Clock, 
  Eye, 
  Download, 
  BarChart3,
  TrendingUp,
  CheckCircle,
  Calendar
} from 'lucide-react';

export default function DeliverableMetrics({ 
  metrics = {}, 
  className = '' 
}) {
  const [showAllMetrics, setShowAllMetrics] = useState(false);

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num?.toLocaleString() || 0;
  };

  const formatFileSize = (sizeInMB) => {
    if (sizeInMB >= 1024) return (sizeInMB / 1024).toFixed(1) + ' GB';
    return sizeInMB?.toFixed(1) + ' MB' || '0 MB';
  };

  const formatReadingTime = (minutes) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    }
    return `${minutes}m`;
  };

  const getCompletionColor = (percentage) => {
    if (percentage >= 100) return 'text-green-500';
    if (percentage >= 75) return 'text-blue-500';
    if (percentage >= 50) return 'text-yellow-500';
    if (percentage >= 25) return 'text-orange-500';
    return 'text-red-500';
  };

  const getCompletionBgColor = (percentage) => {
    if (percentage >= 100) return 'bg-green-100 dark:bg-green-900/20';
    if (percentage >= 75) return 'bg-blue-100 dark:bg-blue-900/20';
    if (percentage >= 50) return 'bg-yellow-100 dark:bg-yellow-900/20';
    if (percentage >= 25) return 'bg-orange-100 dark:bg-orange-900/20';
    return 'bg-red-100 dark:bg-red-900/20';
  };

  const basicMetrics = [
    {
      label: 'Pages',
      value: metrics.pages_count || 0,
      icon: FileText,
      color: 'text-blue-500',
      bgColor: 'bg-blue-100 dark:bg-blue-900/20'
    },
    {
      label: 'Words',
      value: formatNumber(metrics.word_count || 0),
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-100 dark:bg-green-900/20'
    },
    {
      label: 'Reading Time',
      value: formatReadingTime(metrics.reading_time_minutes || 0),
      icon: Clock,
      color: 'text-purple-500',
      bgColor: 'bg-purple-100 dark:bg-purple-900/20'
    },
    {
      label: 'File Size',
      value: formatFileSize(metrics.file_size_mb || 0),
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-100 dark:bg-orange-900/20'
    }
  ];

  const engagementMetrics = [
    {
      label: 'Views',
      value: formatNumber(metrics.views_count || 0),
      icon: Eye,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/20'
    },
    {
      label: 'Downloads',
      value: formatNumber(metrics.download_count || 0),
      icon: Download,
      color: 'text-teal-500',
      bgColor: 'bg-teal-100 dark:bg-teal-900/20'
    }
  ];

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BarChart3 className="w-5 h-5" />
          Deliverable Metrics
        </h3>
        <button
          onClick={() => setShowAllMetrics(!showAllMetrics)}
          className="text-sm font-medium px-3 py-1 rounded-md border"
          style={{ 
            color: 'var(--text-secondary)',
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-secondary)'
          }}
        >
          {showAllMetrics ? 'Show Basic' : 'Show All'}
        </button>
      </div>

      {/* Basic Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {basicMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <div key={index} className="p-4 rounded-lg border" style={{ 
              backgroundColor: 'var(--bg-secondary)',
              borderColor: 'var(--border-primary)'
            }}>
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-full ${metric.bgColor}`}>
                  <Icon className="w-4 h-4" style={{ color: metric.color }} />
                </div>
              </div>
              <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                {metric.value}
              </div>
              <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                {metric.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Completion Progress */}
      {metrics.completion_percentage !== undefined && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <CheckCircle className="w-4 h-4" />
              Completion Progress
            </h4>
            <span className={`text-lg font-bold ${getCompletionColor(metrics.completion_percentage)}`}>
              {metrics.completion_percentage}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div 
              className={`h-3 rounded-full transition-all duration-300 ${getCompletionBgColor(metrics.completion_percentage)}`}
              style={{ 
                width: `${Math.min(metrics.completion_percentage, 100)}%`,
                backgroundColor: metrics.completion_percentage >= 100 ? '#10b981' : 
                               metrics.completion_percentage >= 75 ? '#3b82f6' :
                               metrics.completion_percentage >= 50 ? '#f59e0b' :
                               metrics.completion_percentage >= 25 ? '#f97316' : '#ef4444'
              }}
            />
          </div>
        </div>
      )}

      {/* Engagement Metrics */}
      {showAllMetrics && (
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <TrendingUp className="w-4 h-4" />
            Engagement Metrics
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {engagementMetrics.map((metric, index) => {
              const Icon = metric.icon;
              return (
                <div key={index} className="p-4 rounded-lg border" style={{ 
                  backgroundColor: 'var(--bg-secondary)',
                  borderColor: 'var(--border-primary)'
                }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`p-2 rounded-full ${metric.bgColor}`}>
                      <Icon className="w-4 h-4" style={{ color: metric.color }} />
                    </div>
                  </div>
                  <div className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                    {metric.value}
                  </div>
                  <div className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {metric.label}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Last Viewed */}
      {metrics.last_viewed && (
        <div className="p-3 rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-secondary)'
        }}>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            <Calendar className="w-4 h-4" />
            <span className="font-medium">Last viewed:</span>
            <span style={{ color: 'var(--text-primary)' }}>
              {new Date(metrics.last_viewed).toLocaleDateString()} at {new Date(metrics.last_viewed).toLocaleTimeString()}
            </span>
          </div>
        </div>
      )}

      {/* No Metrics Message */}
      {Object.keys(metrics).length === 0 && (
        <div className="p-8 text-center rounded-lg border" style={{ 
          backgroundColor: 'var(--bg-secondary)',
          borderColor: 'var(--border-primary)'
        }}>
          <BarChart3 className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
          <div className="text-lg font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            No metrics available
          </div>
          <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Metrics will appear once the deliverable is created and viewed
          </div>
        </div>
      )}
    </div>
  );
}
