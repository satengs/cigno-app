'use client';

import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  XCircle,
  Clock
} from 'lucide-react';

const NARRATIVE_TYPE_META = {
  success: {
    icon: CheckCircle2,
    container: 'border-green-200 bg-green-50 text-green-700'
  },
  error: {
    icon: XCircle,
    container: 'border-red-200 bg-red-50 text-red-700'
  },
  warning: {
    icon: AlertTriangle,
    container: 'border-amber-200 bg-amber-50 text-amber-700'
  },
  progress: {
    icon: Loader2,
    container: 'border-blue-200 bg-blue-50 text-blue-700'
  },
  info: {
    icon: Info,
    container: 'border-slate-200 bg-slate-50 text-slate-600'
  },
  default: {
    icon: Clock,
    container: 'border-gray-200 bg-gray-50 text-gray-600'
  }
};

const formatTimestamp = (timestamp) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.valueOf())) return '';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  
  if (sameDay) {
    return timeString;
  }
  return `${date.toLocaleDateString()} ${timeString}`;
};

/**
 * Display narratives with proper styling and icons
 */
export default function NarrativeDisplay({ 
  narratives = [], 
  title = "Progress", 
  compact = false, 
  showTimestamp = true,
  maxHeight = "200px",
  className = ""
}) {
  if (!Array.isArray(narratives) || narratives.length === 0) {
    return null;
  }

  return (
    <div className={`narrative-display ${className}`}>
      {title && (
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-2">
          {title}
        </p>
      )}
      
      <div 
        className={`space-y-2 overflow-y-auto ${compact ? '' : 'pr-1'}`}
        style={{ maxHeight }}
      >
        {narratives.map((narrative, index) => {
          const narrativeType = narrative.type || 'default';
          const meta = NARRATIVE_TYPE_META[narrativeType] || NARRATIVE_TYPE_META.default;
          const IconComponent = meta.icon;
          const timestamp = showTimestamp ? formatTimestamp(narrative.timestamp) : '';
          const key = narrative.id || `narrative-${index}-${narrative.message?.slice(0, 20)}`;

          return (
            <div
              key={key}
              className={`flex items-start gap-2 rounded-md border px-3 py-2 ${meta.container} ${
                compact ? 'text-xs' : 'text-sm'
              }`}
            >
              <IconComponent
                className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                  narrativeType === 'progress' ? 'animate-spin' : ''
                }`}
              />
              <div className="flex-1 min-w-0">
                <p className={`${compact ? 'text-xs' : 'text-sm'} leading-snug break-words`}>
                  {narrative.message}
                </p>
                {timestamp && (
                  <p className="text-[11px] opacity-70 mt-1">{timestamp}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Compact narrative display for inline use
 */
export function CompactNarrativeDisplay({ narratives = [], latestOnly = false }) {
  const displayNarratives = latestOnly && narratives.length > 0 
    ? [narratives[narratives.length - 1]] 
    : narratives;

  return (
    <NarrativeDisplay
      narratives={displayNarratives}
      compact={true}
      showTimestamp={false}
      maxHeight="100px"
      className="mt-2"
    />
  );
}

/**
 * Live narrative display that auto-scrolls to bottom
 */
export function LiveNarrativeDisplay({ narratives = [], title = "Live Progress" }) {
  const scrollRef = React.useRef(null);

  // Auto-scroll to bottom when new narratives arrive
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [narratives]);

  if (!narratives.length) {
    return (
      <div className="text-center text-gray-500 py-4">
        <Clock className="h-6 w-6 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Waiting for progress updates...</p>
      </div>
    );
  }

  return (
    <div className="live-narrative-display">
      {title && (
        <div className="flex items-center gap-2 mb-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
          <p className="text-sm font-medium text-gray-700">{title}</p>
        </div>
      )}
      
      <div 
        ref={scrollRef}
        className="space-y-2 overflow-y-auto pr-1 max-h-64 border rounded-lg bg-gray-50 p-3"
      >
        {narratives.map((narrative, index) => {
          const narrativeType = narrative.type || 'default';
          const meta = NARRATIVE_TYPE_META[narrativeType] || NARRATIVE_TYPE_META.default;
          const IconComponent = meta.icon;

          return (
            <div
              key={narrative.id || `live-${index}`}
              className={`flex items-start gap-2 rounded border px-2 py-1.5 ${meta.container} animate-fade-in`}
            >
              <IconComponent
                className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${
                  narrativeType === 'progress' ? 'animate-spin' : ''
                }`}
              />
              <div className="flex-1">
                <p className="text-xs leading-snug">{narrative.message}</p>
                <p className="text-[10px] opacity-60 mt-0.5">
                  {formatTimestamp(narrative.timestamp)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}