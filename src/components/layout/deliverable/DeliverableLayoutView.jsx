import React, { useState } from 'react';
import { Check, ChevronDown, ChevronUp, Sparkles, Loader2 } from 'lucide-react';
import { normalizeScoreValue } from '../../../utils/scoreUtils';
import { renderFrameworkContent } from '../../../lib/frameworkRenderer';
import dynamic from 'next/dynamic';

const ChartPreview = dynamic(() => import('../../storyline/ChartPreview'), { 
  ssr: false,
  loading: () => <div className="h-52 flex items-center justify-center text-gray-500">Loading chart...</div>
});


const LAYOUT_OPTIONS = [
  {
    id: 'title-2-columns',
    name: 'Title + 2 Columns',
    description: 'Header with two equal content columns',
    recommended: true,
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
    id: 'full-width',
    name: 'Full Width',
    description: 'Single column full width content',
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
    id: 'timeline',
    name: 'Timeline Layout',
    description: 'Horizontal timeline with milestones',
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

export default function DeliverableLayoutView({
  hasStoryline,
  onGenerateStoryline,
  isGeneratingStoryline,
  storyline,
  onApplyLayout,
  selectedLayout = 'title-2-columns',
  onStorylineChange,
  onApplyLayoutToAll,
  briefQuality = null
}) {
  const [previewSection, setPreviewSection] = useState(null);
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [slideGenerationState, setSlideGenerationState] = useState({});

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
  const currentSection = previewSection 
    ? storyline?.sections?.find(s => s.id === previewSection)
    : storyline?.sections?.[0];
  
  const currentSectionIndex = storyline?.sections?.findIndex(s => s.id === currentSection?.id) ?? 0;
  
  // Debug logging
  console.log('🔧 DeliverableLayoutView - storyline:', storyline);
  console.log('🔧 DeliverableLayoutView - sections count:', storyline?.sections?.length || 0);
  console.log('🔧 DeliverableLayoutView - sections:', storyline?.sections);

  const cleanText = (value = '') => value.replace(/^[-*#>\s]+/, '').trim();

  // Helper function to render framework content (same as storyline view)
  const renderFrameworkSection = () => {
    if (!currentSection?.framework) {
      return null;
    }

    // Use the same framework renderer as storyline view
    const rendered = renderFrameworkContent(
      currentSection.framework, 
      currentSection.slideContent, 
      currentSection.keyPoints || [], 
      currentSection.citations || []
    );

    return (
      <div className="framework-content">
        <div 
          className="prose prose-sm prose-slate max-w-none"
          dangerouslySetInnerHTML={{ __html: rendered.html }}
        />
      </div>
    );
  };

  // Helper function to render charts (same as storyline view)
  const renderCharts = () => {
    if (!currentSection?.framework || !currentSection?.charts || currentSection.charts.length === 0) {
      return null;
    }

    // Check if we have real data from AI agent
    const hasRealChartData = currentSection.chartData || (currentSection.charts && currentSection.charts.length > 0 && currentSection.charts[0]?.config?.data);
    
    if (!hasRealChartData) {
      return null;
    }

    // Render charts directly using ChartPreview for framework sections
    const charts = currentSection.charts || [];
    
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
    return processFlowItems.length ? processFlowItems.slice(0, 4) : []; // Only return actual data from backend
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
    if (sectionSlides.length) {
      return renderSlidesPreview();
    }

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
                {currentSection?.title || storyline?.title || 'Section Title'}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Section {currentSectionIndex + 1} of {storyline?.sections?.length || 1}
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
                {currentSection?.title || storyline?.title || ''}
              </h1>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
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
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
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
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
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
    
    // Update the storyline with the layout for this specific section
    const updatedStoryline = {
      ...storyline,
      sections: storyline.sections?.map(section => {
        if (section.id === sectionId || section.title === sectionId) {
          return {
            ...section,
            layout: selectedLayout,
            layoutAppliedAt: new Date().toISOString()
          };
        }
        return section;
      }) || []
    };
    
    // Propagate the change up to parent
    onStorylineChange(updatedStoryline);
    console.log(`✅ Applied layout ${selectedLayout} to section: ${sectionId}`);
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
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
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
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                      {LAYOUT_OPTIONS.find(l => l.id === selectedLayout)?.description}
                    </p>
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
                  ]).slice(0, 6).map((section, index) => {
                    const sectionId = section.id || section.title || `section-${index}`;
                    const slideState = slideGenerationState[sectionId] || {};
                    const hasSlides = Array.isArray(section.slides) && section.slides.length > 0;

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
                            <div className="p-1.5 pr-8">
                              <div className="text-xs font-medium truncate leading-tight" style={{ color: 'var(--text-primary)' }}>
                                {section.title || `Section ${index + 1}`}
                              </div>
                              {!collapsedSections.has(sectionId) && (
                                <div className="text-xs flex items-center gap-1 mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                  <span>{section.status || 'draft'}</span>
                                  {section.layout && (
                                    <span className="px-1 py-0.5 text-xs rounded bg-blue-100 text-blue-700">
                                      {LAYOUT_OPTIONS.find(l => l.id === section.layout)?.name.split(' ')[0] || 'Custom'}
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
