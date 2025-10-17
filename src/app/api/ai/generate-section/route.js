import { NextResponse } from 'next/server';

// Framework to Agent ID mapping - replace with actual IDs later
const FRAMEWORK_AGENT_MAPPING = {
  'market_sizing': process.env.AI_MARKET_SIZING_AGENT_ID || '68f11e46a86a78027e4c82b4',
  'competitive_landscape': process.env.AI_COMPETITIVE_LANDSCAPE_AGENT_ID || '68f12833d9092e63f8d3ed01',
  'competition_analysis': process.env.AI_COMPETITION_ANALYSIS_AGENT_ID || '68f12833d9092e63f8d3ed01',
  'competitor_deep_dive': process.env.AI_COMPETITOR_DEEP_DIVE_AGENT_ID || '68f17ad9d9092e63f8d3edf8',
  'client_segments': process.env.AI_CLIENT_SEGMENTS_AGENT_ID || 'default_agent_id',
  'product_landscape': process.env.AI_PRODUCT_LANDSCAPE_AGENT_ID || 'default_agent_id',
  'capability_benchmark': process.env.AI_CAPABILITY_BENCHMARK_AGENT_ID || '68f17911d9092e63f8d3edf7',
  'capability_assessment': process.env.AI_CAPABILITY_ASSESSMENT_AGENT_ID || '68f187afd9092e63f8d3ee6c',
  'gap_analysis': process.env.AI_GAP_ANALYSIS_AGENT_ID || '68f1825bd9092e63f8d3ee17',
  'industry_trends': process.env.AI_INDUSTRY_TRENDS_AGENT_ID || '68f17297d9092e63f8d3edf6',
  'strategic_options': process.env.AI_STRATEGIC_OPTIONS_AGENT_ID || '68f17fe0d9092e63f8d3ee14',
  'recommendations': process.env.AI_RECOMMENDATIONS_AGENT_ID || 'default_agent_id',
  'buy_vs_build': process.env.AI_BUY_VS_BUILD_AGENT_ID || '68f1803cd9092e63f8d3ee15',
  'partnerships': process.env.AI_PARTNERSHIPS_AGENT_ID || '68f18307d9092e63f8d3ee18',
  'product_roadmap': process.env.AI_PRODUCT_ROADMAP_AGENT_ID || '68f18100d9092e63f8d3ee16'
};

export async function POST(request) {
  try {
    const body = await request.json();
    const { 
      framework, 
      sectionIndex, 
      deliverableData = {}, 
      projectData = {}, 
      clientData = {},
      briefContent = ''
    } = body;

    if (!framework) {
      return NextResponse.json(
        { error: 'Framework is required' },
        { status: 400 }
      );
    }

    // Get the agent ID for this framework
    const agentId = FRAMEWORK_AGENT_MAPPING[framework];
    if (!agentId) {
      return NextResponse.json(
        { error: `No agent configured for framework: ${framework}` },
        { status: 400 }
      );
    }

    // AI Configuration
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17'
    };

    console.log(`🎯 Generating section for framework: ${framework}`);
    console.log(`🤖 Using agent: ${agentId}`);

    // Prepare context for the specific framework
    const context = {
      framework,
      sectionIndex,
      deliverableData,
      projectData,
      clientData,
      briefContent,
      requestType: 'generate_section',
      deliverableId: deliverableData._id || deliverableData.id
    };

    const agentPayload = {
      message: `Generate comprehensive section content for ${framework} framework. Provide actionable insights and analysis even if specific data is not available. Use industry best practices and create meaningful content that adds value to the strategic analysis.`,
      context: {
        ...context,
        frameworkName: framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        instructions: {
          generateContent: true,
          provideInsights: true,
          createCharts: true,
          avoidGenericResponses: true,
          useIndustryStandards: true,
          fallbackToBestPractices: true
        },
        requirements: {
          mustIncludeChart: true,
          mustIncludeInsights: true,
          mustIncludeTakeaway: true,
          avoidEmptyResponses: true,
          provideActionableContent: true
        }
      },
      data: context
    };

    console.log('📤 Section generation payload:', JSON.stringify(agentPayload, null, 2));

    // Check if agent ID is valid (not default_agent_id)
    if (agentId === 'default_agent_id') {
      console.log(`⚠️ No agent configured for ${framework}, returning error response`);
      return NextResponse.json({
        success: false,
        error: `No AI agent configured for ${framework} framework`,
        framework,
        agentId: null,
        source: 'framework-agent'
      }, { status: 400 });
    }

    try {
      // Call the specific agent for this framework
      const response = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_CONFIG.apiKey
        },
        body: JSON.stringify(agentPayload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Section generation failed for ${framework}:`, errorText);
        throw new Error(`Agent call failed (${response.status}): ${errorText}`);
      }

      const agentResult = await response.json();
      console.log(`✅ Section generated for ${framework}:`, agentResult);

      // Parse and normalize the response
      const sectionData = parseSectionResponse(agentResult, framework, sectionIndex);

      return NextResponse.json({
        success: true,
        source: 'framework-agent',
        framework,
        agentId,
        sectionIndex,
        data: sectionData
      });

    } catch (agentError) {
      console.error(`❌ Section generation agent error for ${framework}:`, agentError);
      
      return NextResponse.json(
        {
          error: `Failed to generate section for ${framework}`,
          details: agentError.message,
          framework,
          sectionIndex
        },
        { status: 502 }
      );
    }

  } catch (error) {
    console.error('❌ Section generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process section generation request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

function generateFallbackContent(framework, originalResponse) {
  const fallbackContent = {
    'market_sizing': {
      title: 'Market Sizing Analysis',
      description: 'Comprehensive market size assessment and growth projections',
      insights: [
        'Market size analysis requires industry-specific data and growth trends',
        'Key factors include total addressable market (TAM) and serviceable addressable market (SAM)',
        'Growth projections should consider historical trends and future market drivers'
      ],
      takeaway: 'A thorough market sizing analysis provides the foundation for strategic decision-making and investment planning.',
      chartData: {
        labels: ['Current Market', 'Projected Growth', 'Target Segment'],
        datasets: [{
          label: 'Market Size (Billions)',
          data: [100, 150, 75],
          backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
        }]
      }
    },
    'competitive_landscape': {
      title: 'Competitive Landscape Analysis',
      description: 'Strategic assessment of market competitors and positioning',
      insights: [
        'Competitive analysis should evaluate direct and indirect competitors',
        'Key metrics include market share, pricing, and value proposition',
        'SWOT analysis helps identify competitive advantages and threats'
      ],
      takeaway: 'Understanding the competitive landscape is crucial for strategic positioning and market entry decisions.',
      chartData: {
        labels: ['Innovation', 'Pricing', 'Market Share', 'Customer Satisfaction'],
        datasets: [{
          label: 'Competitor A',
          data: [8, 7, 6, 9]
        }, {
          label: 'Competitor B', 
          data: [6, 9, 8, 7]
        }]
      }
    },
    'capability_assessment': {
      title: 'Capability Assessment',
      description: 'Evaluation of organizational capabilities and competencies',
      insights: [
        'Capability assessment should cover core competencies and skill gaps',
        'Key areas include technology, processes, and human resources',
        'Benchmarking against industry standards provides valuable insights'
      ],
      takeaway: 'A comprehensive capability assessment identifies strengths to leverage and gaps to address.',
      chartData: {
        labels: ['Technology', 'Processes', 'People', 'Innovation'],
        datasets: [{
          label: 'Current State',
          data: [7, 6, 8, 5]
        }, {
          label: 'Target State',
          data: [9, 9, 9, 8]
        }]
      }
    },
    'gap_analysis': {
      title: 'Gap Analysis',
      description: 'Identification of capability gaps and improvement opportunities',
      insights: [
        'Gap analysis compares current state with desired future state',
        'Key focus areas include skills, processes, and technology',
        'Prioritization helps allocate resources effectively'
      ],
      takeaway: 'Gap analysis provides a roadmap for capability development and strategic improvement.',
      chartData: {
        labels: ['Skills', 'Processes', 'Technology', 'Resources'],
        datasets: [{
          label: 'Current',
          data: [6, 7, 5, 8]
        }, {
          label: 'Target',
          data: [9, 9, 9, 9]
        }]
      }
    },
    'strategic_options': {
      title: 'Strategic Options Analysis',
      description: 'Evaluation of strategic alternatives and decision framework',
      insights: [
        'Strategic options should be evaluated on multiple criteria',
        'Key factors include feasibility, impact, and resource requirements',
        'Decision matrix helps prioritize and select optimal strategies'
      ],
      takeaway: 'A structured approach to strategic options ensures informed decision-making.',
      chartData: {
        labels: ['Option A', 'Option B', 'Option C'],
        datasets: [{
          label: 'Feasibility',
          data: [8, 6, 9]
        }, {
          label: 'Impact',
          data: [7, 9, 6]
        }]
      }
    },
    'product_roadmap': {
      title: 'Product Roadmap',
      description: 'Strategic product development timeline and milestones',
      insights: [
        'Product roadmap should align with business objectives',
        'Key phases include planning, development, and launch',
        'Milestones should be measurable and achievable'
      ],
      takeaway: 'A well-structured product roadmap guides development and ensures alignment with strategic goals.',
      chartData: {
        labels: ['Phase 1', 'Phase 2', 'Phase 3'],
        datasets: [{
          label: 'Progress',
          data: [100, 75, 25]
        }]
      }
    }
  };

  const fallback = fallbackContent[framework] || {
    title: framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: `Strategic analysis for ${framework.replace(/_/g, ' ')}`,
    insights: [
      'This analysis requires specific industry data and context',
      'Key insights should be based on available information and best practices',
      'Recommendations should be actionable and aligned with business objectives'
    ],
    takeaway: 'Strategic analysis provides valuable insights for decision-making and planning.',
    chartData: {
      labels: ['Category 1', 'Category 2', 'Category 3'],
      datasets: [{
        label: 'Value',
        data: [75, 85, 90],
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
      }]
    }
  };

  // Return structured content that can be parsed
  return JSON.stringify(fallback);
}

function parseSectionResponse(agentResult, framework, sectionIndex) {
  console.log(`🔍 Parsing response for ${framework}:`, JSON.stringify(agentResult, null, 2));
  
  // Extract section data from agent response
  let title = '';
  let content = '';
  let description = '';
  let notes = '';
  let takeaway = '';
  let keyPoints = [];
  let charts = [];

  // Try to extract title
  if (agentResult.title) {
    title = agentResult.title;
  } else if (agentResult.data?.title) {
    title = agentResult.data.title;
  } else if (agentResult.response?.title) {
    title = agentResult.response.title;
  } else if (agentResult.response && typeof agentResult.response === 'string') {
    // Try to extract title from response content (look for ## headings)
    const titleMatch = agentResult.response.match(/^##\s+(.+)$/m);
    if (titleMatch) {
      title = titleMatch[1].trim();
    } else {
      // Generate title from framework if not provided
      title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  } else {
    // Generate title from framework if not provided
    title = framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  // Try to extract content - but don't show raw JSON
  if (agentResult.response) {
    // Check if response is JSON
    try {
      const responseData = JSON.parse(agentResult.response);
      // If it's JSON, extract all available fields but don't show raw JSON
      content = '';
      
      // Extract additional fields from JSON response
      if (responseData.description) description = responseData.description;
      if (responseData.notes) notes = responseData.notes;
      if (responseData.takeaway) takeaway = responseData.takeaway;
      if (responseData.summary) description = responseData.summary;
      if (responseData.overview) description = responseData.overview;
      
    } catch (e) {
      // If it's not JSON, check for generic responses and replace with meaningful content
      const responseText = agentResult.response.toLowerCase();
      if (responseText.includes('unable to retrieve') || 
          responseText.includes('insufficient information') || 
          responseText.includes('no data available') ||
          responseText.includes('please provide additional details')) {
        
        // Generate fallback content based on framework
        content = generateFallbackContent(framework, agentResult.response);
      } else {
        // If it's not a generic response, show the response as content
        content = agentResult.response;
      }
    }
  } else if (agentResult.content) {
    content = agentResult.content;
  } else if (agentResult.data?.content) {
    content = agentResult.data.content;
  } else if (agentResult.response?.content) {
    content = agentResult.response.content;
  } else if (agentResult.markdown) {
    content = agentResult.markdown;
  } else if (agentResult.data?.markdown) {
    content = agentResult.data.markdown;
  } else if (agentResult.response?.markdown) {
    content = agentResult.response.markdown;
  } else {
    // No content available from agent - return empty
    content = '';
  }

  // Try to extract key points
  if (agentResult.keyPoints && Array.isArray(agentResult.keyPoints)) {
    keyPoints = agentResult.keyPoints;
  } else if (agentResult.data?.keyPoints && Array.isArray(agentResult.data.keyPoints)) {
    keyPoints = agentResult.data.keyPoints;
  } else if (agentResult.response?.keyPoints && Array.isArray(agentResult.response.keyPoints)) {
    keyPoints = agentResult.response.keyPoints;
  } else if (agentResult.response && typeof agentResult.response === 'string') {
    // Try to extract key points from response content (look for bullet points and numbered lists)
    const bulletPoints = agentResult.response.match(/^[-*]\s+(.+)$/gm);
    const numberedPoints = agentResult.response.match(/^\d+\.\s+(.+)$/gm);
    
    if (bulletPoints && bulletPoints.length > 0) {
      keyPoints = bulletPoints.map(point => point.replace(/^[-*]\s+/, '').trim());
    } else if (numberedPoints && numberedPoints.length > 0) {
      keyPoints = numberedPoints.map(point => point.replace(/^\d+\.\s+/, '').trim());
    } else {
      // Try to parse as JSON and extract insights
      try {
        const responseData = JSON.parse(agentResult.response);
        if (responseData.insights && Array.isArray(responseData.insights)) {
          keyPoints = responseData.insights;
        }
      } catch (e) {
        // Not JSON, continue with empty keyPoints
      }
    }
  }

  // Try to extract charts
  if (agentResult.charts && Array.isArray(agentResult.charts)) {
    charts = agentResult.charts;
  } else if (agentResult.data?.charts && Array.isArray(agentResult.data.charts)) {
    charts = agentResult.data.charts;
  } else if (agentResult.response?.charts && Array.isArray(agentResult.response.charts)) {
    charts = agentResult.response.charts;
  } else if (agentResult.response && typeof agentResult.response === 'string') {
    // Try to extract chart data from response content (look for JSON code blocks first)
    const jsonMatch = agentResult.response.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        const chartData = JSON.parse(jsonMatch[1]);
        if (chartData.labels && chartData.datasets) {
          charts = [{
            id: `chart_${sectionIndex + 1}`,
            title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
            type: 'radar', // Default to radar for competition analysis
            config: {
              data: chartData,
              generated: true
            }
          }];
        }
      } catch (e) {
        console.log('Could not parse chart JSON from response:', e.message);
      }
    } else {
      // Try to parse the entire response as JSON (for direct JSON responses)
      try {
        const responseData = JSON.parse(agentResult.response);
        if (responseData.labels && responseData.datasets) {
          // Standard chart data format
          charts = [{
            id: `chart_${sectionIndex + 1}`,
            title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
            type: responseData.chartType || 'bar',
            config: {
              data: responseData,
              generated: true
            }
          }];
        } else if (responseData.phases && Array.isArray(responseData.phases)) {
          // Timeline/roadmap data format
          charts = [{
            id: `chart_${sectionIndex + 1}`,
            title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
            type: responseData.chartType || 'timeline',
            config: {
              data: responseData,
              generated: true
            }
          }];
        } else if (responseData.chartData && responseData.chartData.labels && responseData.chartData.datasets) {
          // Fallback content with chart data
          charts = [{
            id: `chart_${sectionIndex + 1}`,
            title: responseData.title || `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
            type: 'bar',
            config: {
              data: responseData.chartData,
              generated: true
            }
          }];
        }
      } catch (e) {
        console.log('Could not parse response as JSON:', e.message);
      }
    }
  }

  const parsedData = {
    id: `section_${sectionIndex + 1}`,
    title: title || framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    description: description || '', // Extract from JSON if available
    markdown: content,
    html: content,
    charts,
    keyPoints,
    takeaway: takeaway || '', // Extract from JSON if available
    notes: notes || '', // Extract from JSON if available
    status: 'draft',
    order: sectionIndex + 1,
    contentBlocks: [],
    locked: false,
    framework,
    generatedAt: new Date().toISOString(),
    source: 'framework-agent'
  };
  
  console.log(`✅ Parsed data for ${framework}:`, JSON.stringify(parsedData, null, 2));
  return parsedData;
}
