/**
 * Section Content Parser
 * Parses and normalizes section content from various sources
 */

export function parseSectionContent(rawContent, framework = 'unknown') {
  console.log(`🔍 ===== PARSING SECTION CONTENT =====`);
  console.log(`Framework: ${framework}`);
  console.log(`Raw Content Type:`, typeof rawContent);
  console.log(`Raw Content:`, JSON.stringify(rawContent, null, 2));

  // Initialize parsed structure
  const parsedData = {
    id: `section_${Date.now()}`,
    title: '',
    description: '',
    slideContent: {},
    insights: [],
    citations: [],
    takeaway: '',
    notes: '',
    charts: [],
    status: 'draft',
    framework: framework,
    generatedAt: new Date().toISOString(),
    source: 'section-content-parser'
  };

  try {
    // Handle different input types
    let contentData = rawContent;
    
    // If it's a string, try to parse as JSON
    if (typeof rawContent === 'string') {
      try {
        contentData = JSON.parse(rawContent);
      } catch (e) {
        console.log('❌ Failed to parse string as JSON, treating as plain text');
        // If it's not JSON, treat as plain text and create basic structure
        parsedData.title = rawContent.substring(0, 100) + '...';
        parsedData.description = rawContent;
        return parsedData;
      }
    }

    // Extract slide_content
    if (contentData.slide_content) {
      parsedData.slideContent = contentData.slide_content;
      
      // Extract title from slide_content
      if (contentData.slide_content.title) {
        parsedData.title = contentData.slide_content.title;
      }
    }

    // Extract insights
    if (contentData.insights && Array.isArray(contentData.insights)) {
      parsedData.insights = contentData.insights;
    }

    // Extract citations
    if (contentData.citations && Array.isArray(contentData.citations)) {
      parsedData.citations = contentData.citations;
    }

    // Extract description
    if (contentData.description) {
      parsedData.description = contentData.description;
    }

    // Extract takeaway
    if (contentData.takeaway) {
      parsedData.takeaway = contentData.takeaway;
    }

    // Extract notes
    if (contentData.notes) {
      parsedData.notes = contentData.notes;
    }

    // Extract charts
    if (contentData.charts && Array.isArray(contentData.charts)) {
      parsedData.charts = contentData.charts;
    }

    // Generate charts from slide content if no explicit charts
    if (!parsedData.charts.length && parsedData.slideContent) {
      parsedData.charts = generateChartsFromSlideContent(parsedData.slideContent, framework);
    }

    console.log(`✅ Successfully parsed section content`);
    console.log(`Parsed Data:`, JSON.stringify(parsedData, null, 2));

    return parsedData;

  } catch (error) {
    console.error(`❌ Error parsing section content:`, error);
    
    // Return fallback structure
    return {
      ...parsedData,
      title: 'Parsing Error',
      description: `Failed to parse content: ${error.message}`,
      status: 'error'
    };
  }
}

/**
 * Generate charts from slide content
 */
function generateChartsFromSlideContent(slideContent, framework) {
  const charts = [];
  
  if (!slideContent || typeof slideContent !== 'object') {
    return charts;
  }

  // Look for table data that can be converted to charts
  Object.keys(slideContent).forEach(key => {
    const value = slideContent[key];
    
    // Check if it's an array of objects (potential table data)
    if (Array.isArray(value) && value.length > 0 && typeof value[0] === 'object') {
      charts.push({
        id: `chart_${key}_${Date.now()}`,
        title: `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Chart`,
        type: 'table',
        data: value,
        framework: framework
      });
    }
  });

  return charts;
}

/**
 * Extract key insights from slide content
 */
export function extractInsights(slideContent) {
  const insights = [];
  
  if (!slideContent || typeof slideContent !== 'object') {
    return insights;
  }

  // Look for common insight fields
  const insightFields = ['insights', 'key_insights', 'findings', 'conclusions', 'summary'];
  
  insightFields.forEach(field => {
    if (slideContent[field] && Array.isArray(slideContent[field])) {
      insights.push(...slideContent[field]);
    }
  });

  return insights;
}

/**
 * Extract citations from slide content
 */
export function extractCitations(slideContent) {
  const citations = [];
  
  if (!slideContent || typeof slideContent !== 'object') {
    return citations;
  }

  // Look for common citation fields
  const citationFields = ['citations', 'sources', 'references', 'attributions'];
  
  citationFields.forEach(field => {
    if (slideContent[field] && Array.isArray(slideContent[field])) {
      citations.push(...slideContent[field]);
    }
  });

  return citations;
}

/**
 * Validate section content structure
 */
export function validateSectionContent(content) {
  const errors = [];
  
  if (!content) {
    errors.push('Content is required');
    return { isValid: false, errors };
  }

  if (typeof content !== 'object') {
    errors.push('Content must be an object');
    return { isValid: false, errors };
  }

  if (!content.slide_content) {
    errors.push('slide_content is required');
  }

  if (!content.insights || !Array.isArray(content.insights)) {
    errors.push('insights must be an array');
  }

  if (!content.citations || !Array.isArray(content.citations)) {
    errors.push('citations must be an array');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}
