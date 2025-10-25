/**
 * Extract frameworks from brief scoring results
 * This function analyzes the brief scoring response to identify which frameworks are relevant
 */

export function extractFrameworksFromBriefScoring(briefScoringResult) {
  const frameworks = [];
  
  if (!briefScoringResult || !briefScoringResult.data) {
    return frameworks;
  }

  const data = briefScoringResult.data;
  
  // Look for frameworks in various possible locations in the response
  const possibleFrameworkFields = [
    'frameworks',
    'relevantFrameworks', 
    'applicableFrameworks',
    'frameworkMatches',
    'detectedFrameworks',
    'analysisFrameworks'
  ];

  for (const field of possibleFrameworkFields) {
    if (data[field] && Array.isArray(data[field])) {
      frameworks.push(...data[field]);
    }
  }

  // Also check in nested objects
  if (data.analysis && data.analysis.frameworks && Array.isArray(data.analysis.frameworks)) {
    frameworks.push(...data.analysis.frameworks);
  }

  if (data.recommendations && data.recommendations.frameworks && Array.isArray(data.recommendations.frameworks)) {
    frameworks.push(...data.recommendations.frameworks);
  }

  // If no frameworks found in structured data, try to extract from text content
  if (frameworks.length === 0) {
    const textContent = JSON.stringify(data).toLowerCase();
    frameworks.push(...extractFrameworksFromText(textContent));
  }

  // Normalize and deduplicate frameworks
  const normalizedFrameworks = frameworks
    .map(f => normalizeFrameworkName(f))
    .filter(f => f && isValidFramework(f))
    .filter((f, index, arr) => arr.indexOf(f) === index); // Remove duplicates

  console.log('🔍 Extracted frameworks from brief scoring:', normalizedFrameworks);
  
  return normalizedFrameworks;
}

function normalizeFrameworkName(framework) {
  if (typeof framework !== 'string') return null;
  
  return framework
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function isValidFramework(framework) {
  const validFrameworks = [
    'market_sizing',
    'competitive_landscape', 
    'competition_analysis',
    'competitor_deep_dive',
    'client_segments',
    'product_landscape',
    'capability_benchmark',
    'capability_assessment',
    'gap_analysis',
    'industry_trends',
    'strategic_options',
    'recommendations',
    'buy_vs_build',
    'partnerships',
    'product_roadmap',
    // New frameworks
    'brief_scorer',
    'key_industry_trends',
    'deep_dive_strategic_option'
  ];
  
  return validFrameworks.includes(framework);
}

function extractFrameworksFromText(text) {
  const frameworks = [];
  
  // Look for framework mentions in text
  const frameworkPatterns = {
    'market_sizing': /\b(market sizing|market size|market analysis)\b/gi,
    'competitive_landscape': /\b(competitive landscape|competition overview|market competition)\b/gi,
    'competition_analysis': /\b(competition analysis|competitive analysis|competitor analysis)\b/gi,
    'competitor_deep_dive': /\b(competitor deep dive|competitor analysis|competitor research)\b/gi,
    'client_segments': /\b(client segments|customer segments|target segments|market segments)\b/gi,
    'product_landscape': /\b(product landscape|product analysis|product overview)\b/gi,
    'capability_benchmark': /\b(capability benchmark|capability comparison|benchmarking)\b/gi,
    'capability_assessment': /\b(capability assessment|capability analysis|capability review)\b/gi,
    'gap_analysis': /\b(gap analysis|capability gaps|gap assessment)\b/gi,
    'industry_trends': /\b(industry trends|market trends|trend analysis)\b/gi,
    'strategic_options': /\b(strategic options|strategic alternatives|strategic choices)\b/gi,
    'recommendations': /\b(recommendations|strategic recommendations|action plan)\b/gi,
    'buy_vs_build': /\b(buy vs build|build vs buy|make or buy)\b/gi,
    'partnerships': /\b(partnerships|strategic partnerships|alliances)\b/gi,
    'product_roadmap': /\b(product roadmap|roadmap|product strategy)\b/gi
  };

  for (const [framework, pattern] of Object.entries(frameworkPatterns)) {
    if (pattern.test(text)) {
      frameworks.push(framework);
    }
  }

  return frameworks;
}

/**
 * Get default frameworks if none are detected from brief scoring
 */
export function getDefaultFrameworks() {
  return [
    'market_sizing',
    'competitive_landscape',
    'key_industry_trends',
    'capabilities_assessment',
    'competitor_deep_dive',
    'strategic_options',
    'deep_dive_strategic_option',
    'buy_vs_build',
    'product_roadmap'
  ];
}

/**
 * Create skeleton sections for frameworks
 */
export function createSkeletonSections(frameworks) {
  console.log('🔍 createSkeletonSections called with frameworks:', frameworks);
  console.log('🔍 frameworks type:', typeof frameworks);
  console.log('🔍 frameworks length:', frameworks?.length);
  
  if (!Array.isArray(frameworks)) {
    console.error('❌ frameworks is not an array:', frameworks);
    return [];
  }
  
  const sections = frameworks.map((framework, index) => {
    console.log(`🔍 Creating skeleton section ${index + 1} for framework:`, framework);
    
    // Determine initial generation status based on CFA-DEMO dependency model
    let generationStatus = 'waiting';
    
    // Phase 1 (Parallel): Market Sizing + Competitive Landscape start immediately
    if (framework === 'market_sizing' || framework === 'competitive_landscape') {
      generationStatus = 'waiting'; // Will be set to 'generating' when execution starts
    }
    // Phase 2 (Sequential): Others wait for dependencies
    else {
      generationStatus = 'waiting';
    }
    
    return {
      id: `section_${index + 1}`,
      title: '', // No placeholder title - wait for backend
      description: '', // No placeholder description - wait for backend
      markdown: '', // No placeholder content - wait for backend
      html: '', // No placeholder content - wait for backend
      charts: [],
      keyPoints: [], // No placeholder key points - wait for backend
      status: 'loading',
      order: index + 1,
      contentBlocks: [],
      locked: false,
      framework,
      isLoading: true,
      generationStatus,
      generatedAt: null,
      source: 'skeleton',
      statusTimeline: []
    };
  });
  
  console.log('🔍 Created skeleton sections:', JSON.stringify(sections, null, 2));
  return sections;
}
