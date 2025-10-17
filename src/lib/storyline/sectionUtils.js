import { parseMarkdownWithCharts, deriveSectionMetadata } from '../markdown/markdownParser.js';

const DEFAULT_CONTENT_BLOCK_TYPE = 'Content Block';

const CONTENT_TYPE_MAP = [
  { pattern: /chart|graph|visual/i, type: 'Data Visualization' },
  { pattern: /diagram|flow/i, type: 'Process Flow' },
  { pattern: /timeline/i, type: 'Timeline Layout' },
  { pattern: /framework|mece/i, type: 'MECE Framework' },
  { pattern: /matrix|bcg/i, type: 'BCG Matrix' },
  { pattern: /analysis|insight/i, type: 'Key Insights' },
  { pattern: /checklist|steps/i, type: 'Process Flow' },
  { pattern: /table/i, type: 'Content Block' }
];

const toPlainObject = (value) => {
  if (!value) return {};
  if (typeof value.toObject === 'function') {
    return value.toObject();
  }
  if (typeof value === 'object') {
    return { ...value };
  }
  return {};
};

const sanitizeStringArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

export const mapContentTypeToBlock = (contentType = DEFAULT_CONTENT_BLOCK_TYPE) => {
  if (!contentType) return DEFAULT_CONTENT_BLOCK_TYPE;
  const normalized = contentType.toString().toLowerCase();
  const match = CONTENT_TYPE_MAP.find(entry => entry.pattern.test(normalized));
  return match ? match.type : DEFAULT_CONTENT_BLOCK_TYPE;
};

const cloneContentBlocks = (blocks) => {
  if (!Array.isArray(blocks) || !blocks.length) return [];
  return blocks.map(block => ({
    type: block?.type || DEFAULT_CONTENT_BLOCK_TYPE,
    items: sanitizeStringArray(block?.items)
  }));
};

const sanitizeCharts = (charts) => {
  if (!Array.isArray(charts)) return [];
  return charts.map((chart, index) => ({
    id: chart?.id || `chart-${index + 1}`,
    title: chart?.title || '',
    caption: chart?.caption || '',
    source: chart?.source || '',
    config: chart?.config || {},
    attributes: chart?.attributes || {},
    raw: chart?.raw || '',
    generated: chart?.generated || false,
    type: chart?.type || 'bar'
  }));
};

const cloneMixedValue = (value, fallback = null) => {
  if (value === null || value === undefined) {
    return fallback;
  }

  if (typeof value === 'object') {
    try {
      return JSON.parse(JSON.stringify(value));
    } catch (error) {
      return fallback;
    }
  }

  return value;
};

const normalizeSlides = (slides, fallbackLayout = 'title-2-columns') => {
  if (!Array.isArray(slides)) return [];

  return slides.map((slide, index) => {
    const toTrimmedString = (value) => {
      if (typeof value === 'string') return value.trim();
      if (value === undefined || value === null) return '';
      return String(value).trim();
    };

    return {
      title: toTrimmedString(slide?.title) || `Slide ${index + 1}`,
      subtitle: toTrimmedString(slide?.subtitle),
      summary: toTrimmedString(slide?.summary || slide?.description || slide?.content),
      bullets: sanitizeStringArray(slide?.bullets || slide?.points || slide?.keyPoints),
      notes: toTrimmedString(slide?.notes || slide?.speakerNotes),
      layout: toTrimmedString(slide?.layout || slide?.format) || fallbackLayout
    };
  });
};

export const generateSectionMarkdown = (sectionData = {}, fallbackTitle = '') => {
  const section = toPlainObject(sectionData);

  if (typeof section === 'string') return section;
  if (section.markdown) return section.markdown;

  const lines = [];
  const heading = section.title || fallbackTitle;
  if (heading) {
    lines.push(`# ${heading.trim()}`);
  }

  const descriptionCandidates = [section.subtitle, section.summary, section.description, section.overview];
  descriptionCandidates.forEach(text => {
    if (text && typeof text === 'string') {
      lines.push('', text.trim());
    }
  });

  const narrativeFields = [section.body, section.narrative, section.context, section.details];
  narrativeFields.forEach(text => {
    if (text && typeof text === 'string') {
      lines.push('', text.trim());
    }
  });

  const keyMessages = sanitizeStringArray(section.keyMessages) || sanitizeStringArray(section.keyPoints);
  if (keyMessages.length) {
    lines.push('');
    keyMessages.forEach(message => {
      lines.push(`- ${message}`);
    });
  }

  const supportingData = sanitizeStringArray(section.supportingData) || sanitizeStringArray(section.dataHighlights);
  if (supportingData.length) {
    lines.push('', '**Supporting Data:**');
    supportingData.forEach(item => {
      lines.push(`- ${item}`);
    });
  }

  const actions = sanitizeStringArray(section.actions) || sanitizeStringArray(section.nextSteps);
  if (actions.length) {
    lines.push('', '**Actions:**');
    actions.forEach(item => {
      lines.push(`- ${item}`);
    });
  }

  if (section.notes && typeof section.notes === 'string') {
    lines.push('', `> ${section.notes.trim()}`);
  }

  const assembled = lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  if (assembled) return assembled;

  if (heading) {
    return `# ${heading.trim()}`;
  }

  return '# Section';
};

export const createSectionRecord = (sectionData = {}, options = {}) => {
  const section = toPlainObject(sectionData);
  const order = options.order ?? section.order ?? 0;
  const fallbackTitle = options.fallbackTitle || section.title || `Section ${order}`;
  const markdown = generateSectionMarkdown(section, fallbackTitle);
  const { html, charts: markdownCharts } = parseMarkdownWithCharts(markdown);
  const derived = deriveSectionMetadata(markdown);
  
  // Preserve existing charts from section data, or use markdown charts as fallback
  const charts = section.charts && section.charts.length > 0 ? section.charts : markdownCharts;

  const keyPointCandidates = sanitizeStringArray(
    derived.keyPoints.length ? derived.keyPoints :
      (section.keyPoints && section.keyPoints.length ? section.keyPoints : section.keyMessages)
  );

  const baseContentBlocks = cloneContentBlocks(section.contentBlocks);
  let contentBlocks = baseContentBlocks;

  if (!contentBlocks.length && keyPointCandidates.length) {
    contentBlocks = [{
      type: mapContentTypeToBlock(section.contentType || options.defaultContentType),
      items: keyPointCandidates
    }];
  }

  if (charts.length) {
    contentBlocks = [
      ...contentBlocks,
      {
        type: 'Data Visualization',
        items: sanitizeStringArray(charts.map(chart => chart.title || chart.id))
      }
    ];
  }

  const status = options.status || section.status || 'draft';
  const locked = options.locked ?? !!section.locked;
  const createdAt = section.created_at ? new Date(section.created_at) : (options.createdAt || new Date());
  const updatedAt = options.updatedAt || new Date();

  return {
    id: options.id || section.id || section._id || `section_${order}`,
    title: derived.title || section.title || fallbackTitle,
    description: derived.description || section.description || '',
    status,
    order,
    keyPoints: keyPointCandidates,
    contentBlocks,
    estimatedSlides: section.estimatedSlides || section.estimatedPages || options.estimatedSlides,
    locked,
    lockedBy: locked ? section.lockedBy : undefined,
    lockedAt: locked ? (section.lockedAt ? new Date(section.lockedAt) : new Date()) : undefined,
    framework: section.framework, // Preserve framework property
    takeaway: section.takeaway || '', // Preserve takeaway property
    notes: section.notes || '', // Preserve notes property
    insights: sanitizeStringArray(section.insights || section.keyInsights),
    sources: sanitizeStringArray(section.sources),
    layout: section.layout || options.layout,
    layoutAppliedAt: section.layoutAppliedAt
      ? new Date(section.layoutAppliedAt)
      : (section.layout_applied_at ? new Date(section.layout_applied_at) : undefined),
    chartData: cloneMixedValue(section.chartData, null),
    source: section.source,
    generatedAt: section.generatedAt
      ? new Date(section.generatedAt)
      : (section.generated_at ? new Date(section.generated_at) : undefined),
    slides: normalizeSlides(section.slides, section.layout || options.defaultLayout),
    slidesGeneratedAt: section.slidesGeneratedAt
      ? new Date(section.slidesGeneratedAt)
      : (section.slides_generated_at ? new Date(section.slides_generated_at) : undefined),
    slidesGenerationContext: cloneMixedValue(
      section.slidesGenerationContext || section.slides_generation_context,
      undefined
    ),
    markdown,
    html,
    charts: sanitizeCharts(charts),
    created_at: createdAt,
    updated_at: updatedAt
  };
};

export const ensureSectionHasRenderedContent = (section, options = {}) => {
  const plainSection = toPlainObject(section);

  const hasMarkdown = typeof plainSection.markdown === 'string' && plainSection.markdown.trim();
  const hasHtml = typeof plainSection.html === 'string' && plainSection.html.trim().length > 0;
  const hasCharts = Array.isArray(plainSection.charts);

  if (hasMarkdown && hasHtml && hasCharts) {
    return plainSection;
  }

  const enriched = createSectionRecord(plainSection, {
    id: plainSection.id || plainSection._id,
    order: plainSection.order ?? options.order ?? 0,
    status: plainSection.status,
    locked: plainSection.locked,
    fallbackTitle: plainSection.title || options.fallbackTitle,
    defaultContentType: options.defaultContentType || plainSection.contentBlocks?.[0]?.type,
    createdAt: plainSection.created_at ? new Date(plainSection.created_at) : undefined,
    updatedAt: plainSection.updated_at ? new Date(plainSection.updated_at) : undefined,
    estimatedSlides: plainSection.estimatedSlides || plainSection.estimatedPages
  });

  return {
    ...plainSection,
    ...enriched
  };
};
