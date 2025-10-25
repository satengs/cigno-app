'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  FileText,
  Trash2,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Info,
  Loader2,
  XCircle
} from 'lucide-react';
import { createSectionRecord } from '../../lib/storyline/sectionUtils';
import { FRAMEWORK_SCHEMAS } from '../../lib/storyline/frameworkSchemas';
import { FrameworkRenderer } from '../frameworks/FrameworkRenderer';
import { renderFrameworkContent } from '../../lib/frameworkRenderer';
import Progress from '../ui/feedback/Progress';
import dynamic from 'next/dynamic';

const ChartPreview = dynamic(() => import('./ChartPreview'), { 
  ssr: false,
  loading: () => <div className="p-4 text-center text-gray-500">Loading chart...</div>
});

// Helper function to render section description for storyline view
const renderSectionDescription = (section) => {
  if (!section) return null;

  console.log('🔍 renderSectionDescription called with section:', section);
  console.log('🔍 section.framework:', section.framework);
  console.log('🔍 section.slide_content:', section.slide_content);
  console.log('🔍 section.slideContent:', section.slideContent);
  console.log('🔍 section.sectionContent:', section.sectionContent);

  // For framework sections, render the framework content
  // Check for slide_content (underscore) first, then slideContent (camelCase) for backward compatibility
  const slideContentData = section.slide_content || section.slideContent;
  console.log('🔍 slideContentData:', slideContentData);
  console.log('🔍 slideContentData keys:', slideContentData ? Object.keys(slideContentData) : 'null');
  
  if (section.framework && slideContentData && Object.keys(slideContentData).length > 0 && 
      section.status !== 'failed' && 
      section.status !== 'fallback_used' && 
      section.generationStatus !== 'failed' &&
      !section.source?.includes('fallback') &&
      !section.source?.includes('mock')) {
    const rendered = renderFrameworkContent(
      section.framework, 
      slideContentData, 
      section.keyPoints || [], 
      section.citations || []
    );
    
    return (
      <div className="framework-content overflow-hidden">
        <div 
          className="prose prose-sm prose-slate max-w-none overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
      </div>
    );
  }

  // Show error message for failed sections
  if (section.status === 'failed' || section.generationStatus === 'failed' || 
      section.source?.includes('fallback') || section.source?.includes('mock')) {
    return (
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Content Generation Failed</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>This section failed to generate content from the AI agent.</p>
                {section.notes && (
                  <p className="mt-1 font-medium">Reason: {section.notes}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // For non-framework sections, render basic content
  return (
    <div className="space-y-4">
      {section.description && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
          <p className="text-sm text-gray-600">{section.description}</p>
        </div>
      )}
      
      {section.keyPoints && section.keyPoints.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Points</h4>
          <ul className="space-y-1">
            {section.keyPoints.map((point, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {point}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {section.insights && section.insights.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Key Insights</h4>
          <ul className="space-y-1">
            {section.insights.map((insight, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {section.citations && section.citations.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sources</h4>
          <ul className="space-y-1">
            {section.citations.map((citation, index) => (
              <li key={index} className="text-sm text-gray-600 flex items-start">
                <span className="text-gray-400 mr-2">•</span>
                {typeof citation === 'string' ? citation : citation.source || citation}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

// This function is moved down to be redefined inline for proper viewMode checking

const STATUS_BADGE_STYLES = {
  final: 'bg-green-100 text-green-800 border border-green-200',
  in_review: 'bg-orange-100 text-orange-800 border border-orange-200',
  draft: 'bg-blue-100 text-blue-800 border border-blue-200',
  not_started: 'bg-gray-100 text-gray-700 border border-gray-200'
};

const TIMELINE_TYPE_META = {
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
  }
};

const formatTimelineTimestamp = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';

  const now = new Date();
  const sameDay = date.toDateString() === now.toDateString();
  const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (sameDay) {
    return timeString;
  }
  return `${date.toLocaleDateString()} ${timeString}`;
};

const renderTimelineEntries = (entries, { compact = false, showTimestamp = true } = {}) => {
  if (!Array.isArray(entries) || entries.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-1 ${compact ? '' : 'mt-2'}`}>
      {entries.map((entry, index) => {
        if (!entry || typeof entry.message !== 'string') {
          return null;
        }

        const typeKey = typeof entry.type === 'string' ? entry.type.toLowerCase() : 'info';
        const meta = TIMELINE_TYPE_META[typeKey] || TIMELINE_TYPE_META.info;
        const IconComponent = meta.icon;
        const timestampLabel = showTimestamp ? formatTimelineTimestamp(entry.timestamp) : '';
        const key = entry.id || `${typeKey}-${index}-${entry.message.slice(0, 20)}`;

        return (
          <div
            key={key}
            className={`flex items-start gap-2 rounded-md border px-2.5 py-1.5 ${meta.container}`}
          >
            <IconComponent
              className={`h-3.5 w-3.5 mt-0.5 ${typeKey === 'progress' ? 'animate-spin' : ''}`}
            />
            <div className="flex-1">
              <p className="text-xs leading-snug">{entry.message}</p>
              {timestampLabel && (
                <p className="text-[11px] opacity-70 mt-0.5">{timestampLabel}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};


export default function SectionNavigator({
  sections = [],
  currentSectionIndex = 0,
  onSectionChange,
  onUpdateSection,
  onStatusChange,
  onToggleLock,
  onRemoveSection,
  onRegenerateSection,
  viewMode = 'storyline' // 'storyline' | 'layout'
}) {
  const [expandedSectionId, setExpandedSectionId] = useState(null);
  const [chartDrafts, setChartDrafts] = useState({});
  const [chartErrors, setChartErrors] = useState({});

  // Calculate data source statistics
  // Removed auto-expansion based on currentSectionIndex
  // useEffect(() => {
  //   setExpandedSectionId(sections[currentSectionIndex]?.id);
  // }, [currentSectionIndex, sections]);

  useEffect(() => {
    setChartDrafts({});
    setChartErrors({});
  }, [sections]);

  const statusBadgeClasses = useMemo(() => STATUS_BADGE_STYLES, []);

  // Handle section regeneration
  const handleRegenerateSection = useCallback(async (section) => {
    if (!onRegenerateSection || !section.framework) return;
    
    try {
      await onRegenerateSection(section);
    } catch (error) {
      console.error('Error regenerating section:', error);
    }
  }, [onRegenerateSection]);

  // Get framework-specific schema data
  const getFrameworkSchema = (framework) => {
    return FRAMEWORK_SCHEMAS[framework] || {
      title: 'Analysis',
      defaultChartType: 'bar',
      agent: null,
      defaultConfig: { datasets: [], labels: [] }
    };
  };

  // Dynamic rendering options based on framework type


  // Generate framework-specific chart only for successful sections with no existing charts


  const handleMarkdownChange = useCallback((section, value) => {
    if (!onUpdateSection) return;

    const record = createSectionRecord(
      { ...section, markdown: value },
      {
        id: section.id,
        order: section.order ?? 0,
        status: section.status,
        locked: section.locked,
        fallbackTitle: section.title,
        defaultContentType: section.contentBlocks?.[0]?.type,
        createdAt: section.created_at,
        updatedAt: new Date(),
        estimatedSlides: section.estimatedSlides
      }
    );

    onUpdateSection(section.id, {
      title: record.title,
      description: record.description,
      markdown: record.markdown,
      html: record.html,
      charts: record.charts,
      keyPoints: record.keyPoints,
      contentBlocks: record.contentBlocks,
      estimatedSlides: record.estimatedSlides,
      order: record.order
    });
  }, [onUpdateSection]);

  // Render section description for storyline view (text only, no charts)
  const renderSectionDescription = (section) => {
    // Only render descriptions in storyline view
    if (viewMode !== 'storyline') {
      return null;
    }
    
    // Don't render descriptions for error/failed sections
    if (section.error || section.status === 'error' || section.source === 'error-fallback') {
      return null;
    }
    
    // Show loading state for loading sections
    if (section.isLoading) {
      return (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {section.generationStatus === 'waiting' ? 'Waiting for Content...' : 
             section.generationStatus === 'preparing' ? 'Preparing Generation...' :
             section.generationStatus === 'starting' ? 'Starting Generation...' :
             section.generationStatus === 'in_progress' ? 'Generating Content...' : 'Generating Content...'}
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">
              {section.statusMessage || 
               (section.generationStatus === 'waiting' ? 'Waiting to generate content...' : 
                section.generationStatus === 'preparing' ? 'Preparing to generate content...' :
                section.generationStatus === 'starting' ? 'Starting content generation...' :
                section.generationStatus === 'in_progress' ? 'Content is being generated...' : 'Content is being generated...')}
            </p>
            {section.phaseName && (
              <p className="text-xs text-blue-600 font-medium mt-2">
                {section.phaseName}
              </p>
            )}
          </div>
        </div>
      );
    }

    // If section is completed and has content, render it instead of status message
    if ((section.generationStatus === 'completed' || section.status === 'completed') && 
        (section.slide_content || section.slideContent || section.sectionContent?.slideContent)) {
      const slideContentData = section.slide_content || section.slideContent || section.sectionContent?.slideContent;
      
      console.log(`🔍 RENDERING COMPLETED SECTION (STORYLINE):`, {
        framework: section.framework,
        generationStatus: section.generationStatus,
        status: section.status,
        hasSlideContent: !!section.slide_content,
        hasSlideContentCamel: !!section.slideContent,
        hasSectionContent: !!section.sectionContent?.slideContent,
        slideContentData: slideContentData,
        slideContentKeys: slideContentData ? Object.keys(slideContentData) : 'null'
      });
      
      if (slideContentData && Object.keys(slideContentData).length > 0) {
        console.log(`🔍 RENDERING FRAMEWORK CONTENT for ${section.framework}`);
        const rendered = renderFrameworkContent(
          section.framework, 
          slideContentData, 
          section.keyPoints || [], 
          section.citations || []
        );
        
        console.log(`🔍 RENDERED HTML:`, rendered.html.substring(0, 200) + '...');
        
        return (
          <div className="mt-3 framework-content overflow-hidden">
            <div 
              className="prose prose-sm prose-slate max-w-none overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: rendered.html }}
            />
          </div>
        );
      } else {
        console.log(`🔍 NO SLIDE CONTENT DATA FOUND for ${section.framework}`);
      }
    }
    
    // Check for slide_content (underscore) first, then slideContent (camelCase) for backward compatibility
    const slideContent = (section.slide_content && Object.keys(section.slide_content || {}).length > 0)
      ? section.slide_content
      : (section.slideContent && Object.keys(section.slideContent || {}).length > 0)
        ? section.slideContent
        : (section.sectionContent?.slideContent && Object.keys(section.sectionContent.slideContent || {}).length > 0)
          ? section.sectionContent.slideContent
          : null;

    const displayInsights = Array.isArray(section.insights) && section.insights.length > 0
      ? section.insights
      : Array.isArray(section.sectionContent?.insights)
        ? section.sectionContent.insights
        : [];

    const displayCitations = Array.isArray(section.citations) && section.citations.length > 0
      ? section.citations
      : Array.isArray(section.sectionContent?.citations)
        ? section.sectionContent.citations
        : [];

    // Render framework-specific content using dynamic renderer (text only)
    if (slideContent) {
      return (
        <div className="mt-3 space-y-4">
          <div className="framework-content overflow-hidden">
            <div className="prose prose-sm prose-slate max-w-none overflow-x-auto">
              {(() => {
                const rendered = renderFrameworkContent(
                  section.framework, 
                  slideContent, 
                  section.keyPoints || displayInsights, 
                  displayCitations
                );
                return (
                  <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
                );
              })()}
            </div>
          </div>
          
          {/* Insights - only render if they exist from AI agent */}
          {displayInsights.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Key Insights</p>
              <ul className="space-y-1">
                {displayInsights.map((insight, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Citations - only render if they exist from AI agent */}
          {displayCitations.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sources</p>
              <ul className="space-y-1">
                {displayCitations.map((citation, index) => (
                  <li key={index} className="text-xs text-gray-500 flex items-start">
                    <span className="text-gray-400 mr-2">•</span>
                    <span>{typeof citation === 'string' ? citation : citation.source || citation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }
    
    // Fallback: only render insights and citations if no slideContent
    const hasContent = displayInsights.length > 0 || displayCitations.length > 0;
    
    if (!hasContent) {
      return null;
    }
    
    return (
      <div className="mt-3 space-y-3">
        {/* Insights - only render if they exist from AI agent */}
        {displayInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Key Insights</p>
            <ul className="space-y-1">
              {displayInsights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Citations - only render if they exist from AI agent */}
        {displayCitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sources</p>
            <ul className="space-y-1">
              {displayCitations.map((citation, index) => (
                <li key={index} className="text-xs text-gray-500 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{typeof citation === 'string' ? citation : citation.source || citation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  // Render layout view content (text + charts)
  const renderChartPreview = (section) => {
    // Only render in layout view
    if (viewMode !== 'layout') {
      return null;
    }
    
    // Only render on client side
    if (typeof window === 'undefined') {
      return null;
    }
    
    // Don't render for error/failed sections
    if (section.error || section.status === 'error' || section.source === 'error-fallback') {
      return null;
    }
    
    // Show loading state for loading sections
    if (section.isLoading) {
      return (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            {section.generationStatus === 'waiting' ? 'Waiting for Content...' : 
             section.generationStatus === 'preparing' ? 'Preparing Generation...' :
             section.generationStatus === 'starting' ? 'Starting Generation...' :
             section.generationStatus === 'in_progress' ? 'Generating Content...' : 'Generating Content...'}
          </p>
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-center">
            <p className="text-sm text-gray-500">
              {section.statusMessage || 
               (section.generationStatus === 'waiting' ? 'Waiting to generate content...' : 
                section.generationStatus === 'preparing' ? 'Preparing to generate content...' :
                section.generationStatus === 'starting' ? 'Starting content generation...' :
                section.generationStatus === 'in_progress' ? 'Content is being generated...' : 'Content is being generated...')}
            </p>
            {section.phaseName && (
              <p className="text-xs text-blue-600 font-medium mt-2">
                {section.phaseName}
              </p>
            )}
          </div>
        </div>
      );
    }

    // If section is completed and has content, render it instead of status message
    if ((section.generationStatus === 'completed' || section.status === 'completed') && 
        (section.slide_content || section.slideContent || section.sectionContent?.slideContent)) {
      const slideContentData = section.slide_content || section.slideContent || section.sectionContent?.slideContent;
      
      if (slideContentData && Object.keys(slideContentData).length > 0) {
        const rendered = renderFrameworkContent(
          section.framework, 
          slideContentData, 
          section.keyPoints || [], 
          section.citations || []
        );
        
        return (
          <div className="mt-3 framework-content overflow-hidden">
            <div 
              className="prose prose-sm prose-slate max-w-none overflow-x-auto"
              dangerouslySetInnerHTML={{ __html: rendered.html }}
            />
          </div>
        );
      }
    }
    
    // Check for slide_content (underscore) first, then slideContent (camelCase) for backward compatibility
    const slideContent = (section.slide_content && Object.keys(section.slide_content || {}).length > 0)
      ? section.slide_content
      : (section.slideContent && Object.keys(section.slideContent || {}).length > 0)
        ? section.slideContent
        : (section.sectionContent?.slideContent && Object.keys(section.sectionContent.slideContent || {}).length > 0)
          ? section.sectionContent.slideContent
          : null;

    const displayInsights = Array.isArray(section.insights) && section.insights.length > 0
      ? section.insights
      : Array.isArray(section.sectionContent?.insights)
        ? section.sectionContent.insights
        : [];

    const displayCitations = Array.isArray(section.citations) && section.citations.length > 0
      ? section.citations
      : Array.isArray(section.sectionContent?.citations)
        ? section.sectionContent.citations
        : [];

    const charts = Array.isArray(section.charts) && section.charts.length > 0
      ? section.charts
      : Array.isArray(section.sectionContent?.charts)
        ? section.sectionContent.charts
        : [];

    const hasContent = slideContent || displayInsights.length > 0 || displayCitations.length > 0 || charts.length > 0;
    
    if (!hasContent) {
      return null;
    }
    
    return (
      <div className="mt-3 space-y-4">
        {/* Render framework-specific content using dynamic renderer */}
        {slideContent && (
          <div className="framework-content overflow-hidden">
            <div className="prose prose-sm prose-slate max-w-none overflow-x-auto">
              {(() => {
                const rendered = renderFrameworkContent(
                  section.framework, 
                  slideContent, 
                  section.keyPoints || displayInsights, 
                  displayCitations
                );
                return (
                  <div dangerouslySetInnerHTML={{ __html: rendered.html }} />
                );
              })()}
            </div>
          </div>
        )}
        
        {/* Render insights if available */}
        {displayInsights.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Key Insights</p>
            <ul className="space-y-1">
              {displayInsights.map((insight, index) => (
                <li key={index} className="text-sm text-gray-700 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{insight}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Render citations if available */}
        {displayCitations.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Sources</p>
            <ul className="space-y-1">
              {displayCitations.map((citation, index) => (
                <li key={index} className="text-xs text-gray-500 flex items-start">
                  <span className="text-gray-400 mr-2">•</span>
                  <span>{typeof citation === 'string' ? citation : citation.source || citation}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Render charts if available */}
        {charts.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Charts</p>
            <div className="grid gap-3 md:grid-cols-2">
              {charts.map((chart) => {
                if (!chart || !chart.id) return null;
                return (
                  <div key={chart.id}>
                    <ChartPreview chart={chart} />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  const getChartDraftValue = (chart) => {
    if (chartDrafts[chart.id] !== undefined) {
      return chartDrafts[chart.id];
    }
    try {
      return JSON.stringify(chart.config || {}, null, 2);
    } catch (error) {
      return chart.raw || '';
    }
  };

  const handleChartConfigDraftChange = (chartId, value) => {
    setChartDrafts((prev) => ({ ...prev, [chartId]: value }));
  };

  const handleChartConfigSave = (sectionId, chart, value) => {
    if (!onUpdateSection) return;
    try {
      const parsed = value.trim() ? JSON.parse(value) : {};
      const section = sections.find((item) => item.id === sectionId);
      if (!section) return;

      const updatedCharts = (section.charts || []).map((item) =>
        item.id === chart.id
          ? {
              ...item,
              config: parsed,
              raw: value
            }
          : item
      );

      onUpdateSection(sectionId, {
        charts: updatedCharts
      });

      setChartErrors((prev) => ({ ...prev, [chart.id]: null }));
      setChartDrafts((prev) => ({ ...prev, [chart.id]: value }));
    } catch (error) {
      setChartErrors((prev) => ({
        ...prev,
        [chart.id]: 'Invalid JSON configuration'
      }));
    }
  };

  if (!sections.length) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 p-12 text-center">
        <FileText className="mb-3 h-8 w-8 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">No sections available yet</p>
        <p className="text-xs text-gray-500 mt-1">Sections will appear here when generated from backend data</p>
      </div>
    );
  }

  // Debug: Log section data
  console.log('🔍 SectionNavigator received sections:', sections.map(s => ({
    id: s.id,
    title: s.title,
    framework: s.framework,
    hasHtml: !!s.html,
    hasMarkdown: !!s.markdown,
    hasDescription: !!s.description,
    hasSlideContent: !!s.slide_content,
    hasSlideContentCamel: !!s.slideContent,
    hasSectionContent: !!s.sectionContent?.slideContent,
    slideContentKeys: s.slide_content ? Object.keys(s.slide_content) : null,
    slideContentCamelKeys: s.slideContent ? Object.keys(s.slideContent) : null,
    status: s.status,
    isLoading: s.isLoading,
    generationStatus: s.generationStatus,
    source: s.source,
    slideContentData: s.slide_content || s.slideContent || s.sectionContent?.slideContent
  })));

  const [hasUserToggled, setHasUserToggled] = useState(false);

  const handleToggleExpand = (sectionId, index) => {
    setHasUserToggled(true);
    setExpandedSectionId(prev => (prev === sectionId ? null : sectionId));
  };

  // Auto-expand completed sections
  useEffect(() => {
    if (hasUserToggled) return;

    const completedSection = sections.find(s => 
      (s.generationStatus === 'completed' || s.status === 'completed') && 
      (s.slide_content || s.slideContent || s.sectionContent?.slideContent)
    );
    
    if (completedSection && !expandedSectionId) {
      console.log(`🔍 Auto-expanding completed section:`, completedSection.framework);
      setExpandedSectionId(completedSection.id);
    }
  }, [sections, expandedSectionId, hasUserToggled]);

  const handleTitleChange = (sectionId, value) => {
    onUpdateSection?.(sectionId, { title: value });
  };

  const handleDescriptionChange = (sectionId, value) => {
    onUpdateSection?.(sectionId, { description: value });
  };



  return (
    <div className="space-y-4">
      {sections.map((section, index) => {
        const isExpanded = expandedSectionId === section.id;
        const isLocked = !!section.locked;
        const statusClass = statusBadgeClasses[section.status] || statusBadgeClasses.not_started;
        const isCurrentSection = index === currentSectionIndex;
        const displayTitle = section.slide_content?.title
          || section.slideContent?.title
          || section.sectionContent?.title
          || section.title
          || `Section ${index + 1}`;
        const frameworkBadgeClass = (() => {
          if (!section.framework) return '';
          if (section.source === 'fallback-data' || section.source === 'error-fallback') return 'bg-red-50 text-red-700 border border-red-200';
          if (section.source && section.source.includes('regenerated')) return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
          return 'bg-green-50 text-green-700 border border-green-200';
        })();
        const timelineEntries = [];
        const latestTimelineEntry = null;

        return (
          <div
            key={section.id || index}
            className={`group rounded-xl border bg-white transition-all duration-200 hover:shadow-md ${
              isExpanded 
                ? 'shadow-lg border-blue-200 ring-1 ring-blue-100' 
                : isCurrentSection 
                  ? 'border-blue-200 bg-blue-50/30'
                  : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center justify-between p-5">
              <div className="flex items-center space-x-4 flex-1 min-w-0">
                {/* Collapse Arrow */}
                <button
                  onClick={() => handleToggleExpand(section.id, index)}
                  className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors"
                  title={isExpanded ? 'Collapse section' : 'Expand section'}
                  style={{ backgroundColor: 'transparent' }}
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  ) : (
                    <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                  )}
                </button>
                
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold ${
                  isCurrentSection 
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {index + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start space-x-2 mb-1">
                    <h3 className="text-base font-semibold text-gray-900 break-words leading-tight">
                      {displayTitle}
                    </h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusClass}`}>
                      {(section.status || 'draft').replace('_', ' ')}
                    </span>
                    {section.framework && (
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${frameworkBadgeClass}`}>
                        {section.framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    )}
                    {/* Debug: Show framework info */}
                    {!section.framework && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800 border border-red-200">
                        No Framework
                      </span>
                    )}
                  </div>
                  
                  {/* Show description or content preview in collapsed view */}
                  {section.description && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-1">
                      {section.description}
                    </p>
                  )}
                  
                  {/* Show content preview for completed sections */}
                  {!isExpanded && (section.generationStatus === 'completed' || section.status === 'completed') && 
                   (section.slide_content || section.slideContent || section.sectionContent?.slideContent) && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-green-800">Content Generated</span>
                        <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                          {section.source || 'AI Generated'}
                        </span>
                      </div>
                      <p className="text-xs text-green-700">
                        Click to expand and view the generated content
                      </p>
                    </div>
                  )}
                  
                  {/* Section Progress Bar */}
                  {(section.isLoading || section.generationStatus === 'in_progress' || section.progress !== undefined) && (
                    <div className="mb-2">
                      <Progress
                        value={section.progress || 0}
                        max={100}
                        size="sm"
                        variant={section.generationStatus === 'failed' ? 'danger' : 
                                section.generationStatus === 'completed' ? 'success' : 'info'}
                        showLabel={false}
                      />
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {section.phaseName || section.generationStatus || 'Processing...'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {section.progress || 0}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Show loading status and narratives */}
                  {section.isLoading && (
                    <div className="mb-1">
                      <p className="text-sm text-gray-400 italic">
                        {section.statusMessage || 
                         (section.generationStatus === 'waiting' ? 'Waiting to generate content...' : 
                          section.generationStatus === 'preparing' ? 'Preparing to generate content...' :
                          section.generationStatus === 'starting' ? 'Starting content generation...' :
                          section.generationStatus === 'in_progress' ? 'Generating content...' : 'Generating content...')}
                      </p>
                      {section.phaseName && (
                        <p className="text-xs text-blue-600 font-medium">
                          {section.phaseName}
                        </p>
                      )}
                      {section.progress !== undefined && (
                        <div className="mt-1">
                          <span className="text-xs text-gray-500 font-mono">
                            Progress: {section.progress}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Show only the latest unique narrative when collapsed */}
                  {section.isLoading && section.narratives && section.narratives.length > 0 && (
                    <div className="mt-1">
                      <p className="text-xs text-blue-600">
                        {section.narratives[section.narratives.length - 1]?.message || section.narratives[section.narratives.length - 1]}
                      </p>
                    </div>
                  )}

                  {latestTimelineEntry && (
                    <div className="mt-2">
                      {renderTimelineEntries([latestTimelineEntry], { compact: true, showTimestamp: false })}
                    </div>
                  )}

                  {section.sources?.length > 0 && (
                    <div className="flex items-center text-xs text-gray-500">
                      <FileText className="h-3 w-3 mr-1" />
                      Sources: {section.sources.join(', ')}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onToggleLock?.(section.id, !section.locked);
                  }}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                    section.locked 
                      ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                  title={section.locked ? 'Unlock section' : 'Lock section'}
                >
                  {section.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (section.locked) return;
                    handleRegenerateSection(section);
                  }}
                  disabled={section.locked || !section.framework}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                    section.locked || !section.framework
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                  }`}
                  title={section.locked ? 'Unlock to regenerate' : !section.framework ? 'No framework to regenerate' : 'Regenerate section content'}
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (section.locked) return;
                    onRemoveSection?.(section.id);
                  }}
                  disabled={section.locked}
                  className={`flex items-center justify-center h-8 w-8 rounded-lg transition-colors ${
                    section.locked
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                  title={section.locked ? 'Unlock to remove' : 'Remove section'}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            {isExpanded && (
              <div className="border-t border-gray-100 bg-gray-50/50 overflow-hidden">
                <div className="p-5 space-y-5 overflow-hidden">
                  <div className="grid gap-5 md:grid-cols-2 overflow-hidden">

                    {/* Only render title if it exists in response */}
                    {section.title && (
                    <div className="md:col-span-2">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{section.title}</h3>
                    </div>
                    )}

                    {/* Render section content based on view mode */}
                    <div className="md:col-span-2">
                      {/* Show progress bar when expanded and generating */}
                      {section.isLoading && section.progress !== undefined && (
                        <div className="mb-4">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${section.progress}%` }}
                            />
                          </div>
                          <p className="mt-2 text-sm text-gray-600">
                            {section.phaseName || `Progress ${section.progress}%`}
                          </p>
                        </div>
                      )}

                      {timelineEntries.length > 0 && !section.isLoading && (
                        <div className="mb-4">
                          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide mb-1">Generation Status</p>
                          {renderTimelineEntries(timelineEntries)}
                        </div>
                      )}
                      
                      {/* Render section description for storyline view */}
                      {renderSectionDescription(section)}
                      
                      {/* Render charts for layout view */}
                      {renderChartPreview(section)}
                    </div>

                    {/* Chart configuration for non-framework sections */}
                    {!section.framework && (section.charts || []).length > 0 && (
                      <div className="md:col-span-2 space-y-5">
                        <p className="text-sm font-medium text-gray-700">Chart Configuration</p>
                        {(section.charts || []).map((chart) => {
                          const draftValue = getChartDraftValue(chart);
                          const errorMessage = chartErrors[chart.id];
                          return (
                            <div key={chart.id} className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                              <div className="flex items-start justify-between mb-3">
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{chart.title || chart.id}</p>
                                  {chart.caption && (
                                    <p className="text-xs text-gray-500 mt-1">{chart.caption}</p>
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleChartConfigSave(section.id, chart, draftValue)}
                                  className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
                                >
                                  Apply JSON
                                </button>
                              </div>
                              <textarea
                                value={draftValue}
                                onChange={(event) => handleChartConfigDraftChange(chart.id, event.target.value)}
                                onBlur={() => handleChartConfigSave(section.id, chart, draftValue)}
                                disabled={isLocked}
                                rows={8}
                                className={`w-full font-mono text-xs rounded-md border px-3 py-2 transition-colors ${
                                  isLocked
                                    ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : errorMessage
                                      ? 'border-red-300 bg-red-50'
                                      : 'border-gray-300 bg-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100'
                                }`}
                                placeholder="Paste valid JSON chart configuration here..."
                              />
                              {errorMessage ? (
                                <p className="mt-2 text-xs font-medium text-red-600">{errorMessage}</p>
                              ) : (
                                <p className="mt-2 text-[11px] text-gray-400">
                                  Update chart data and press Apply JSON to refresh the preview.
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>

                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
