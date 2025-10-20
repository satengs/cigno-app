import { parseMarkdownWithCharts, deriveSectionMetadata } from '../markdown/markdownParser.js';
import { parseSectionContent } from '../sectionContentParser.js';

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

const looksLikeJsonString = (value) => {
  if (typeof value !== 'string') return false;
  const trimmed = value.trim();
  if (!trimmed) return false;
  const starts = trimmed[0];
  const ends = trimmed[trimmed.length - 1];
  return (starts === '{' && ends === '}') || (starts === '[' && ends === ']');
};

const sanitizeStringArray = (items) => {
  if (!Array.isArray(items)) return [];
  return items
    .map(item => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
};

const dedupeStrings = (items) => {
  const seen = new Set();
  return items.filter(item => {
    const key = item.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const mergeStringLists = (...sources) => {
  const combined = sources.flatMap(source => {
    if (!source) return [];
    if (Array.isArray(source)) return source;
    if (typeof source === 'string') return [source];
    return [];
  });

  if (!combined.length) return [];

  return dedupeStrings(sanitizeStringArray(combined));
};

const normalizeCitations = (citations) => {
  if (!Array.isArray(citations)) return [];

  const normalized = citations.map(citation => {
    if (!citation) return '';
    if (typeof citation === 'string') {
      return citation.trim();
    }

    if (typeof citation === 'object') {
      const parts = [citation.source, citation.title, citation.reference]
        .map(part => (typeof part === 'string' ? part.trim() : ''))
        .filter(Boolean);

      if (citation.url && typeof citation.url === 'string') {
        parts.push(citation.url.trim());
      }

      if (!parts.length) {
        try {
          return JSON.stringify(citation);
        } catch (error) {
          return String(citation);
        }
      }

      return parts.join(' — ');
    }

    return String(citation).trim();
  }).filter(Boolean);

  return dedupeStrings(normalized);
};

const collectSectionContentCandidates = (section) => {
  if (!section || typeof section !== 'object') return [];

  const candidates = [];
  const addCandidate = (value) => {
    if (value === undefined || value === null) return;

    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (!trimmed) return;

      const looksLikeJson = trimmed.startsWith('{')
        || trimmed.startsWith('[')
        || trimmed.includes('"slide_content"')
        || trimmed.includes('"sectionContent"')
        || trimmed.includes('"section_content"');

      if (looksLikeJson) {
        candidates.push(trimmed);
      }
      return;
    }

    if (typeof value === 'object' && Object.keys(value).length > 0) {
      candidates.push(value);
    }
  };

  addCandidate(section.sectionContent);
  addCandidate(section.section_content);
  addCandidate(section.section_content_json);
  addCandidate(section.section_content_raw);
  addCandidate(section.sectionData);
  addCandidate(section.section_data);
  addCandidate(section.rawSectionContent);
  addCandidate(section.raw_section_content);
  addCandidate(section.contentJson);
  addCandidate(section.content_json);
  addCandidate(section.generatedContent);
  addCandidate(section.generated_content);

  if (typeof section.content === 'string') {
    addCandidate(section.content);
  } else if (typeof section.content === 'object' && section.content) {
    addCandidate(section.content);
  }

  if (looksLikeJsonString(section.description)) {
    addCandidate(section.description.trim());
  }

  if (looksLikeJsonString(section.notes)) {
    addCandidate(section.notes.trim());
  }

  return candidates;
};

const parseSectionContentIfAvailable = (section, framework = 'unknown') => {
  const candidates = collectSectionContentCandidates(section);
  if (!candidates.length) return null;

  for (const candidate of candidates) {
    try {
      const parsed = parseSectionContent(candidate, framework);
      if (!parsed) {
        continue;
      }

      const hasStructuredData = (parsed.slideContent && Object.keys(parsed.slideContent).length > 0)
        || (Array.isArray(parsed.insights) && parsed.insights.length > 0)
        || (Array.isArray(parsed.citations) && parsed.citations.length > 0)
        || (Array.isArray(parsed.charts) && parsed.charts.length > 0);

      if (hasStructuredData) {
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to parse section content candidate', error);
    }
  }

  return null;
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

const normalizeSlides = (slides, fallbackLayout = 'full-width') => {
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
  const framework = section.framework || options.framework || options.defaultFramework || 'unknown';

  if (!section.slideContent && section.slide_content) {
    section.slideContent = section.slide_content;
  } else if (section.slideContent && !section.slide_content) {
    section.slide_content = section.slideContent;
  }

  const parsedSectionContent = parseSectionContentIfAvailable(section, framework);

  if (parsedSectionContent) {
    if (!section.sectionContent) {
      section.sectionContent = parsedSectionContent;
    }

    if (!section.title && parsedSectionContent.title) {
      section.title = parsedSectionContent.title;
    }

    if (!section.description && parsedSectionContent.description) {
      section.description = parsedSectionContent.description;
    }

    if (looksLikeJsonString(section.description)) {
      section.description = parsedSectionContent.description || '';
    }

    if (!section.takeaway && parsedSectionContent.takeaway) {
      section.takeaway = parsedSectionContent.takeaway;
    }

    if (!section.notes && parsedSectionContent.notes) {
      section.notes = parsedSectionContent.notes;
    }

    if (!section.slideContent || !Object.keys(section.slideContent || {}).length) {
      if (parsedSectionContent.slideContent && Object.keys(parsedSectionContent.slideContent).length) {
        section.slideContent = parsedSectionContent.slideContent;
        section.slide_content = parsedSectionContent.slideContent;
      }
    }

    const mergedInsights = mergeStringLists(section.insights, parsedSectionContent.insights);
    if (mergedInsights.length) {
      section.insights = mergedInsights;
    }

    const mergedKeyPoints = mergeStringLists(section.keyPoints, parsedSectionContent.insights);
    if (mergedKeyPoints.length) {
      section.keyPoints = mergedKeyPoints;
    }

    const parsedCitationStrings = normalizeCitations(parsedSectionContent.citations);
    if (parsedCitationStrings.length) {
      section.sources = mergeStringLists(section.sources, parsedCitationStrings);
      if (!section.citations) {
        section.citations = parsedSectionContent.citations;
      }
    }

    if (Array.isArray(parsedSectionContent.charts) && parsedSectionContent.charts.length) {
      const existingCharts = Array.isArray(section.charts) ? [...section.charts] : [];
      const existingIds = new Set(existingCharts.map(chart => chart?.id).filter(Boolean));

      parsedSectionContent.charts.forEach(chart => {
        if (!chart) return;
        const chartId = chart.id || null;
        if (chartId && existingIds.has(chartId)) return;
        existingCharts.push(chart);
        if (chartId) existingIds.add(chartId);
      });

      if (existingCharts.length) {
        section.charts = existingCharts;
      }
    }

    if (!section.chartData && parsedSectionContent.chartData) {
      section.chartData = parsedSectionContent.chartData;
    }
  }

  const order = options.order ?? section.order ?? 0;
  const fallbackTitle = options.fallbackTitle || section.title || `Section ${order}`;
  const markdown = generateSectionMarkdown(section, fallbackTitle);
  const { html, charts: markdownCharts } = parseMarkdownWithCharts(markdown);
  const derived = deriveSectionMetadata(markdown);

  const charts = section.charts && section.charts.length > 0
    ? section.charts
    : parsedSectionContent?.charts && parsedSectionContent.charts.length > 0
      ? parsedSectionContent.charts
      : markdownCharts;

  const keyPointCandidates = mergeStringLists(
    derived.keyPoints,
    section.keyPoints,
    section.keyMessages,
    parsedSectionContent?.insights
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
    const chartTitles = sanitizeStringArray(
      charts.map(chart => (chart?.title || chart?.id || '').toString())
    );

    if (chartTitles.length) {
      contentBlocks = [
        ...contentBlocks,
        {
          type: 'Data Visualization',
          items: chartTitles
        }
      ];
    }
  }

  const status = options.status || section.status || 'draft';
  const locked = options.locked ?? !!section.locked;
  const createdAt = section.created_at ? new Date(section.created_at) : (options.createdAt || new Date());
  const updatedAt = options.updatedAt || new Date();

  const normalizedInsights = mergeStringLists(section.insights, section.keyInsights, parsedSectionContent?.insights);
  const normalizedSources = mergeStringLists(section.sources, normalizeCitations(section.citations));

  const rawSlides = Array.isArray(section.slides) && section.slides.length
    ? section.slides
    : Array.isArray(parsedSectionContent?.slideContent?.slides)
      ? parsedSectionContent.slideContent.slides
      : [];

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
    framework: section.framework,
    takeaway: section.takeaway || '',
    notes: section.notes || '',
    insights: normalizedInsights,
    sources: normalizedSources,
    layout: section.layout || options.layout || 'full-width',
    layoutAppliedAt: section.layoutAppliedAt
      ? new Date(section.layoutAppliedAt)
      : (section.layout_applied_at ? new Date(section.layout_applied_at) : undefined),
    chartData: cloneMixedValue(section.chartData || parsedSectionContent?.chartData, null),
    source: section.source,
    generatedAt: section.generatedAt
      ? new Date(section.generatedAt)
      : (section.generated_at ? new Date(section.generated_at) : undefined),
    slides: normalizeSlides(rawSlides, section.layout || options.defaultLayout || 'full-width'),
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
    sectionContent: section.sectionContent || parsedSectionContent || undefined,
    slideContent: cloneMixedValue(section.slideContent || parsedSectionContent?.slideContent, {}),
    citations: section.citations || parsedSectionContent?.citations || [],
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
