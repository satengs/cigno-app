import MarkdownIt from 'markdown-it';

const CHART_IMAGE_PATH = '/chart.heic';
const FENCED_CHART_REGEX = /```chart\s*\n([\s\S]*?)```/gi;
const COMPONENT_CHART_REGEX = /<Chart\b([^>]*)>([\s\S]*?)<\/Chart>/gi;

const markdownParser = new MarkdownIt({
  html: true,
  linkify: true,
  breaks: false
});

const escapeHtml = (value = '') =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const encodeDataAttribute = (data) =>
  encodeURIComponent(JSON.stringify(data ?? {}));

const parseAttributeString = (attrString = '') => {
  const attributes = {};
  const attrRegex = /(\w[\w-]*)\s*=\s*"([^"]*)"/gi;
  let match;

  while ((match = attrRegex.exec(attrString)) !== null) {
    const [, key, value] = match;
    attributes[key] = value;
  }

  return attributes;
};

const parseJsonSafely = (value, fallback = null) => {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('[markdownParser] Failed to parse JSON chart payload:', error?.message);
    return fallback;
  }
};

const createChartRecord = ({
  charts,
  source,
  config,
  attributes,
  raw,
}) => {
  const chartId = `chart-${charts.length + 1}`;
  const title = config?.title || attributes?.title || `Chart ${charts.length + 1}`;
  const caption = config?.caption || attributes?.caption || '';

  const chartRecord = {
    id: chartId,
    title,
    caption,
    source,
    config: config || {},
    attributes: attributes || {},
    raw
  };

  charts.push(chartRecord);

  const dataAttribute = encodeDataAttribute({
    id: chartId,
    config: chartRecord.config,
    attributes: chartRecord.attributes,
    source: chartRecord.source
  });

  const figureParts = [
    `<figure class="markdown-chart" data-chart-id="${chartId}" data-chart-config="${dataAttribute}">`,
    `<img src="${CHART_IMAGE_PATH}" alt="${escapeHtml(title)}" class="markdown-chart__image" />`
  ];

  if (caption) {
    figureParts.push(`<figcaption class="markdown-chart__caption">${escapeHtml(caption)}</figcaption>`);
  }

  figureParts.push('</figure>');

  return `\n\n${figureParts.join('\n')}\n\n`;
};

const transformFencedCharts = (markdown, charts) =>
  markdown.replace(FENCED_CHART_REGEX, (_, codeBlock) => {
    const trimmed = codeBlock.trim();
    const config = parseJsonSafely(trimmed, { raw: trimmed });

    return createChartRecord({
      charts,
      source: 'fenced-code',
      config,
      raw: trimmed
    });
  });

const transformComponentCharts = (markdown, charts) =>
  markdown.replace(COMPONENT_CHART_REGEX, (_, attrString, body) => {
    const attributes = parseAttributeString(attrString);
    const trimmedBody = body.trim();
    const fallbackFromAttribute = attributes?.data ? parseJsonSafely(attributes.data, { raw: attributes.data }) : null;
    const config = parseJsonSafely(trimmedBody, fallbackFromAttribute);

    return createChartRecord({
      charts,
      source: 'component',
      config: config || attributes,
      attributes,
      raw: trimmedBody || attrString
    });
  });

export const parseMarkdownWithCharts = (markdown = '') => {
  if (typeof markdown !== 'string') {
    console.warn('[markdownParser] Expected markdown to be a string');
    return { html: '', charts: [], raw: '' };
  }

  const charts = [];
  let processed = markdown;

  processed = transformFencedCharts(processed, charts);
  processed = transformComponentCharts(processed, charts);

  const html = markdownParser.render(processed);

  return {
    html,
    charts,
    raw: markdown
  };
};

export default parseMarkdownWithCharts;

const extractListItems = (tokens, startIndex) => {
  const items = [];
  for (let index = startIndex + 1; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.type === 'bullet_list_close') break;
    if (token.type === 'list_item_open') {
      let itemContent = '';
      let innerIndex = index + 1;
      for (; innerIndex < tokens.length; innerIndex += 1) {
        const innerToken = tokens[innerIndex];
        if (innerToken.type === 'list_item_close') break;
        if (innerToken.type === 'inline' && innerToken.content) {
          itemContent += innerToken.content;
        }
      }
      if (itemContent.trim()) {
        items.push(itemContent.trim());
      }
      index = innerIndex;
    }
  }
  return items;
};

export const deriveSectionMetadata = (markdown = '') => {
  if (typeof markdown !== 'string' || !markdown.trim()) {
    return {
      title: '',
      description: '',
      keyPoints: []
    };
  }

  const tokens = markdownParser.parse(markdown, {});
  let title = '';
  let description = '';
  let keyPoints = [];

  for (let i = 0; i < tokens.length; i += 1) {
    const token = tokens[i];

    if (!title && token.type === 'heading_open') {
      const inlineToken = tokens[i + 1];
      if (inlineToken && inlineToken.type === 'inline' && inlineToken.content) {
        title = inlineToken.content.trim();
      }
    }

    if (!description && token.type === 'paragraph_open') {
      const inlineToken = tokens[i + 1];
      if (inlineToken && inlineToken.type === 'inline' && inlineToken.content) {
        description = inlineToken.content.trim();
      }
    }

    if (!keyPoints.length && token.type === 'bullet_list_open') {
      keyPoints = extractListItems(tokens, i);
    }

    if (title && description && keyPoints.length) {
      break;
    }
  }

  return {
    title,
    description,
    keyPoints
  };
};
