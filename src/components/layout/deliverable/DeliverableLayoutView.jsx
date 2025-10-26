import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2, Plus, X } from 'lucide-react';
import { normalizeScoreValue } from '../../../utils/scoreUtils';
import { renderFrameworkContent } from '../../../lib/frameworkRenderer';
import dynamic from 'next/dynamic';

const ChartPreview = dynamic(() => import('../../storyline/ChartPreview'), { 
  ssr: false,
  loading: () => <div className="h-52 flex items-center justify-center text-gray-500">Loading chart...</div>
});


const LAYOUT_OPTIONS = [
  {
    id: 'default',
    name: 'Default (Recommended)',
    description: 'Automatically uses the best layout for this section type',
    recommended: true,
    type: 'default',
    columns: 'auto',
    columnConfig: [],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="flex items-center justify-center p-1 h-12">
          <div className="w-6 h-6 rounded border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--text-primary)' }}>
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>★</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'full-width',
    name: 'Full Width',
    description: 'Single column, edge-to-edge narrative layout',
    type: 'columns',
    columns: 1,
    columnConfig: [
      { type: 'full', title: '', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12">
          <div className="w-full h-full rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'title-2-columns',
    name: 'Title + 2 Columns',
    description: 'Header with two equal content columns',
    recommended: false,
    type: 'columns',
    columns: 2,
    columnConfig: [
      { type: 'content', title: 'Content', flex: 1 },
      { type: 'analysis', title: 'Analysis', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'bcg-matrix',
    name: 'BCG Matrix',
    description: '2x2 matrix for strategic analysis',
    type: 'grid',
    columns: 2,
    rows: 2,
    columnConfig: [
      { type: 'quadrant', title: 'High Priority', flex: 1 },
      { type: 'quadrant', title: 'Medium Priority', flex: 1 },
      { type: 'quadrant', title: 'Opportunities', flex: 1 },
      { type: 'quadrant', title: 'Risks', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-2 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="grid grid-cols-2 gap-1 p-1 h-11">
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'three-columns',
    name: '3 Columns',
    description: 'Three equal content columns',
    type: 'columns',
    columns: 3,
    columnConfig: [
      { type: 'content', title: 'Point 1', flex: 1 },
      { type: 'content', title: 'Point 2', flex: 1 },
      { type: 'content', title: 'Point 3', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="flex gap-1 p-1 h-12">
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="flex-1 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Horizontal timeline with milestones',
    type: 'timeline',
    columns: 1,
    columnConfig: [
      { type: 'timeline', title: 'Timeline', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12 flex items-center">
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-2 h-2 rounded-full mx-1" style={{ backgroundColor: 'var(--text-primary)' }}></div>
          <div className="flex-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
        </div>
      </div>
    )
  },
  {
    id: 'process-flow',
    name: 'Process Flow',
    description: 'Sequential process with arrows',
    type: 'flow',
    columns: 1,
    columnConfig: [
      { type: 'flow', title: 'Process Flow', flex: 1 }
    ],
    preview: (
      <div className="w-full h-full rounded border" style={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="h-3 rounded-t border-b mb-1" style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}></div>
        <div className="p-1 h-12 flex items-center justify-center gap-1">
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
          <div className="w-1 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
          <div className="w-3 h-6 rounded" style={{ backgroundColor: 'var(--bg-primary)' }}></div>
        </div>
      </div>
    )
  }
];

const ALL_LAYOUT_IDS = LAYOUT_OPTIONS.map(option => option.id);
const MARKET_SIZING_DESIGN_AGENT_ID = process.env.NEXT_PUBLIC_MARKET_SIZING_DESIGN_AGENT_ID || '68fbb8654d9fb46a6dc33c62';

const FRAMEWORK_LAYOUT_SUPPORT = {
  // Market analysis frameworks
  market_sizing: ['default', 'full-width', 'title-2-columns', 'three-columns'],
  competitive_landscape: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  industry_trends: ['default', 'three-columns', 'timeline', 'full-width'],
  key_industry_trends: ['default', 'three-columns', 'timeline', 'full-width'],
  
  // Capability frameworks  
  capability_benchmark: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  capabilities_assessment: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  
  // Competitive analysis
  competitor_deep_dive: ['default', 'full-width'],
  competition_analysis: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  
  // Strategic frameworks
  strategic_options: ['default', 'bcg-matrix', 'process-flow', 'full-width'],
  deep_dive_strategic_option: ['default', 'bcg-matrix', 'process-flow', 'full-width'],
  buy_vs_build: ['default', 'title-2-columns', 'process-flow', 'full-width'],
  
  // Product and roadmap
  product_roadmap: ['default', 'timeline', 'process-flow', 'full-width'],
  product_landscape: ['default', 'bcg-matrix', 'three-columns', 'full-width'],
  
  // Business frameworks
  client_segments: ['default', 'three-columns', 'bcg-matrix', 'full-width'],
  partnerships: ['default', 'process-flow', 'timeline', 'full-width'],
  gap_analysis: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  recommendations: ['default', 'three-columns', 'process-flow', 'full-width'],
  
  // CFA Demo frameworks
  cfa_demo_market_sizing: ['default', 'title-2-columns', 'three-columns', 'full-width'],
  cfa_demo_competitive: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  cfa_demo_capability: ['default', 'title-2-columns', 'bcg-matrix', 'full-width'],
  cfa_demo_strategic: ['default', 'bcg-matrix', 'process-flow', 'full-width'],
  cfa_demo_partnership: ['default', 'timeline', 'process-flow', 'full-width'],
  
  // Utility frameworks
  brief_scorer: ['default', 'full-width']
};

const getSupportedLayoutsForSection = (section) => {
  if (!section) return ALL_LAYOUT_IDS;
  if (section.framework) {
    return FRAMEWORK_LAYOUT_SUPPORT[section.framework] || ['full-width'];
  }
  const hasStructuredContent = Array.isArray(section.keyPoints) || Array.isArray(section.contentBlocks);
  return hasStructuredContent ? ALL_LAYOUT_IDS : ['full-width', 'title-2-columns'];
};

const normalizeLayoutId = (layoutId) => {
  if (!layoutId || typeof layoutId !== 'string') {
    return null;
  }

  const normalized = layoutId.trim().toLowerCase();
  if (ALL_LAYOUT_IDS.includes(normalized)) {
    return normalized;
  }

  if (normalized === 'two-columns' || normalized === '2-columns' || normalized === 'two_column') {
    return 'title-2-columns';
  }

  if (normalized.includes('timeline')) {
    return 'timeline';
  }

  if (normalized.includes('process')) {
    return 'process-flow';
  }

  if (normalized.includes('matrix') || normalized.includes('bcg')) {
    return 'bcg-matrix';
  }

  if (normalized.includes('three') || normalized.includes('3-col')) {
    return 'three-columns';
  }

  if (normalized.includes('full')) {
    return 'full-width';
  }

  if (normalized === 'default') {
    return 'default';
  }

  return null;
};

const getLayoutNameForId = (layoutId) => {
  if (!layoutId) {
    return null;
  }

  const layout = LAYOUT_OPTIONS.find(option => option.id === layoutId);
  return layout ? layout.name : layoutId;
};

const safeSerialize = (value) => {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch (error) {
    console.warn('⚠️ Failed to serialize value for AI payload:', error);
    return value;
  }
};

const tryParseJson = (value) => {
  if (!value || typeof value !== 'string') {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('⚠️ Failed to parse JSON string from market sizing design agent:', error.message);
    return null;
  }
};

const normalizeAgentSectionForPreview = (section = {}, fallback = {}) => {
  if (!section || typeof section !== 'object') {
    return {
      ...fallback,
      layoutPreview: fallback.layoutPreview
    };
  }

  const slideContent = section.slideContent || section.slide_content || fallback.slideContent;
  const sectionContent = section.sectionContent || section.section_content || fallback.sectionContent || {};

  const combinedSectionContent = {
    ...sectionContent,
    slideContent: sectionContent.slideContent || slideContent,
    marketSegments: sectionContent.marketSegments || section.marketSegments || slideContent?.market_segments,
    totalMarket: sectionContent.totalMarket || section.totalMarket || slideContent?.total_market
  };

  const normalizedSection = {
    ...fallback,
    ...section,
    slideContent,
    sectionContent: combinedSectionContent,
    citations: section.citations || section.sources || fallback.citations || fallback.sources,
    insights: section.insights || fallback.insights,
    layout: section.layout || fallback.layout
  };

  delete normalizedSection.slide_content;
  delete normalizedSection.section_content;
  delete normalizedSection.sources;
  delete normalizedSection.marketSegments; // ensure nested version used
  delete normalizedSection.totalMarket;

  return normalizedSection;
};

const extractAgentSuggestionPayload = (agentData = {}) => {
  if (!agentData || typeof agentData !== 'object') {
    return {
      section: null,
      layoutRecommendation: null,
      designGuidelines: null,
      raw: agentData
    };
  }

  const parsedResponse =
    tryParseJson(agentData.response) ||
    tryParseJson(agentData.data) ||
    tryParseJson(agentData.result) ||
    null;
  const base = parsedResponse || agentData;

  return {
    section: base.section || agentData.section || null,
    layoutRecommendation: base.layoutRecommendation || agentData.layoutRecommendation || null,
    designGuidelines: base.designGuidelines || agentData.designGuidelines || null,
    raw: agentData
  };
};

export default function DeliverableLayoutView({
  hasStoryline,
  onGenerateStoryline,
  isGeneratingStoryline,
  storyline,
  onApplyLayout,
  selectedLayout = 'full-width',
  onStorylineChange,
  onApplyLayoutToAll,
  briefQuality = null,
  onSupportedLayoutsChange,
  onLayoutChange,
  onAISuggestionChange
}) {
  const [previewSection, setPreviewSection] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [slideGenerationState, setSlideGenerationState] = useState({});
  const [aiSuggestionState, setAiSuggestionState] = useState({
    status: 'idle',
    message: '',
    recommendation: null
  });

  const normalizeSlideData = (slide, index = 0, fallbackLayout = selectedLayout) => {
    if (!slide) {
      return {
        title: `Slide ${index + 1}`,
        summary: '',
        bullets: [],
        layout: fallbackLayout
      };
    }

    if (typeof slide === 'string') {
      const text = slide.trim();
      const bullets = text
        .split(/\n|•|-/)
        .map(item => item.trim())
        .filter(Boolean);

      return {
        title: `Slide ${index + 1}`,
        summary: text,
        bullets,
        layout: fallbackLayout
      };
    }

    const rawBullets = Array.isArray(slide.bullets)
      ? slide.bullets
      : Array.isArray(slide.points)
        ? slide.points
        : Array.isArray(slide.keyPoints)
          ? slide.keyPoints
          : [];

    const normalizedBullets = rawBullets
      .map(item => (typeof item === 'string' ? item.trim() : item?.content || item?.text || item?.description || ''))
      .filter(Boolean);

    const summary =
      typeof slide.summary === 'string'
        ? slide.summary
        : typeof slide.description === 'string'
          ? slide.description
          : typeof slide.content === 'string'
            ? slide.content
            : Array.isArray(slide.paragraphs)
              ? slide.paragraphs.join(' ')
              : '';

    return {
      title: slide.title || slide.heading || slide.name || `Slide ${index + 1}`,
      subtitle: slide.subtitle || slide.subheading || '',
      summary,
      bullets: normalizedBullets,
      notes: slide.notes || slide.speakerNotes || '',
      layout: slide.layout || slide.format || fallbackLayout
    };
  };


  // Get the first section or use selected section for preview
  const baseSection = previewSection 
    ? storyline?.sections?.find(s => s.id === previewSection)
    : storyline?.sections?.[0];
  
  const currentSectionIndex = storyline?.sections?.findIndex(s => s.id === baseSection?.id) ?? 0;

  const currentSection = useMemo(() => {
    if (!baseSection) return null;
    const previewData = baseSection.layoutPreview?.data || baseSection.layoutPreview?.section;
    if (previewData && typeof previewData === 'object') {
      return {
        ...baseSection,
        ...previewData,
        layout: previewData.layout || baseSection.layout,
        sectionContent: previewData.sectionContent || baseSection.sectionContent,
        slides: previewData.slides || baseSection.slides,
        keyPoints: previewData.keyPoints || baseSection.keyPoints,
        contentBlocks: previewData.contentBlocks || baseSection.contentBlocks,
        charts: previewData.charts || baseSection.charts,
        insights: previewData.insights || baseSection.insights,
        citations: previewData.citations || baseSection.citations,
        layoutPreview: baseSection.layoutPreview
      };
    }
    return baseSection;
  }, [baseSection]);
  
  useEffect(() => {
    if (!baseSection?.id) {
      setAiSuggestionState({ status: 'idle', message: '', recommendation: null });
      return;
    }

    const preview = baseSection?.layoutPreview;
    if (preview?.agentId === MARKET_SIZING_DESIGN_AGENT_ID && preview?.data) {
      const layoutId = normalizeLayoutId(preview.layout || preview.data?.layout);
      const layoutName = preview.layoutName || getLayoutNameForId(layoutId);
      setAiSuggestionState(prev => {
        if (prev.status === 'loading') {
          return prev;
        }
        return {
          status: 'success',
          message: layoutName ? `Recommended layout: ${layoutName}` : (preview.reason || 'Using saved Cigno AI styling preview.'),
          recommendation: {
            layout: layoutId || preview.layout || null,
            layoutLabel: layoutName || preview.layout,
            reason: preview.reason || null,
            agentId: preview.agentId,
            rawLayoutId: preview.layout || null,
            designGuidelines: Array.isArray(preview.designGuidelines) ? preview.designGuidelines : null,
            cached: true
          }
        };
      });
    } else {
      setAiSuggestionState({ status: 'idle', message: '', recommendation: null });
    }
  }, [baseSection?.id, baseSection?.layoutPreview]);
  
  // Debug logging
  console.log('🔧 DeliverableLayoutView - storyline:', storyline);
  console.log('🔧 DeliverableLayoutView - sections count:', storyline?.sections?.length || 0);
  console.log('🔧 DeliverableLayoutView - sections:', storyline?.sections);

  const chartsForSection = useMemo(() => {
    if (!currentSection) return [];

    const selectBestChartConfig = (chart) => {
      if (!chart) return null;
      if (chart.config) return chart.config;
      if (chart.chartConfig) return chart.chartConfig;

      if (chart.configJson) {
        try {
          return typeof chart.configJson === 'string' ? JSON.parse(chart.configJson) : chart.configJson;
        } catch (error) {
          console.warn('⚠️ Failed to parse chart.configJson:', error);
        }
      }

      if (chart.config_json) {
        try {
          return typeof chart.config_json === 'string' ? JSON.parse(chart.config_json) : chart.config_json;
        } catch (error) {
          console.warn('⚠️ Failed to parse chart.config_json:', error);
        }
      }

      return null;
    };

    const normalizeChart = (chart, index, sourceLabel) => {
      if (!chart) return null;

      const config = selectBestChartConfig(chart);
      if (!config) {
        console.warn('⚠️ Skipping chart without usable config', { chart, sourceLabel });
        return null;
      }

      const fallbackId =
        chart.id ||
        chart.chartId ||
        `${currentSection.id || currentSection.title || 'chart'}-${sourceLabel || 'src'}-${index}`;

      return {
        ...chart,
        id: fallbackId,
        title: chart.title || chart.name || chart.heading || `Chart ${index + 1}`,
        description: chart.description || chart.subtitle || '',
        config
      };
    };

    const candidateSources = [
      { charts: currentSection.sectionContent?.charts, label: 'sectionContent.charts' },
      { charts: currentSection.charts, label: 'currentSection.charts' },
      { charts: currentSection.chartData?.charts, label: 'chartData.charts' },
      { charts: currentSection.sectionContent?.chartData?.charts, label: 'sectionContent.chartData.charts' }
    ];

    for (const { charts, label } of candidateSources) {
      if (Array.isArray(charts) && charts.length > 0) {
        const normalized = charts.map((chart, index) => normalizeChart(chart, index, label)).filter(Boolean);
        if (normalized.length > 0) {
          return normalized;
        }
      }
    }

    return [];
  }, [currentSection]);

  const citationsForSection = Array.isArray(currentSection?.citations) && currentSection.citations.length > 0
    ? currentSection.citations
    : Array.isArray(currentSection?.sectionContent?.citations)
      ? currentSection.sectionContent.citations
      : [];

  const insightsForSection = Array.isArray(currentSection?.insights) && currentSection.insights.length > 0
    ? currentSection.insights
    : Array.isArray(currentSection?.sectionContent?.insights)
      ? currentSection.sectionContent.insights
      : [];

  const sectionDisplayTitle = currentSection?.sectionContent?.title
    || currentSection?.slideContent?.title
    || currentSection?.title
    || `Section ${currentSectionIndex + 1}`;

  const cleanText = (value = '') => value.replace(/^[-*#>\s]+/, '').trim();

  const supportedLayouts = useMemo(() => {
    return getSupportedLayoutsForSection(currentSection);
  }, [currentSection]);

  const isMarketSizingSection = useMemo(() => {
    if (!baseSection) return false;
    const framework = (baseSection.framework || '').toLowerCase();
    if (framework.includes('market_sizing')) return true;
    const title = (baseSection.title || baseSection.sectionContent?.title || '').toLowerCase();
    return title.includes('market sizing');
  }, [baseSection]);

  useEffect(() => {
    if (typeof onSupportedLayoutsChange === 'function') {
      onSupportedLayoutsChange(supportedLayouts);
    }
  }, [supportedLayouts, onSupportedLayoutsChange]);

  // Helper function to render framework content with full data from sectionContent
  const renderFrameworkSection = () => {
    console.log('🔍 renderFrameworkSection called with currentSection:', currentSection);
    console.log('🔍 currentSection.framework:', currentSection?.framework);
    console.log('🔍 currentSection.slideContent:', currentSection?.slideContent);
    console.log('🔍 currentSection.sectionContent:', currentSection?.sectionContent);
    
    if (!currentSection?.framework) {
      console.log('❌ No framework found for currentSection');
      return null;
    }

    // Prioritize sectionContent over direct slideContent for full data in layout view
    const slideContent = currentSection?.sectionContent?.slideContent && Object.keys(currentSection.sectionContent.slideContent || {}).length > 0
      ? currentSection.sectionContent.slideContent
      : currentSection?.slideContent && Object.keys(currentSection.slideContent || {}).length > 0
        ? currentSection.slideContent
        : null;

    const displayCitations = citationsForSection;

    const displayKeyPoints = Array.isArray(currentSection?.keyPoints) && currentSection.keyPoints.length > 0
      ? currentSection.keyPoints
      : insightsForSection;

    if (!slideContent) {
      console.log('❌ No slide content found for currentSection');
      return null;
    }

    // Use the same framework renderer as storyline view but with full data
    const rendered = renderFrameworkContent(
      currentSection.framework, 
      slideContent, 
      displayKeyPoints, 
      displayCitations
    );
    
    console.log('🔍 renderFrameworkContent result:', rendered);

    return (
      <div className="framework-content">
        <div 
          className="prose prose-sm prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
      </div>
    );
  };

  // Helper function to render charts with full data in layout view
  const renderCharts = () => {
    if (!currentSection?.framework) {
      return null;
    }

    const charts = chartsForSection;

    if (!currentSection?.framework || charts.length === 0) {
      console.log('❌ No charts found for currentSection');
      return null;
    }

    // For market_sizing, display charts in a 2x3 grid like the example
    if (currentSection.framework === 'market_sizing' && charts.length > 1) {
      return (
        <div className="mt-3 space-y-3">
          <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
            Market Size Analysis
          </p>
          <div className="grid grid-cols-2 gap-4">
            {charts.map((chart) => {
              if (!chart || !chart.id) return null;
              return (
                <div key={chart.id} className="bg-white rounded-lg border p-3">
                  <h4 className="text-sm font-medium text-gray-800 mb-2 text-center">
                    {chart.title}
                  </h4>
                  <div>
                    <ChartPreview chart={chart} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    
    // Default grid layout for other frameworks
    return (
      <div className="mt-3 space-y-3">
        <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
          Charts
        </p>
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
    );
  };

  const renderMarketSizingPreview = () => {
    const marketSegments = currentSection?.sectionContent?.marketSegments;
    const totalMarket = currentSection?.sectionContent?.totalMarket;
    const guidelines = currentSection?.layoutPreview?.designGuidelines;

    if (!Array.isArray(marketSegments) || marketSegments.length === 0) {
      return null;
    }

    const renderTimeSeries = (series = {}) => {
      const entries = Object.entries(series || {});
      if (!entries.length) {
        return null;
      }

      return (
        <table className="w-full text-xs border" style={{ borderColor: 'var(--border-secondary)' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--bg-secondary)' }}>
              {entries.map(([year]) => (
                <th key={year} className="px-2 py-1 text-left" style={{ color: 'var(--text-secondary)' }}>
                  {year}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {entries.map(([year, value]) => (
                <td key={year} className="px-2 py-1" style={{ color: 'var(--text-primary)' }}>
                  {typeof value === 'number' ? `${value.toLocaleString()} bn` : value}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      );
    };

    return (
      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {marketSegments.map((segment, segmentIndex) => {
            const products = Array.isArray(segment.products) ? segment.products : [];

            return (
              <div key={segmentIndex} className="border rounded-lg p-4 space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
                <div>
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {segment.pillar || `Segment ${segmentIndex + 1}`}
                  </h3>
                  {segment.segment_total && (
                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      Total: {segment.segment_total}
                    </p>
                  )}
                </div>

                {products.map((product, productIndex) => (
                  <div key={productIndex} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                        {product.product_name || product.productName || `Product ${productIndex + 1}`}
                      </p>
                      {product.cagr_2019_2030 && (
                        <span className="text-xs font-semibold" style={{ color: 'var(--accent-primary)' }}>
                          CAGR 19-30: {product.cagr_2019_2030}
                        </span>
                      )}
                    </div>

                    {renderTimeSeries(product.market_size_local_bn || product.time_series)}

                    {Array.isArray(product.growth_drivers) && product.growth_drivers.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold mb-1" style={{ color: 'var(--text-secondary)' }}>
                          Growth drivers
                        </p>
                        <ul className="list-disc pl-4 space-y-1">
                          {product.growth_drivers.map((driver, driverIndex) => (
                            <li key={driverIndex} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                              {driver}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          })}

          {totalMarket && (
            <div className="border rounded-lg p-4 space-y-3" style={{ borderColor: 'var(--border-primary)' }}>
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Total Market Evolution
                </h3>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  Switzerland pension market value (CHF bn)
                </p>
              </div>
              {renderTimeSeries(totalMarket)}
            </div>
          )}
        </div>

        {Array.isArray(guidelines) && guidelines.length > 0 && (
          <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border-primary)' }}>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
              Design guidelines from Cigno AI
            </h3>
            <ul className="list-disc pl-4 space-y-1">
              {guidelines.map((guideline, index) => (
                <li key={index} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                  {guideline}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const normalizePoint = (point) => {
    if (!point) return { title: '', content: '' };
    if (typeof point === 'string') {
      const trimmed = cleanText(point);
      return { title: '', content: trimmed };
    }
    if (typeof point === 'object') {
      const title = cleanText(point.title || point.heading || '');
      const content = cleanText(point.content || point.text || point.description || point.summary || title || '');
      return { title, content };
    }
    return { title: '', content: String(point) };
  };

  const sectionSlides = Array.isArray(currentSection?.slides)
    ? currentSection.slides
    : [];

  const previewSlides = sectionSlides.map((slide, index) => normalizeSlideData(slide, index));

  const sectionKeyPoints = Array.isArray(currentSection?.keyPoints) && !sectionSlides.length
    ? currentSection.keyPoints.map(normalizePoint).filter(p => p.content)
    : [];

  const sectionContentBlocks = Array.isArray(currentSection?.contentBlocks) && !sectionSlides.length
    ? currentSection.contentBlocks
    : [];

  const blockItems = sectionContentBlocks.flatMap(block => Array.isArray(block.items) ? block.items : []);
  const normalizedBlockItems = sectionSlides.length
    ? sectionSlides.flatMap((slide) => {
        const bullets = Array.isArray(slide.bullets) ? slide.bullets : [];
        return bullets.map(normalizePoint);
      }).filter(p => p.content)
    : blockItems.map(normalizePoint).filter(p => p.content);

  const timelineItems = (sectionKeyPoints.length ? sectionKeyPoints : normalizedBlockItems).slice(0, 4);
  const processFlowItems = (sectionKeyPoints.length ? sectionKeyPoints : normalizedBlockItems).slice(0, 4);
  const quadrants = sectionKeyPoints.length >= 4
    ? sectionKeyPoints.slice(0, 4)
    : [...sectionKeyPoints, ...normalizedBlockItems].slice(0, 4);

  const paddedQuadrants = [...quadrants];
  const quadrantLabels = ['High Priority', 'Medium Priority', 'Opportunities', 'Risks'];
  quadrantLabels.forEach((label, idx) => {
    if (!paddedQuadrants[idx]) {
      paddedQuadrants[idx] = { title: label, content: idx === 0 ? (currentSection?.description || 'Add key insight') : 'Add key insight for this quadrant.' };
    }
  });

  const splitKeyPoints = () => {
    if (!sectionKeyPoints.length) {
      return [normalizedBlockItems.slice(0, 3), normalizedBlockItems.slice(3, 6)];
    }
    const midpoint = Math.ceil(sectionKeyPoints.length / 2);
    return [sectionKeyPoints.slice(0, midpoint), sectionKeyPoints.slice(midpoint)];
  };

  const renderCompetitorDeepDiveFullWidth = () => {
    if (!currentSection) return null;
    return (
      <div className="h-full overflow-y-auto space-y-6">
        {renderFrameworkSection()}
        {renderCharts()}
        {citationsForSection.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sources</h4>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              {citationsForSection.map((citation, index) => (
                <li key={index}>• {typeof citation === 'string' ? citation : citation.source || citation}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const [leftColumnPoints, rightColumnPoints] = splitKeyPoints();

  const deriveDescriptionBullets = () => {
    const description = currentSection?.markdown || currentSection?.description || storyline?.executiveSummary || '';
    return description
      .split(/\n|\./)
      .map(line => cleanText(line))
      .filter(Boolean)
      .map(line => ({ title: '', content: line }));
  };

  let columnLeft = [...leftColumnPoints];
  let columnRight = [...rightColumnPoints];

  if (!columnLeft.length && !columnRight.length) {
    const descriptionBullets = deriveDescriptionBullets();
    if (descriptionBullets.length) {
      const midpoint = Math.ceil(descriptionBullets.length / 2);
      columnLeft = descriptionBullets.slice(0, midpoint);
      columnRight = descriptionBullets.slice(midpoint);
    }
  }

  if (!columnLeft.length && normalizedBlockItems.length) {
    columnLeft = normalizedBlockItems.slice(0, 3);
  }

  if (!columnRight.length && normalizedBlockItems.length > columnLeft.length) {
    columnRight = normalizedBlockItems.slice(columnLeft.length, columnLeft.length + 3);
  }

  const getColumnItems = () => {
    const base = sectionKeyPoints.length ? sectionKeyPoints : normalizedBlockItems;
    return base.slice(0, 3); // Only return actual data from backend
  };

  const getTimelineItems = () => {
    return timelineItems.length ? timelineItems.slice(0, 4) : []; // Only return actual data from backend
  };

  const getProcessItems = () => {
    // Return actual data from backend if available
    if (processFlowItems.length) {
      return processFlowItems.slice(0, 4);
    }
    
    // Check for process items in current section
    if (currentSection?.processItems) {
      return currentSection.processItems;
    }
    
    // Create fallback process items for demo/preview purposes
    return [
      { title: 'Planning', content: 'Define objectives and scope' },
      { title: 'Analysis', content: 'Gather and analyze data' },
      { title: 'Solution', content: 'Develop recommendations' },
      { title: 'Implementation', content: 'Execute plan' }
    ];
  };

  const renderBullet = (point, index) => (
    <p key={index}>• {point.content || point.title || ''}</p>
  );

  const renderParagraph = () => {
    if (currentSection?.html) {
      return <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: currentSection.html }} />;
    }
    if (currentSection?.markdown) {
      return <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{currentSection.markdown}</p>;
    }
    if (currentSection?.description) {
      return <p className="leading-relaxed" style={{ color: 'var(--text-primary)' }}>{currentSection.description}</p>;
    }
    // Show loading state if content is being generated
    if (currentSection?.isLoading) {
      return <p className="leading-relaxed text-gray-500 italic">Generating content...</p>;
    }
    // Don't show any placeholder content - only show what comes from backend
    return null;
  };

  const renderSlidesPreview = () => {
    if (!previewSlides.length) {
      return null;
    }

    return (
      <div className="h-full overflow-y-auto pr-2 space-y-4">
        {previewSlides.map((slide, index) => {
          const bullets = Array.isArray(slide.bullets)
            ? slide.bullets.filter(Boolean)
            : [];
          
          // Also check for other text content that might not be in bullets
          const additionalText = slide.description || slide.paragraph || slide.body || '';

          return (
            <div
              key={`${slide.title || 'slide'}-${index}`}
              className="border rounded-lg p-4 bg-white shadow-sm"
              style={{ borderColor: 'var(--border-primary)' }}
            >
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span>Slide {index + 1}</span>
                {slide.layout && <span className="italic">{slide.layout}</span>}
              </div>
              <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
                {slide.title || `Slide ${index + 1}`}
              </h3>
              {slide.subtitle && (
                <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                  {slide.subtitle}
                </p>
              )}
              {slide.summary && (
                <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
                  {slide.summary}
                </p>
              )}
              {slide.content && slide.content !== slide.summary && (
                <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
                  {slide.content}
                </p>
              )}
              {slide.text && slide.text !== slide.summary && slide.text !== slide.content && (
                <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
                  {slide.text}
                </p>
              )}
              {additionalText && additionalText !== slide.summary && additionalText !== slide.content && additionalText !== slide.text && (
                <p className="text-sm mt-3" style={{ color: 'var(--text-primary)' }}>
                  {additionalText}
                </p>
              )}
              {bullets.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {bullets.map((item, bulletIndex) => (
                    <li key={bulletIndex}>• {typeof item === 'string' ? item : item?.content || item?.text || ''}</li>
                  ))}
                </ul>
              )}
              {slide.notes && (
                <p className="text-xs mt-4 italic" style={{ color: 'var(--text-secondary)' }}>
                  {slide.notes}
                </p>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderPreviewContent = () => {
    console.log('🔍 renderPreviewContent called');
    console.log('🔍 sectionSlides.length:', sectionSlides.length);
    console.log('🔍 currentSection:', currentSection);
    console.log('🔍 currentSection?.framework:', currentSection?.framework);
    
    if (sectionSlides.length) {
      console.log('🔍 Rendering slides preview');
      return renderSlidesPreview();
    }

    // For framework sections, render content in the selected layout template
    if (currentSection?.framework) {
      console.log('🔍 Rendering framework content for:', currentSection.framework, 'with layout:', selectedLayout);
      return renderFrameworkWithLayout();
    }
    
    console.log('🔍 No framework found, falling back to layout switch');
    
    // Fallback: Render based on selected layout even without framework
    console.log('🔍 No framework found, rendering with selected layout:', selectedLayout);
    
    return renderLayoutBasedContent();
  };

  // Render framework content using the selected layout template
  const renderFrameworkWithLayout = () => {
    const frameworkContent = renderFrameworkSection();
    const frameworkCharts = renderCharts();
    
    // Get framework content as components
    const contentComponent = frameworkContent;
    const chartsComponent = frameworkCharts;
    const insightsComponent = insightsForSection.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Key Insights</h4>
        <ul className="space-y-1">
          {insightsForSection.map((insight, index) => (
            <li key={index} className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              • {insight}
            </li>
          ))}
        </ul>
      </div>
    );
    const citationsComponent = citationsForSection.length > 0 && (
      <div className="space-y-2">
        <h4 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sources</h4>
        <ul className="space-y-1">
          {citationsForSection.map((citation, index) => (
            <li key={index} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
              • {typeof citation === 'string' ? citation : citation.source || citation}
            </li>
          ))}
        </ul>
      </div>
    );

    // Apply the selected layout template to framework content
    return renderLayoutBasedContent(contentComponent, chartsComponent, insightsComponent, citationsComponent);
  };

  // Get current layout configuration
  const getCurrentLayoutConfig = () => {
    return LAYOUT_OPTIONS.find(layout => layout.id === selectedLayout) || LAYOUT_OPTIONS[0];
  };

  // Render content based on selected layout using dynamic column system
  const renderLayoutBasedContent = (frameworkContent = null, frameworkCharts = null, frameworkInsights = null, frameworkCitations = null) => {
    const layoutConfig = getCurrentLayoutConfig();
    
    // Render layout header
    const renderHeader = () => {
      return (
        <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {sectionDisplayTitle || 'Section Title'}
          </h1>
        </div>
      );
    };

    // Organize content by type for column distribution
    const organizeContent = () => {
      const contentItems = [];
      
      // Add framework content if available
      if (frameworkContent) {
        contentItems.push({ type: 'framework', content: frameworkContent, priority: 1 });
      }
      
      if (frameworkCharts) {
        contentItems.push({ type: 'charts', content: frameworkCharts, priority: 2 });
      }
      
      if (frameworkInsights) {
        contentItems.push({ type: 'insights', content: frameworkInsights, priority: 3 });
      }
      
      if (frameworkCitations) {
        contentItems.push({ type: 'citations', content: frameworkCitations, priority: 4 });
      }

      if (currentSection?.framework === 'market_sizing') {
        const marketSizingPreview = renderMarketSizingPreview();
        if (marketSizingPreview) {
          contentItems.push({
            type: 'market_sizing_preview',
            content: marketSizingPreview,
            priority: 1.5
          });
        }
      }
      
      // Add fallback content if no framework content
      if (!frameworkContent) {
        if (sectionKeyPoints.length > 0) {
          contentItems.push({ 
            type: 'keypoints', 
            content: (
              <div className="space-y-3">
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Key Points</h3>
                <ul className="space-y-2">
                  {sectionKeyPoints.map((point, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
                      <span style={{ color: 'var(--text-primary)' }}>{point.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ), 
            priority: 1 
          });
        }
        
        if (renderParagraph()) {
          contentItems.push({ 
            type: 'text', 
            content: renderParagraph(), 
            priority: 1 
          });
        }
      }
      
      return contentItems.sort((a, b) => a.priority - b.priority);
    };

    // Render dynamic column layout
    const renderDynamicLayout = () => {
      const contentItems = organizeContent();
      
      if (layoutConfig.type === 'default') {
        return renderDefaultLayout(contentItems);
      }
      
      if (layoutConfig.type === 'timeline') {
        return renderTimelineLayout(contentItems);
      }
      
      if (layoutConfig.type === 'flow') {
        return renderFlowLayout(contentItems);
      }
      
      if (layoutConfig.type === 'grid') {
        return renderGridLayout(contentItems, layoutConfig);
      }
      
      // Default: column-based layout
      return renderColumnLayout(contentItems, layoutConfig);
    };

    return (
      <div className="h-full">
        {renderHeader()}
        <div className="h-4/5 overflow-y-auto">
          {renderDynamicLayout()}
        </div>
      </div>
    );
  };

  // Render default layout - automatically picks the best layout for the section
  const renderDefaultLayout = (contentItems) => {
    // Get the recommended layout for the current section
    const recommendedLayoutId = getRecommendedLayoutForSection(currentSection);
    const recommendedLayoutConfig = LAYOUT_OPTIONS.find(layout => layout.id === recommendedLayoutId);
    
    if (!recommendedLayoutConfig || recommendedLayoutConfig.id === 'default') {
      // Fallback to full-width if we can't find a specific recommendation
      const fullWidthConfig = LAYOUT_OPTIONS.find(layout => layout.id === 'full-width');
      return renderColumnLayout(contentItems, fullWidthConfig);
    }
    
    // Render using the recommended layout's logic
    console.log(`🎯 Default layout using recommended: ${recommendedLayoutId} for framework: ${currentSection?.framework}`);
    
    if (recommendedLayoutConfig.type === 'timeline') {
      return renderTimelineLayout(contentItems);
    }
    
    if (recommendedLayoutConfig.type === 'flow') {
      return renderFlowLayout(contentItems);
    }
    
    if (recommendedLayoutConfig.type === 'grid') {
      return renderGridLayout(contentItems, recommendedLayoutConfig);
    }
    
    // Default to column-based layout
    return renderColumnLayout(contentItems, recommendedLayoutConfig);
  };

  // Render column-based layout
  const renderColumnLayout = (contentItems, layoutConfig) => {
    const { columns, columnConfig } = layoutConfig;
    const gridClass = `grid grid-cols-${columns} gap-8`;
    
    return (
      <div className={gridClass}>
        {columnConfig.map((colConfig, index) => {
          const columnContent = distributeContentToColumn(contentItems, index, columnConfig.length, colConfig);
          
          return (
            <div key={index} className="space-y-4">
              {colConfig.title && (
                <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {colConfig.title}
                </h3>
              )}
              <div className="space-y-4">
                {columnContent}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render grid layout (for BCG matrix)
  const renderGridLayout = (contentItems, layoutConfig) => {
    const { columns, rows, columnConfig } = layoutConfig;
    const gridClass = `grid grid-cols-${columns} gap-4`;
    
    return (
      <div className={gridClass}>
        {columnConfig.map((quadrantConfig, index) => {
          const colors = [
            { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700' },
            { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800', text: 'text-yellow-700' },
            { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' },
            { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700' }
          ];
          const color = colors[index % 4];
          
          const quadrantContent = distributeContentToColumn(contentItems, index, columnConfig.length, quadrantConfig);
          
          return (
            <div key={index} className={`border ${color.border} rounded p-4 ${color.bg}`}>
              <h3 className={`font-semibold ${color.title}`}>
                {quadrantConfig.title}
              </h3>
              <div className={`text-sm ${color.text} mt-2`}>
                {quadrantContent || <span>Add content for this quadrant</span>}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render timeline layout
  const renderTimelineLayout = (contentItems) => {
    const timelineItems = getTimelineItems();
    
    if (timelineItems.length === 0) {
      return (
        <div className="space-y-6">
          {contentItems.map((item, index) => (
            <div key={index}>{item.content}</div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex items-center">
        <div className="w-full">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
            {timelineItems.map((item, index) => (
              <div key={index} className="relative bg-white px-2">
                <div className="w-4 h-4 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                <div className="text-center min-w-0">
                  <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                    {item.title || `Milestone ${index + 1}`}
                  </h4>
                  <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render flow layout
  const renderFlowLayout = (contentItems) => {
    const processItems = getProcessItems();
    
    if (processItems.length === 0) {
      return (
        <div className="space-y-6">
          {contentItems.map((item, index) => (
            <div key={index}>{item.content}</div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {processItems.map((item, index) => (
            <React.Fragment key={index}>
              <div className="text-center">
                <div className="w-24 h-16 rounded flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {item.title || `Step ${index + 1}`}
                  </span>
                </div>
                <p className="text-xs max-w-24" style={{ color: 'var(--text-secondary)' }}>
                  {item.content || `Step ${index + 1} description.`}
                </p>
              </div>
              {index < processItems.length - 1 && (
                <div className="flex items-center">
                  <div className="w-8 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                  <div className="w-2 h-2 border-t-2 border-r-2 transform rotate-45 -ml-1" style={{ borderColor: 'var(--border-secondary)' }}></div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Distribute content to columns intelligently
  const distributeContentToColumn = (contentItems, columnIndex, totalColumns, columnConfig) => {
    if (totalColumns === 1) {
      // Single column: show all content
      return contentItems.map((item, index) => (
        <div key={index}>{item.content}</div>
      ));
    }
    
    if (totalColumns === 2) {
      // Two columns: content vs analysis
      if (columnIndex === 0) {
        // Left column: framework content, text, keypoints
        return contentItems
          .filter(item => ['framework', 'text', 'keypoints'].includes(item.type))
          .map((item, index) => <div key={index}>{item.content}</div>);
      } else {
        // Right column: charts, insights, citations
        return contentItems
          .filter(item => ['charts', 'insights', 'citations'].includes(item.type))
          .map((item, index) => <div key={index}>{item.content}</div>);
      }
    }
    
    if (totalColumns === 3) {
      // Three columns: distribute evenly
      const itemsPerColumn = Math.ceil(contentItems.length / 3);
      const startIndex = columnIndex * itemsPerColumn;
      const endIndex = startIndex + itemsPerColumn;
      
      return contentItems
        .slice(startIndex, endIndex)
        .map((item, index) => <div key={index}>{item.content}</div>);
    }
    
    // Fallback: show content for this column index
    if (contentItems[columnIndex]) {
      return <div>{contentItems[columnIndex].content}</div>;
    }
    
    return null;
  };

  // Helper functions for special layout types already defined above

  // Legacy switch statement fallback (can be removed once tested)
  const renderLayoutBasedContentLegacy = (frameworkContent = null, frameworkCharts = null, frameworkInsights = null, frameworkCitations = null) => {
    switch (selectedLayout) {
      case 'title-2-columns': {
        const leftHeading = cleanText(
          sectionContentBlocks[0]?.title || sectionContentBlocks[0]?.type || ''
        ) || (columnLeft[0]?.title || '').trim();
        const rightHeading = cleanText(
          sectionContentBlocks[1]?.title || sectionContentBlocks[1]?.type || ''
        ) || (columnRight[0]?.title || '').trim();
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {sectionDisplayTitle || 'Section Title'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Section {currentSectionIndex + 1} of {storyline?.sections?.length || 1}
              </p>
            </div>
            
            {/* Use framework content if available, otherwise use fallback data */}
            {frameworkContent ? (
              <div className="grid grid-cols-2 gap-8 h-4/5">
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Content
                  </h3>
                  <div className="space-y-4">
                    {frameworkContent}
                    {frameworkInsights}
                  </div>
                </div>
                <div className="space-y-4">
                  <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Analysis
                  </h3>
                  <div className="space-y-4">
                    {frameworkCharts}
                    {frameworkCitations}
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-8 h-4/5">
                <div className="space-y-4">
                  {leftHeading && (
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {leftHeading}
                    </h3>
                  )}
                  {columnLeft.length ? (
                    <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {columnLeft.map(renderBullet)}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No key messages yet.</p>
                  )}
                </div>
                <div className="space-y-4">
                  {rightHeading && (
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {rightHeading}
                    </h3>
                  )}
                  {columnRight.length ? (
                    <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {columnRight.map(renderBullet)}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 italic">No supporting points yet.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'bcg-matrix': {
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentSection?.title || storyline?.title || 'Strategic Analysis Matrix'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Position insights across priority quadrants.
              </p>
            </div>
            {/* Render framework content if available, otherwise fall back to layout */}
            {currentSection?.framework ? (
              <div className="h-4/5 overflow-y-auto">
                {/* Render the complete framework content (same as storyline view) */}
                {renderFrameworkSection()}
                
                {/* Render charts for framework sections */}
                {renderCharts()}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 h-4/5">
                {paddedQuadrants.map((point, index) => {
                  const colors = [
                    { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700' },
                    { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800', text: 'text-yellow-700' },
                    { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' },
                    { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700' }
                  ];
                  const color = colors[index % 4];
                  return (
                    <div key={index} className={`border ${color.border} rounded p-4 ${color.bg}`}>
                      <h3 className={`font-semibold ${color.title}`}>
                        {point.title || `Quadrant ${index + 1}`}
                      </h3>
                      <p className={`text-sm ${color.text} mt-2`}>
                        {point.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case 'three-columns': {
        const columnItems = getColumnItems();
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentSection?.title || storyline?.title || 'Section Overview'}
              </h1>
            </div>
            {/* Render framework content if available, otherwise fall back to layout */}
            {currentSection?.framework ? (
              <div className="h-4/5 overflow-y-auto">
                {/* Render the complete framework content (same as storyline view) */}
                {renderFrameworkSection()}
                
                {/* Render charts for framework sections */}
                {renderCharts()}
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-6 h-4/5">
                {columnItems.map((point, index) => (
                  <div key={index} className="text-center">
                    <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>
                      {index + 1}
                    </div>
                    <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                      {point.title || `Point ${index + 1}`}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {point.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'full-width': {
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {sectionDisplayTitle || 'Section Title'}
              </h1>
            </div>
            
            {/* Use framework content if available, otherwise use fallback data */}
            {frameworkContent ? (
              <div className="space-y-6 h-4/5 overflow-y-auto">
                {frameworkContent}
                {frameworkCharts}
                {frameworkInsights}
                {frameworkCitations}
              </div>
            ) : currentSection?.framework === 'competitor_deep_dive' ? (
              <div className="h-4/5 overflow-y-auto">
                {renderCompetitorDeepDiveFullWidth()}
              </div>
            ) : (
              <div className="space-y-6 h-4/5 overflow-y-auto">
                {renderParagraph()}
                {/* Only show key points if they come from backend */}
                {sectionKeyPoints.length > 0 && !currentSection?.isLoading && (
                  <div className="space-y-3">
                    <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Key Points</h3>
                    <ul className="space-y-2">
                      {sectionKeyPoints.map((point, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 rounded-full mt-2 mr-3 flex-shrink-0" style={{ backgroundColor: 'var(--text-secondary)' }}></span>
                          <span style={{ color: 'var(--text-primary)' }}>{point.content}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'timeline': {
        const items = getTimelineItems();
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentSection?.title || storyline?.title || 'Timeline'}
              </h1>
            </div>
            {/* Render framework content if available, otherwise fall back to layout */}
            {currentSection?.framework ? (
              <div className="h-4/5 overflow-y-auto">
                {/* Render the complete framework content (same as storyline view) */}
                {renderFrameworkSection()}
                
                {/* Render charts for framework sections */}
                {renderCharts()}
              </div>
            ) : (
              <div className="h-4/5 flex items-center">
                <div className="w-full">
                  <div className="flex items-center justify-between relative">
                    <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                    {items.map((item, index) => (
                      <div key={index} className="relative bg-white px-2">
                        <div className="w-4 h-4 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                        <div className="text-center min-w-0">
                          <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                            {item.title || `Milestone ${index + 1}`}
                          </h4>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {item.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      }

      case 'process-flow': {
        const items = getProcessItems();
        return (
          <div className="h-full">
            <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
              <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {currentSection?.title || storyline?.title || 'Process Flow'}
              </h1>
            </div>
            {/* Render framework content if available, otherwise fall back to layout */}
            {currentSection?.framework ? (
              <div className="h-4/5 overflow-y-auto">
                {/* Render the complete framework content (same as storyline view) */}
                {renderFrameworkSection()}
                
                {/* Render charts for framework sections */}
                {renderCharts()}
              </div>
            ) : (
              <div className="h-4/5 flex items-center justify-center">
                <div className="flex items-center space-x-4">
                  {items.map((item, index) => (
                    <React.Fragment key={index}>
                      <div className="text-center">
                        <div className="w-24 h-16 rounded flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                          <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            {item.title || `Step ${index + 1}`}
                          </span>
                        </div>
                        <p className="text-xs max-w-24" style={{ color: 'var(--text-secondary)' }}>
                          {item.content || `Outline step ${index + 1}.`}
                        </p>
                      </div>
                      {index < items.length - 1 && (
                        <div className="flex items-center">
                          <div className="w-8 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                          <div className="w-2 h-2 border-t-2 border-r-2 transform rotate-45 -ml-1" style={{ borderColor: 'var(--border-secondary)' }}></div>
                        </div>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      }

      default:
        return (
          <div className="h-full flex flex-col justify-center items-center text-gray-500">
            <p>Select a layout to preview this section.</p>
          </div>
        );
    }
  };

  const normalizedBriefQuality = normalizeScoreValue(briefQuality);
  const canGenerateStoryline = normalizedBriefQuality !== null && normalizedBriefQuality >= 7.5;

  if (!hasStoryline) {
    const disabled = isGeneratingStoryline || !canGenerateStoryline;
    return (
      <div className="p-12 text-center text-gray-500">
        <p className="text-lg font-medium mb-3">Layout unavailable</p>
        <p className="text-sm">Generate a storyline first to unlock the layout view.</p>
        <button
          onClick={onGenerateStoryline}
          disabled={disabled}
          className={`mt-4 px-4 py-2 rounded-sm text-sm font-medium ${
            disabled
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gray-900 text-white hover:bg-gray-800'
          }`}
        >
          {isGeneratingStoryline ? 'Generating...' : 'Generate Storyline'}
        </button>
        {!canGenerateStoryline && (
          <p className="text-xs text-red-600 mt-3">
            {normalizedBriefQuality === null 
              ? 'Test brief first to get a quality score before generating storyline.'
              : 'Brief quality score must be 7.5 or higher to generate storyline.'
            }
          </p>
        )}
      </div>
    );
  }

  const handleApplyLayout = (layoutId) => {
    console.log(`Applying layout ${layoutId} to all slides`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot apply layout to all: storyline or onStorylineChange not available');
      return;
    }
    
    // Apply the layout to all sections
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => ({
        ...section,
        layout: layoutId,
        layoutAppliedAt: new Date().toISOString()
      })) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Applied layout ${layoutId} to all ${storyline.sections?.length || 0} sections`);
    
    if (onApplyLayout) {
      onApplyLayout(layoutId);
    }
    
    if (onApplyLayoutToAll) {
      onApplyLayoutToAll(layoutId);
    }
  };

  const handleApplyLayoutToSection = (sectionId) => {
    console.log(`Applying layout ${selectedLayout} to section: ${sectionId}`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot apply layout: storyline or onStorylineChange not available');
      return;
    }
    
    const normalizedSelectedLayout = normalizeLayoutId(selectedLayout) || selectedLayout;

    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          const layoutPreview = section.layoutPreview;
          const previewLayout = normalizeLayoutId(layoutPreview?.layout || layoutPreview?.data?.layout);
          const shouldApplyPreview =
            layoutPreview?.agentId === MARKET_SIZING_DESIGN_AGENT_ID &&
            layoutPreview?.data &&
            previewLayout &&
            previewLayout === normalizedSelectedLayout;

          if (shouldApplyPreview) {
            const mergedSection = normalizeAgentSectionForPreview(layoutPreview.data, section);
            const appliedAt = new Date().toISOString();
            return {
              ...mergedSection,
              layout: normalizedSelectedLayout,
              layoutAppliedAt: appliedAt,
              layoutPreview: {
                ...layoutPreview,
                appliedAt,
                lastAppliedAt: appliedAt,
                lastAppliedLayout: normalizedSelectedLayout
              },
              designAgentMetadata: {
                ...(section.designAgentMetadata || {}),
                marketSizing: {
                  agentId: MARKET_SIZING_DESIGN_AGENT_ID,
                  appliedAt,
                  layout: normalizedSelectedLayout,
                  reason: layoutPreview.reason || null,
                  appliedFromCache: true
                }
              }
            };
          }

          return {
            ...section,
            layout: normalizedSelectedLayout,
            layoutAppliedAt: new Date().toISOString()
          };
        }
        return section;
      }) || []
    };

    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Applied layout ${normalizedSelectedLayout} to section: ${sectionId}`);

    if ((baseSection?.id === sectionId || baseSection?.title === sectionId) && baseSection?.layoutPreview) {
      const layoutName = baseSection.layoutPreview.layoutName || getLayoutNameForId(normalizedSelectedLayout);
      setAiSuggestionState(prev => ({
        status: 'success',
        message: layoutName ? `Applied layout: ${layoutName}` : 'Applied Cigno AI suggested layout.',
        recommendation: prev.recommendation
          ? {
              ...prev.recommendation,
              layout: normalizedSelectedLayout,
              cached: true
            }
          : prev.recommendation
      }));
    }
  };

  const handleResetSectionLayout = (sectionId) => {
    console.log(`Resetting layout for section: ${sectionId}`);
    
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot reset layout: storyline or onStorylineChange not available');
      return;
    }
    
    // Find the section to get its framework and determine recommended layout
    const section = storyline.sections?.find(s => s.id === sectionId || s.title === sectionId);
    const recommendedLayout = getRecommendedLayoutForSection(section);
    
    // Update the storyline to set recommended layout for this specific section
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          return {
            ...section,
            layout: recommendedLayout,
            layoutResetAt: new Date().toISOString(),
            layoutAppliedAt: new Date().toISOString()
          };
        }
        return section;
      }) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Reset layout for section: ${sectionId} to recommended: ${recommendedLayout}`);
  };

  // Helper function to get recommended layout for a section
  const getRecommendedLayoutForSection = (section) => {
    if (!section?.framework) {
      return 'full-width'; // Default for sections without framework
    }
    
    // Get supported layouts for this framework
    const supportedLayouts = getSupportedLayoutsForSection(section);
    
    // Skip 'default' and return the first actual layout (usually the recommended one)
    const actualLayouts = supportedLayouts.filter(layout => layout !== 'default');
    if (actualLayouts.length > 0) {
      return actualLayouts[0];
    }
    
    // Fallback to full-width if no specific recommendations
    return 'full-width';
  };

  const updateStorylineSection = (sectionId, updater) => {
    if (!storyline || !onStorylineChange) {
      console.warn('Cannot update section: storyline or onStorylineChange not available');
      return;
    }

    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          return updater(section);
        }
        return section;
      }) || []
    };

    onStorylineChange(updatedStoryline);
  };

  const handleMarketSizingDesignSuggestion = useCallback(async () => {
    if (!currentSection || !isMarketSizingSection) {
      setAiSuggestionState({
        status: 'error',
        message: 'AI layout suggestions are only available for Market Sizing sections.',
        recommendation: null
      });
      return;
    }

    const baseSectionId = baseSection?.id || baseSection?.title;
    const existingPreview = baseSection?.layoutPreview;

    if (existingPreview?.agentId === MARKET_SIZING_DESIGN_AGENT_ID && existingPreview?.data) {
      const layoutId = normalizeLayoutId(existingPreview.layout || existingPreview.data?.layout);
      const layoutName = existingPreview.layoutName || getLayoutNameForId(layoutId);
      setAiSuggestionState({
        status: 'success',
        message: layoutName ? `Recommended layout: ${layoutName}` : (existingPreview.reason || 'Using saved Cigno AI styling preview.'),
        recommendation: {
          layout: layoutId || existingPreview.layout || null,
          layoutLabel: layoutName || existingPreview.layout,
          reason: existingPreview.reason || null,
          agentId: existingPreview.agentId,
          rawLayoutId: existingPreview.layout || null,
          designGuidelines: Array.isArray(existingPreview.designGuidelines) ? existingPreview.designGuidelines : null,
          cached: true
        }
      });
      return;
    }

    if (!baseSectionId) {
      setAiSuggestionState({
        status: 'error',
        message: 'Unable to identify this section for AI styling. Try refreshing.',
        recommendation: null
      });
      return;
    }

    const now = new Date().toISOString();

    setAiSuggestionState({
      status: 'loading',
      message: 'Asking Cigno AI to style this market sizing section…',
      recommendation: null
    });

    try {
      const response = await fetch('/api/ai/layout/market-sizing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          section: safeSerialize(currentSection),
          storyline: safeSerialize(storyline),
          project: safeSerialize(storyline?.project || null),
          userId: storyline?.ownerId || storyline?.userId || null
        })
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || result?.details || 'Cigno AI design agent failed to respond.');
      }

      const agentData = result?.data || {};
      const suggestionPayload = extractAgentSuggestionPayload(agentData);

      const suggestedSection = suggestionPayload.section;
      const designGuidelines = suggestionPayload.designGuidelines;

      const layoutRecommendationRaw =
        suggestionPayload.layoutRecommendation ||
        agentData?.recommendedLayout ||
        agentData?.layout ||
        agentData?.suggestion?.layout ||
        (suggestedSection?.layout ? { id: suggestedSection.layout } : null);

      let recommendedLayoutId = null;
      let recommendationReason = null;
      let recommendationName = null;

      if (typeof layoutRecommendationRaw === 'string') {
        recommendedLayoutId = normalizeLayoutId(layoutRecommendationRaw);
      } else if (layoutRecommendationRaw && typeof layoutRecommendationRaw === 'object') {
        recommendedLayoutId = normalizeLayoutId(
          layoutRecommendationRaw.id ||
          layoutRecommendationRaw.layout ||
          layoutRecommendationRaw.key ||
          layoutRecommendationRaw.identifier ||
          layoutRecommendationRaw.name
        );
        recommendationReason =
          layoutRecommendationRaw.reason ||
          layoutRecommendationRaw.rationale ||
          layoutRecommendationRaw.description ||
          null;
        recommendationName = layoutRecommendationRaw.name || null;
      }

      if (!recommendedLayoutId && suggestedSection?.layout) {
        recommendedLayoutId = normalizeLayoutId(suggestedSection.layout);
      }

      if (!recommendedLayoutId) {
        recommendedLayoutId = 'full-width';
        recommendationName = recommendationName || getLayoutNameForId('full-width');
      }

      if (recommendedLayoutId && typeof onLayoutChange === 'function') {
        onLayoutChange(recommendedLayoutId);
      }

      if (suggestedSection && baseSectionId) {
        updateStorylineSection(baseSectionId, (section) => {
          const resolvedLayout =
            normalizeLayoutId(suggestedSection.layout) ||
            recommendedLayoutId ||
            section.layout ||
            section.selectedLayout ||
            'full-width';

          const previewSection = normalizeAgentSectionForPreview(suggestedSection, section);

          if (Array.isArray(suggestedSection.slides)) {
            previewSection.slides = suggestedSection.slides.map((slide, index) =>
              normalizeSlideData(slide, index, resolvedLayout)
            );
          }

          const updatedSection = {
            ...section,
            layoutPreview: {
              appliedAt: now,
              layout: resolvedLayout,
              agentId: MARKET_SIZING_DESIGN_AGENT_ID,
              reason: recommendationReason || layoutRecommendationRaw?.reason || null,
              layoutName: recommendationName || getLayoutNameForId(resolvedLayout),
              designGuidelines: Array.isArray(designGuidelines) ? designGuidelines : null,
              data: {
                ...previewSection,
                layout: resolvedLayout
              },
              raw: suggestionPayload.raw
            },
            designAgentMetadata: {
              ...(section.designAgentMetadata || {}),
              marketSizing: {
                agentId: MARKET_SIZING_DESIGN_AGENT_ID,
                appliedAt: now,
                layout: resolvedLayout,
                reason: recommendationReason || null
              }
            }
          };

          if (!updatedSection.title && previewSection.title) {
            updatedSection.title = previewSection.title;
          }

          return updatedSection;
        });
      }

      if (!baseSectionId) {
        console.warn('⚠️ Market sizing suggestion received but base section is missing identifier');
        setAiSuggestionState({
          status: 'error',
          message: 'Unable to attach AI layout preview to this section. Please try again.',
          recommendation: null
        });
        return;
      }

      const layoutName = recommendationName || (recommendedLayoutId ? getLayoutNameForId(recommendedLayoutId) : null);
      const message = layoutName
        ? `Recommended layout: ${layoutName}`
        : 'Cigno AI styling applied to this section.';

      setAiSuggestionState({
        status: 'success',
        message,
        recommendation: {
          layout: recommendedLayoutId || layoutRecommendationRaw?.id || null,
          layoutLabel: layoutName,
          reason: recommendationReason || null,
          agentId: MARKET_SIZING_DESIGN_AGENT_ID,
          rawLayoutId: layoutRecommendationRaw?.id || null,
          designGuidelines: Array.isArray(designGuidelines) ? designGuidelines : null
        }
      });
    } catch (error) {
      console.error('❌ Failed to retrieve Cigno AI layout suggestion:', error);
      setAiSuggestionState({
        status: 'error',
        message: error.message || 'Unable to fetch design suggestion.',
        recommendation: null
      });
    }
  }, [
    currentSection,
    isMarketSizingSection,
    storyline,
    onLayoutChange,
    updateStorylineSection,
    normalizeSlideData,
    baseSection
  ]);

  useEffect(() => {
    if (typeof onAISuggestionChange !== 'function') {
      return;
    }

    const currentSectionId = baseSection?.id || baseSection?.title || null;

    if (!isMarketSizingSection || !currentSectionId) {
      onAISuggestionChange(null, null);
      return;
    }

    const { status, message, recommendation } = aiSuggestionState;
    const layoutLabel = recommendation?.layoutLabel;
    const suggestionTitle = layoutLabel
      ? `Cigno AI Suggested · ${layoutLabel}`
      : 'Cigno AI Suggested';
    const suggestionDescription = recommendation?.reason
      || (layoutLabel ? `Recommended layout: ${layoutLabel}` : 'Let Cigno AI restyle this Market Sizing section with a dedicated layout.');

    onAISuggestionChange(
      {
        id: 'market-sizing-design-suggestion',
        title: suggestionTitle,
        description: suggestionDescription,
        status,
        statusMessage: message,
        recommendedLayout: recommendation?.layout || null,
        layoutLabel,
        designGuidelines: recommendation?.designGuidelines || null
      },
      handleMarketSizingDesignSuggestion
    );
  }, [
    aiSuggestionState,
    isMarketSizingSection,
    currentSection?.id,
    currentSection?.title,
    onAISuggestionChange,
    baseSection?.id,
    baseSection?.title,
    handleMarketSizingDesignSuggestion
  ]);

  const handleGenerateSlidesForSection = async (sectionId) => {
    if (!storyline) {
      alert('No storyline available to generate slides.');
      return;
    }

    const targetSection = storyline.sections?.find(
      section => section.id === sectionId || section.title === sectionId
    );

    if (!targetSection) {
      alert('Unable to locate section details for slide generation.');
      return;
    }

    setSlideGenerationState(prev => ({
      ...prev,
      [sectionId]: { status: 'loading' }
    }));

    try {
      const response = await fetch('/api/ai/generate-slides', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sectionId,
          section: targetSection,
          storyline: {
            id: storyline._id || storyline.id,
            title: storyline.title,
            description: storyline.description,
            sectionsCount: storyline.sections?.length || 0
          },
          layout: selectedLayout
        })
      });

      const result = await response.json();

      if (!response.ok || result?.error) {
        throw new Error(result?.error || 'Failed to generate slides for this section.');
      }

      const slidesPayload = Array.isArray(result?.data?.slides)
        ? result.data.slides
        : Array.isArray(result?.slides)
          ? result.slides
          : [];

      const normalizedSlides = slidesPayload.map((slide, index) => normalizeSlideData(slide, index));

      if (!normalizedSlides.length) {
        throw new Error('Slide generation completed without returning any slide content.');
      }

      const generatedAt = new Date().toISOString();

      updateStorylineSection(sectionId, section => ({
        ...section,
        slides: normalizedSlides,
        slidesGeneratedAt: generatedAt,
        slidesGenerationContext: {
          source: result?.source || 'custom-agent',
          agentId: result?.agentId,
          generatedAt,
          ...result?.metadata
        }
      }));

      setSlideGenerationState(prev => ({
        ...prev,
        [sectionId]: {
          status: 'success',
          count: normalizedSlides.length,
          timestamp: generatedAt
        }
      }));

      if (!previewSection) {
        setPreviewSection(sectionId);
      }
    } catch (error) {
      console.error('❌ Slide generation failed:', error);
      setSlideGenerationState(prev => ({
        ...prev,
        [sectionId]: {
          status: 'error',
          message: error.message || 'Failed to generate slides.'
        }
      }));
      alert(error.message || 'Failed to generate slides for this section.');
    }
  };

  const toggleSectionCollapse = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  return (
    <div className="h-full flex relative">
      {/* Preview Area */}
      <div className="flex-1 bg-white">
        <div className="p-6 border-b" style={{ borderColor: 'var(--border-primary)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Slide Preview</h2>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Preview how your content will look with the selected layout
              </p>
            </div>
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.name}
            </div>
          </div>
        </div>

        <div className="p-8 h-full overflow-y-auto pb-20">
          <div className="max-w-4xl mx-auto">
            {/* Slide Preview */}
            <div className="aspect-[16/9] bg-white rounded-lg shadow-sm p-8" style={{ border: '1px solid var(--border-primary)' }}>
              {renderPreviewContent()}
              {/*
              {selectedLayout === 'title-2-columns' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || ''}
                    </h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      Section {currentSectionIndex + 1} of {storyline?.sections?.length || 1}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-8 h-4/5">
                    <div className="space-y-4">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Key Messages
                      </h3>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {leftColumnPoints.length
                          ? leftColumnPoints.map(renderBullet)
                          : (
                            <>
                              <p>• Add your first key message</p>
                              <p>• Add supporting detail</p>
                            </>
                          )}
                      </div>
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                        Supporting Points
                      </h3>
                      <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {rightColumnPoints.length
                          ? rightColumnPoints.map(renderBullet)
                          : (
                            <>
                              <p>• Add more detail here</p>
                              <p>• Highlight data, quotes, or proof points</p>
                            </>
                          )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {selectedLayout === 'bcg-matrix' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Strategic Analysis Matrix'}
                    </h1>
                  </div>
                  <div className="grid grid-cols-2 gap-4 h-4/5">
                    {currentSection?.keyPoints?.slice(0, 4).map((point, index) => {
                      const colors = [
                        { bg: 'bg-green-50', border: 'border-green-200', title: 'text-green-800', text: 'text-green-700' },
                        { bg: 'bg-yellow-50', border: 'border-yellow-200', title: 'text-yellow-800', text: 'text-yellow-700' },
                        { bg: 'bg-blue-50', border: 'border-blue-200', title: 'text-blue-800', text: 'text-blue-700' },
                        { bg: 'bg-red-50', border: 'border-red-200', title: 'text-red-800', text: 'text-red-700' }
                      ];
                      const color = colors[index % 4];
                      return (
                        <div key={index} className={`border ${color.border} rounded p-4 ${color.bg}`}>
                          <h3 className={`font-semibold ${color.title}`}>
                            {point.title || point.split('.')[0] || `Quadrant ${index + 1}`}
                          </h3>
                          <p className={`text-sm ${color.text} mt-2`}>
                            {point.content || point.split('.').slice(1).join('.') || point}
                          </p>
                        </div>
                      );
                    }) || (
                      <>
                        <div className="border border-green-200 rounded p-4 bg-green-50">
                          <h3 className="font-semibold text-green-800">High Priority</h3>
                          <p className="text-sm text-green-700 mt-2">{currentSection?.description?.substring(0, 60) || 'High priority items'}</p>
                        </div>
                        <div className="border border-yellow-200 rounded p-4 bg-yellow-50">
                          <h3 className="font-semibold text-yellow-800">Medium Priority</h3>
                          <p className="text-sm text-yellow-700 mt-2">Medium priority considerations</p>
                        </div>
                        <div className="border border-blue-200 rounded p-4 bg-blue-50">
                          <h3 className="font-semibold text-blue-800">Opportunities</h3>
                          <p className="text-sm text-blue-700 mt-2">Growth opportunities</p>
                        </div>
                        <div className="border border-red-200 rounded p-4 bg-red-50">
                          <h3 className="font-semibold text-red-800">Risks</h3>
                          <p className="text-sm text-red-700 mt-2">Potential risks and challenges</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
              
              {selectedLayout === 'three-columns' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || ''}
                    </h1>
                  </div>
                  <div className="grid grid-cols-3 gap-6 h-4/5">
                    {currentSection?.keyPoints?.slice(0, 3).map((point, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>
                          {index + 1}
                        </div>
                        <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                          {point.title || point.split('.')[0] || ''}
                        </h3>
                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {point.content || point.split('.').slice(1).join('.') || point}
                        </p>
                      </div>
                    )) || storyline?.sections?.slice(0, 3).map((section, index) => (
                      <div key={index} className="text-center">
                        <div className="w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4">
                          {index + 1}
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {section.title || ''}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {section.description || ''}
                        </p>
                      </div>
                    )) || (
                      <>
                        <div className="text-center">
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>1</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 1</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>First phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>2</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 2</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Second phase description</p>
                        </div>
                        <div className="text-center">
                          <div className="w-12 h-12 text-white rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-4" style={{ backgroundColor: 'var(--text-primary)' }}>3</div>
                          <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Phase 3</h3>
                          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Third phase description</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}

              {selectedLayout === 'timeline' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Timeline'}
                    </h1>
                  </div>
                  <div className="h-4/5 flex items-center">
                    <div className="w-full">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 right-0 h-0.5 -translate-y-1/2" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                        {(currentSection?.keyPoints?.slice(0, 4) || storyline?.sections?.slice(0, 4) || []).map((item, index) => (
                          <div key={index} className="relative bg-white px-2">
                            <div className="w-4 h-4 rounded-full mx-auto mb-3" style={{ backgroundColor: 'var(--text-primary)' }}></div>
                            <div className="text-center min-w-0">
                              <h4 className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
                                {item.title || item.split('.')[0] || `Milestone ${index + 1}`}
                              </h4>
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                {item.content || item.description || `Step ${index + 1}`}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {selectedLayout === 'process-flow' && (
                <div className="h-full">
                  <div className="border-b pb-4 mb-6" style={{ borderColor: 'var(--border-primary)' }}>
                    <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {currentSection?.title || storyline?.title || 'Process Flow'}
                    </h1>
                  </div>
                  <div className="h-4/5 flex items-center justify-center">
                    <div className="flex items-center space-x-4">
                      {(currentSection?.keyPoints?.slice(0, 3) || storyline?.sections?.slice(0, 3) || []).map((item, index, array) => (
                        <React.Fragment key={index}>
                          <div className="text-center">
                            <div className="w-24 h-16 rounded flex items-center justify-center mx-auto mb-2" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
                              <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                {item.title?.substring(0, 10) || `Step ${index + 1}`}
                              </span>
                            </div>
                            <p className="text-xs max-w-24" style={{ color: 'var(--text-secondary)' }}>
                              {item.content?.substring(0, 30) || item.description?.substring(0, 30) || `Process ${index + 1}`}
                            </p>
                          </div>
                          {index < array.length - 1 && (
                            <div className="flex items-center">
                              <div className="w-8 h-0.5" style={{ backgroundColor: 'var(--border-secondary)' }}></div>
                              <div className="w-2 h-2 border-t-2 border-r-2 transform rotate-45 -ml-1" style={{ borderColor: 'var(--border-secondary)' }}></div>
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              */}
            </div>
            
            {/* Apply to Specific Sections - Thinner */}
            {storyline?.sections && (
              <div className="mt-6">
                <h3 className="text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>Apply to Specific Sections</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(storyline?.sections || [
                    { id: '1', title: 'Executive Summary', status: 'draft', slides: 1 },
                    { id: '2', title: 'Market Context & Analysis', status: 'draft', slides: 1 },
                    { id: '3', title: 'Strategic Implications', status: 'draft', slides: 1 },
                    { id: '4', title: 'Technical Architecture', status: 'draft', slides: 1 },
                    { id: '5', title: 'Risk Assessment & Compliance', status: 'draft', slides: 1 },
                    { id: '6', title: 'Implementation Roadmap', status: 'draft', slides: 1 }
                  ]).map((section, index) => {
                    const sectionId = section.id || section.title || `section-${index}`;
                    const slideState = slideGenerationState[sectionId] || {};
                    const hasSlides = Array.isArray(section.slides) && section.slides.length > 0;
                    const normalizedSectionLayout = normalizeLayoutId(section.layout || selectedLayout || 'full-width');
                    const layoutPreviewMeta = section.layoutPreview?.agentId === MARKET_SIZING_DESIGN_AGENT_ID
                      ? section.layoutPreview
                      : null;
                    const previewLayoutId = layoutPreviewMeta
                      ? normalizeLayoutId(layoutPreviewMeta.layout || layoutPreviewMeta.data?.layout)
                      : null;
                    const layoutBadgeLabel = layoutPreviewMeta
                      ? (layoutPreviewMeta.layoutName || getLayoutNameForId(previewLayoutId) || getLayoutNameForId(normalizedSectionLayout) || normalizedSectionLayout)
                      : (section.layout
                          ? (getLayoutNameForId(normalizedSectionLayout) || normalizedSectionLayout)
                          : null);
                    const layoutBadgeText = layoutBadgeLabel
                      ? (layoutBadgeLabel.split(' ')[0] || layoutBadgeLabel)
                      : null;
                    const layoutBadgeStyles = layoutPreviewMeta
                      ? {
                          backgroundColor: 'rgba(16, 185, 129, 0.15)',
                          color: 'rgb(5, 122, 85)'
                        }
                      : {
                          backgroundColor: 'var(--bg-secondary)',
                          color: 'var(--text-secondary)'
                        };
                    const selectedLayoutName = getLayoutNameForId(selectedLayout) || aiSuggestionState.recommendation?.layoutLabel || selectedLayout;

                    return (
                    <div key={sectionId} className="relative">
                      {/* Section with Collapse Arrow and Index */}
                      <div className="flex items-start gap-1">
                        {/* Collapse Arrow - Consistent with RightSection pattern */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSectionCollapse(sectionId);
                          }}
                          className="flex items-center justify-center w-6 h-6 rounded hover:bg-gray-200 transition-colors mt-0.5"
                          title={collapsedSections.has(section.id || index) ? 'Expand section' : 'Collapse section'}
                          style={{ backgroundColor: 'transparent' }}
                        >
                          {collapsedSections.has(section.id || index) ? (
                            <ChevronUp className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          ) : (
                            <ChevronDown className="h-4 w-4" style={{ color: 'var(--text-secondary)' }} />
                          )}
                        </button>

                        {/* Index Number */}
                        <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium mt-0.5" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                          {index + 1}
                        </div>

                        {/* Section Content */}
                        <div className="flex-1 relative">
                          <div 
                            className={`rounded transition-colors cursor-pointer ${
                              previewSection === sectionId ? 'ring-1' : ''
                            }`}
                            style={{ 
                              border: '1px solid var(--border-primary)',
                              backgroundColor: previewSection === sectionId ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                              ringColor: previewSection === sectionId ? 'var(--text-primary)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.borderColor = 'var(--border-secondary)';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.borderColor = 'var(--border-primary)';
                            }}
                            onClick={() => setPreviewSection(sectionId)}
                          >
                            {/* Section Header */}
                            <div className="p-1.5 pr-8 relative">
                              {/* Action buttons in top right */}
                              <div className="absolute top-1 right-1 flex items-center gap-1">
                                {/* Apply current selected layout to this section */}
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleApplyLayoutToSection(sectionId);
                                  }}
                                  className="w-4 h-4 bg-blue-100 hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors"
                                  title={`Apply "${selectedLayoutName || 'Selected layout'}" to this section`}
                                >
                                  <Check className="w-2.5 h-2.5 text-blue-600" />
                                </button>
                                
                                {/* Reset to recommended layout button */}
                                {section.layout && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleResetSectionLayout(sectionId);
                                    }}
                                    className="w-4 h-4 bg-red-100 hover:bg-red-200 rounded-full flex items-center justify-center transition-colors"
                                    title="Reset to recommended layout for this section type"
                                  >
                                    <X className="w-2.5 h-2.5 text-red-600" />
                                  </button>
                                )}
                              </div>
                              
                              <div className="text-xs font-medium break-words leading-tight pr-12" style={{ color: 'var(--text-primary)' }}>
                                {section.title || `Section ${index + 1}`}
                              </div>
                              {!collapsedSections.has(sectionId) && (
                                <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  <span>{section.status || 'draft'}</span>
                                  {layoutBadgeLabel && (
                                    <span
                                      className="px-1.5 py-0.5 text-[10px] rounded font-medium uppercase tracking-wide"
                                      style={layoutBadgeStyles}
                                      title={layoutPreviewMeta
                                        ? (layoutPreviewMeta.layoutName || 'Cigno AI Suggested Layout')
                                        : layoutBadgeLabel || 'Custom'}
                                    >
                                      {layoutBadgeText || 'Custom'}
                                    </span>
                                  )}
                                  {hasSlides && (
                                    <span className="px-1 py-0.5 text-xs rounded bg-purple-100 text-purple-700">
                                      {section.slides.length} slide{section.slides.length !== 1 ? 's' : ''}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            {/* Expanded Content */}
                            {!collapsedSections.has(sectionId) && (
                              <div className="px-1.5 pb-1.5">
                                {section.description && (
                                  <div className="text-xs mt-1 px-2" style={{ color: 'var(--text-secondary)' }}>
                                    {section.description.length > 80 
                                      ? `${section.description.substring(0, 80)}...` 
                                      : section.description
                                    }
                                  </div>
                                )}
                                {section.keyPoints && section.keyPoints.length > 0 && (
                                  <div className="text-xs mt-1 px-2" style={{ color: 'var(--text-secondary)' }}>
                                    {section.keyPoints.length} key point{section.keyPoints.length !== 1 ? 's' : ''}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          
                        </div>
                      </div>
                    </div>
                  );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      
    </div>
  );
}
