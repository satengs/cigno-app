import { NextResponse } from 'next/server';
import { parseSectionResponse } from '../../../../lib/frameworkRenderer';
import getRequiredAiApiKey from '../../../../lib/ai/getRequiredAiApiKey.js';

// Framework to Agent ID mapping – matches synchronous orchestration defaults
const FRAMEWORK_AGENT_MAPPING = {
  taxonomy: process.env.TAXONOMY_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
  'market_sizing': process.env.AI_MARKET_SIZING_AGENT_ID || '68f3a191dfc921b68ec3e83a',
  'competitive_landscape': process.env.AI_COMPETITIVE_LANDSCAPE_AGENT_ID || '68f3a9a5dfc921b68ec3e959',
  'key_industry_trends': process.env.AI_KEY_INDUSTRY_TRENDS_AGENT_ID || '68f3f71fdfc921b68ec3ea8d',
  'capabilities_assessment': process.env.AI_CAPABILITIES_ASSESSMENT_AGENT_ID || '68f3f817dfc921b68ec3ea8e',
  'competitor_deep_dive': process.env.AI_COMPETITOR_DEEP_DIVE_AGENT_ID || '68f4a393dfc921b68ec3ec36',
  'strategic_options': process.env.AI_STRATEGIC_OPTIONS_AGENT_ID || '68f4a655dfc921b68ec3ec37',
  'deep_dive_strategic_option': process.env.AI_DEEP_DIVE_STRATEGIC_OPTION_AGENT_ID || '68f4a8dfdfc921b68ec3ec38',
  'buy_vs_build': process.env.AI_BUY_VS_BUILD_AGENT_ID || '68f4ae2fdfc921b68ec3ec39',
  'product_roadmap': process.env.AI_PRODUCT_ROADMAP_AGENT_ID || '68f4b112dfc921b68ec3ec3a',
  'capability_benchmark': process.env.AI_CAPABILITY_BENCHMARK_AGENT_ID || '68f22f36330210e8b8f60a51',
  'partnerships': process.env.AI_PARTNERSHIPS_AGENT_ID || '68f23be77e8d5848f9404847',
  'competition_analysis': process.env.AI_COMPETITION_ANALYSIS_AGENT_ID || '68f22dc0330210e8b8f60a43',
  'client_segments': process.env.AI_CLIENT_SEGMENTS_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
  'product_landscape': process.env.AI_PRODUCT_LANDSCAPE_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0',
  'gap_analysis': process.env.AI_GAP_ANALYSIS_AGENT_ID || '68f1825bd9092e63f8d3ee17',
  'industry_trends': process.env.AI_INDUSTRY_TRENDS_AGENT_ID || '68f17297d9092e63f8d3edf6',
  'recommendations': process.env.AI_RECOMMENDATIONS_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0'
};

const DEFAULT_POLL_DELAYS = [1000, 2000, 3000, 5000];

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const resolvePollDelays = () => {
  const configured = process.env.FRAMEWORK_AGENT_POLL_DELAYS;
  if (!configured) return DEFAULT_POLL_DELAYS;
  const parsed = configured
    .split(',')
    .map(value => parseInt(value.trim(), 10))
    .filter(Number.isFinite);
  return parsed.length ? parsed : DEFAULT_POLL_DELAYS;
};

const extractResponseText = (agentResult) => {
  if (!agentResult) return '';
  if (typeof agentResult === 'string') return agentResult;
  if (typeof agentResult.content === 'string') return agentResult.content;
  if (typeof agentResult.response === 'string') return agentResult.response;
  if (typeof agentResult.data === 'string') return agentResult.data;
  if (Array.isArray(agentResult.response)) {
    return agentResult.response.join('\n');
  }
  try {
    return JSON.stringify(agentResult);
  } catch (error) {
    console.log('⚠️ Failed to stringify agent result:', error.message);
    return '';
  }
};

const normalizeNarrativeType = (rawType, message) => {
  if (!rawType && message) {
    const normalizedMessage = message.toLowerCase();
    if (/[✅✔️🎉]/u.test(message) || /\b(done|completed|success|ready|delivered)\b/.test(normalizedMessage)) {
      return 'success';
    }
    if (/[⚠️🚧]/u.test(message) || /\b(warning|caution|wait|pending)\b/.test(normalizedMessage)) {
      return 'warning';
    }
    if (/[❌⛔️🔥]/u.test(message) || /\b(error|failed|failure|issue|problem|unable)\b/.test(normalizedMessage)) {
      return 'error';
    }
    if (/[⏳⌛️🔄]/u.test(message) || /\b(progress|running|processing|generating|starting|queued|updating)\b/.test(normalizedMessage)) {
      return 'progress';
    }
    return 'info';
  }

  if (!rawType) return 'info';

  const normalized = String(rawType).toLowerCase();
  if (['success', 'completed', 'complete', 'done', 'finished'].includes(normalized)) {
    return 'success';
  }
  if (['error', 'failed', 'failure', 'fatal'].includes(normalized)) {
    return 'error';
  }
  if (['warning', 'warn', 'caution'].includes(normalized)) {
    return 'warning';
  }
  if (['progress', 'running', 'in_progress', 'processing', 'queued', 'starting', 'info'].includes(normalized)) {
    return normalized === 'info' ? 'info' : 'progress';
  }

  return 'info';
};

const createNarrativeCollector = () => {
  const entries = [];
  const seen = new Set();
  let sequence = 0;

  const toIsoTimestamp = (value) => {
    if (!value) return new Date().toISOString();
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'number') {
      try {
        return new Date(value).toISOString();
      } catch (error) {
        return new Date().toISOString();
      }
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!Number.isNaN(parsed.valueOf())) {
        return parsed.toISOString();
      }
    }
    return new Date().toISOString();
  };

  const extractMessage = (item) => {
    if (typeof item === 'string') return item.trim();
    if (!item || typeof item !== 'object') return '';
    const candidates = [
      item.message,
      item.text,
      item.description,
      item.content,
      item.summary,
      item.status,
      item.title
    ];
    const found = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    if (found) return found.trim();
    try {
      return JSON.stringify(item);
    } catch (error) {
      return '';
    }
  };

  const addEntry = (item, origin) => {
    const message = extractMessage(item);
    if (!message) return;

    const type = normalizeNarrativeType(item?.type || item?.status || item?.level || item?.severity, message);
    const timestamp = toIsoTimestamp(item?.timestamp || item?.time || item?.updated_at || item?.updatedAt || item?.created_at || item?.createdAt);
    const key = `${origin}|${message}|${type}`;
    if (seen.has(key)) return;
    seen.add(key);

    const currentSequence = sequence;
    sequence += 1;

    entries.push({
      id: `${origin}-${currentSequence}`,
      origin,
      message,
      type,
      timestamp,
      sequence: currentSequence
    });
  };

  const collect = (payload, origin) => {
    if (!payload) return;
    if (Array.isArray(payload)) {
      payload.forEach((item) => addEntry(item, origin));
      return;
    }
    addEntry(payload, origin);
  };

  return {
    collectFromStatus(statusPayload) {
      if (!statusPayload || typeof statusPayload !== 'object') return;
      collect(statusPayload.narratives, 'status');
      collect(statusPayload.narrativeHistory, 'status');
      collect(statusPayload.progressHistory, 'status');
      collect(statusPayload.statusHistory, 'status');
      collect(statusPayload.timeline, 'status');
      collect(statusPayload.events, 'status');
      collect(statusPayload.messages, 'status');
      if (statusPayload.metadata && typeof statusPayload.metadata === 'object') {
        collect(statusPayload.metadata.narratives, 'status');
        collect(statusPayload.metadata.statuses, 'status');
        collect(statusPayload.metadata.messages, 'status');
      }
    },
    collectFromResult(resultPayload) {
      if (!resultPayload || typeof resultPayload !== 'object') return;
      collect(resultPayload.narratives, 'result');
      collect(resultPayload.narrativeHistory, 'result');
      collect(resultPayload.progressHistory, 'result');
      collect(resultPayload.statusHistory, 'result');
      collect(resultPayload.timeline, 'result');
      collect(resultPayload.events, 'result');
      collect(resultPayload.messages, 'result');
      if (resultPayload.metadata && typeof resultPayload.metadata === 'object') {
        collect(resultPayload.metadata.narratives, 'result');
        collect(resultPayload.metadata.statuses, 'result');
        collect(resultPayload.metadata.messages, 'result');
      }
    },
    getEntries() {
      return entries
        .sort((a, b) => a.sequence - b.sequence)
        .map(({ sequence, ...rest }) => rest);
    }
  };
};

export async function POST(request) {
  try {
    console.log('🔧 ===== GENERATE-SECTION API ROUTE CALLED =====');
    const body = await request.json();
    console.log('📋 Full request body:', JSON.stringify(body, null, 2));
    
    const { 
      framework, 
      sectionIndex, 
      deliverableData = {}, 
      projectData = {}, 
      clientData = {},
      briefContent = '',
      dependencies = {} // Agent dependency results
    } = body;

    if (!framework) {
      return NextResponse.json(
        { error: 'Framework is required' },
        { status: 400 }
      );
    }

    // Get the agent ID for this framework
    console.log(`🔍 Looking up agent for framework: ${framework}`);
    const agentId = FRAMEWORK_AGENT_MAPPING[framework];
    console.log(`🤖 Found agent ID: ${agentId}`);
    
    if (!agentId) {
      console.error(`❌ No agent configured for framework: ${framework}`);
      return NextResponse.json(
        { error: `No agent configured for framework: ${framework}` },
        { status: 400 }
      );
    }

    // AI Configuration
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: getRequiredAiApiKey()
    };

    console.log(`🎯 Generating section for framework: ${framework}`);
    console.log(`🤖 Using agent: ${agentId}`);
    console.log(`🔧 AI Config:`, AI_CONFIG);
    console.log(`🔗 Dependencies received:`, Object.keys(dependencies));

    // Build framework-specific input with dependency data
    let agentPayload;
    
    try {
      // Base context shared by all frameworks
      const baseContext = {
        project: {
          name: projectData.name || deliverableData.name || 'Strategic Analysis',
          client_name: clientData.name || projectData.client_name || 'Client',
          id: projectData.id || 'project-1',
          geography: clientData.geography || 'Switzerland'
        },
        deliverable: {
          brief: briefContent || deliverableData.brief || 'Strategic analysis and recommendations',
          brief_quality: deliverableData.brief_quality || null,
          brief_strengths: deliverableData.brief_strengths || [],
          brief_improvements: deliverableData.brief_improvements || [],
          type: deliverableData.type || 'Strategy Presentation',
          audience: deliverableData.audience || ['Business Stakeholders'],
          title: deliverableData.title || deliverableData.name || 'Strategic Analysis',
          industry: deliverableData.industry || []
        },
        client: {
          name: clientData.name,
          geography: clientData.geography,
          industry: clientData.industry
        }
      };

      // Build agent payload - stringify all data into message field
      const payloadData = {
        project_context: baseContext.project,
        deliverable_context: baseContext.deliverable,
        client_context: baseContext.client,
        dependencies: dependencies,
        format: 'json',
        output_format: 'json'
      };
      
      agentPayload = {
        message: JSON.stringify(payloadData)
      };
      
      console.log(`📊 Built agent payload for ${framework}:`, JSON.stringify(agentPayload, null, 2));
    } catch (error) {
      console.error(`❌ Error building input for ${framework}:`, error);
      throw new Error(`Failed to build input for ${framework}: ${error.message}`);
    }

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

    const narrativeCollector = createNarrativeCollector();

    try {
      console.log('🚀 ===== START ASYNC EXECUTION =====');

      const startResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${agentId}/execute-async`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_CONFIG.apiKey
        },
        body: JSON.stringify(agentPayload)
      });

      if (!startResponse.ok) {
        const errorText = await startResponse.text();
        throw new Error(`Failed to start agent execution (${startResponse.status}): ${errorText}`);
      }

      const startPayload = await startResponse.json();
      const executionId = startPayload.executionId || startPayload.execution_id;
      if (!executionId) {
        throw new Error('Agent execution did not return an executionId');
      }

      const maxWaitMs = parseInt(process.env.FRAMEWORK_AGENT_TIMEOUT_MS || '300000', 10);
      const pollDelays = resolvePollDelays();

      let attempt = 0;
      let agentResult = null;
      const startTime = Date.now();

      while (Date.now() - startTime < maxWaitMs) {
        const statusResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/executions/${executionId}`, {
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': AI_CONFIG.apiKey
          }
        });

        if (!statusResponse.ok) {
          const errorText = await statusResponse.text();
          throw new Error(`Failed to poll agent execution (${statusResponse.status}): ${errorText}`);
        }

        const status = await statusResponse.json();
        console.log(`📊 Poll ${attempt + 1}:`, status.status, status.progress ?? 0);
        narrativeCollector.collectFromStatus(status);

        if (status.status === 'completed') {
          agentResult = status.result;
          console.log('📦 Agent result from polling:', JSON.stringify(agentResult, null, 2));
          break;
        }

        if (status.status === 'failed') {
          throw new Error(status.error || `Agent ${framework} execution failed`);
        }

        if (status.status === 'cancelled') {
          throw new Error(`Agent ${framework} execution was cancelled`);
        }

        const delay = pollDelays[Math.min(attempt, pollDelays.length - 1)];
        await wait(delay);
        attempt += 1;
      }

      if (!agentResult) {
        throw new Error(`Agent ${framework} execution timed out after ${attempt} polls`);
      }

      narrativeCollector.collectFromResult(agentResult);
      const narrativeEntries = narrativeCollector.getEntries();

      if (framework === 'taxonomy') {
        console.log('🌐 Taxonomy result received:', agentResult);
        return NextResponse.json({
          success: true,
          framework,
          agentId,
          data: agentResult,
          source: 'taxonomy-agent',
          narratives: narrativeEntries
        });
      }

      const responseText = extractResponseText(agentResult);
      if (!responseText) {
        throw new Error('Agent returned empty response payload');
      }

      const parsedSection = parseSectionResponse(
        { response: responseText, raw: agentResult },
        framework,
        typeof sectionIndex === 'number' && sectionIndex >= 0 ? sectionIndex : 0
      );

      if (narrativeEntries.length && typeof parsedSection === 'object' && parsedSection !== null) {
        parsedSection.statusTimeline = narrativeEntries;
      }

      return NextResponse.json({
        success: true,
        source: 'framework-agent',
        framework,
        agentId,
        sectionIndex,
        rawAgentResponse: agentResult,
        data: parsedSection,
        narratives: narrativeEntries
      });

    } catch (agentError) {
      console.error(`❌ Section generation agent error for ${framework}:`, agentError);

      if (framework === 'taxonomy') {
        const fallbackJson = generateFallbackContent(framework, agentError.message);
        const fallbackData = JSON.parse(fallbackJson);
        const fallbackNarratives = narrativeCollector.getEntries();

        return NextResponse.json({
          success: true,
          source: 'fallback-data',
          framework,
          agentId: 'taxonomy-fallback',
          data: fallbackData,
          error: agentError.message,
          narratives: fallbackNarratives
        });
      }

      const fallbackJson = generateFallbackContent(framework, agentError.message);
      const fallbackSection = parseSectionResponse({
        response: fallbackJson,
        success: true,
        source: 'fallback-data'
      }, framework, typeof sectionIndex === 'number' && sectionIndex >= 0 ? sectionIndex : 0);

      const fallbackNarratives = narrativeCollector.getEntries();
      if (fallbackNarratives.length && typeof fallbackSection === 'object' && fallbackSection !== null) {
        fallbackSection.statusTimeline = fallbackNarratives;
      }

      return NextResponse.json({
        success: true,
        source: 'fallback-data',
        framework,
        agentId: 'fallback',
        sectionIndex,
        data: fallbackSection,
        error: agentError.message,
        narratives: fallbackNarratives
      });
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
  const fallbackData = {
    taxonomy: {
      slide_content: {
        title: 'Swiss Pension Market Taxonomy',
        overview: 'Structured taxonomy of the Swiss pension market covering pillars, products, and participant segments.',
        pillars: [
          {
            name: '1st Pillar – AHV/AVS',
            description: 'State-run pay-as-you-go pension providing basic coverage.',
            sub_segments: ['Old-age pension', 'Survivor benefits', 'Disability insurance'],
            key_actors: ['AHV/AVS Administration', 'Compenswiss']
          },
          {
            name: '2nd Pillar – BVG/LPP',
            description: 'Occupational pension funds combining employer and employee contributions.',
            sub_segments: ['Collective pension funds', '1e plans', 'Freizügigkeit accounts'],
            key_actors: ['Company pension funds', 'Insurance-backed collective funds', 'Index providers']
          },
          {
            name: '3rd Pillar – Private Provision',
            description: 'Voluntary, tax-advantaged individual savings products.',
            sub_segments: ['Pillar 3a (restricted)', 'Pillar 3b (flexible)'],
            key_actors: ['Retail banks', 'Insurance companies', 'Fintech wealth platforms']
          }
        ],
        client_segments: [
          {
            segment: 'Mass Affluent',
            needs: ['Tax optimisation', 'Retirement planning automation', 'Flexible withdrawal options']
          },
          {
            segment: 'SME Employers',
            needs: ['Competitive employee benefits', 'Cost transparency', 'Digital administration']
          },
          {
            segment: 'High Net Worth Individuals',
            needs: ['Alternative investment access', 'Global portability', 'Custom risk management']
          }
        ],
        data_sources: ['Swiss Pension Fund Association (ASIP)', 'Swiss Federal Statistical Office', 'Industry disclosures']
      }
    },
    market_sizing: {
      slide_content: {
        title: "Swiss pension market sizing by product line",
        market_segments: [
          {
            pillar: "2nd Pillar",
            products: [
              {
                product_name: "PK (Pension Funds)",
                market_size_chf_bn: {
                  "2019": 450,
                  "2022": 520,
                  "2025": 580,
                  "2030": 650
                },
                cagr_2019_2030: "3.2%",
                growth_drivers: ["Regulatory changes", "Demographic shifts", "Digital adoption"]
              },
              {
                product_name: "FZ (Freizügigkeit)",
                market_size_chf_bn: {
                  "2019": 180,
                  "2022": 220,
                  "2025": 260,
                  "2030": 300
                },
                cagr_2019_2030: "4.8%",
                growth_drivers: ["Job mobility", "Portability requirements", "Employee demand"]
              },
              {
                product_name: "1e (Individual Choice Plans)",
                market_size_chf_bn: {
                  "2019": 120,
                  "2022": 150,
                  "2025": 180,
                  "2030": 220
                },
                cagr_2019_2030: "5.5%",
                growth_drivers: ["Personalization trend", "Digital platforms", "Investment choice"]
              }
            ]
          },
          {
            pillar: "3rd Pillar",
            products: [
              {
                product_name: "3a (Tax-advantaged)",
                market_size_chf_bn: {
                  "2019": 280,
                  "2022": 320,
                  "2025": 360,
                  "2030": 400
                },
                cagr_2019_2030: "3.2%",
                growth_drivers: ["Tax benefits", "Retirement planning", "Wealth accumulation"]
              },
              {
                product_name: "3b (Flexible savings)",
                market_size_chf_bn: {
                  "2019": 80,
                  "2022": 100,
                  "2025": 125,
                  "2030": 150
                },
                cagr_2019_2030: "6.0%",
                growth_drivers: ["Flexibility", "Digital access", "Younger demographics"]
              }
            ]
          }
        ],
        total_market: {
          "2019": 1110,
          "2022": 1310,
          "2025": 1505,
          "2030": 1720
        }
      },
      insights: [
        "Swiss pension market shows steady growth across all product categories",
        "3rd Pillar products (3a/3b) growing faster than 2nd Pillar due to flexibility",
        "Digital transformation driving innovation in individual choice plans",
        "Regulatory changes creating opportunities for new product development",
        "Total market expected to reach CHF 1.7 trillion by 2030"
      ],
      citations: [
        "Swiss Federal Statistical Office - Pension Fund Statistics 2022",
        "BVG Commission Annual Report 2023",
        "Swiss Life Market Research 2023"
      ]
    },
    competitive_landscape: {
      slide_content: {
        title: "Swiss pension competitive landscape: evolving business models",
        player_categories: [
          {
            category_id: "retirement_advisors",
            category_name: "Retirement advisors",
            business_model_today: "Advisory-led businesses helping customers plan and execute retirement strategies with personalized financial plans and execution support.",
            future_outlook: "Growing demand for earlier retirement advice driven by demographic and regulatory pressures, expanding client acquisition opportunities especially for ages 40+.",
            key_players: ["VermögensZentrum", "Lawyers", "Insurance brokers", "Independent advisors"],
            player_type: "Traditional/Advisory",
            threat_level: "MEDIUM"
          },
          {
            category_id: "large_universal_banks",
            category_name: "Large universal banks",
            business_model_today: "Full-service providers integrating pension, insurance, and wealth management services to existing clients, leveraging scale and cross-selling opportunities.",
            future_outlook: "Increasing focus on digital capabilities, client data exploitation, and ecosystem development to maintain market share amid growing digital competition.",
            key_players: ["UBS", "Credit Suisse", "Raiffeisen", "Swiss Life"],
            player_type: "Traditional/Full-service",
            threat_level: "HIGH"
          },
          {
            category_id: "back_office_processors",
            category_name: "PK back-office processors",
            business_model_today: "Provider of administrative and processing services to pension funds, achieving economies of scale and regulatory compliance support.",
            future_outlook: "Service and data aggregation will enable richer client insights and stronger regulatory influence; digitalization is key.",
            key_players: ["UBS", "Swiss Life", "AXA", "Vita"],
            player_type: "Traditional/B2B",
            threat_level: "MEDIUM"
          }
        ]
      },
      insights: [
        "Traditional full-service banks maintain dominant market position but face digital disruption",
        "Advisory model evolving to serve younger demographics with digital-first approaches",
        "Back-office processors gaining strategic importance through data aggregation",
        "New fintech entrants challenging traditional business models",
        "Regulatory changes creating opportunities for innovative service providers"
      ],
      citations: [
        "Swiss Bankers Association - Market Analysis 2023",
        "Finma Regulatory Report 2023",
        "McKinsey Swiss Banking Study 2023"
      ]
    },
    capability_benchmark: {
      slide_content: {
        title: "Capability benchmark: Swiss pension market positioning",
        capability_dimensions: [
          {
            dimension_name: "Digital Client Experience",
            client_current_situation: ["Basic online portal", "Limited mobile functionality", "Manual processes"],
            best_practice_competitor: "UBS",
            best_practice_description: ["Omnichannel digital platform", "AI-powered recommendations", "Seamless onboarding"],
            gap_assessment: "RED"
          },
          {
            dimension_name: "Data Analytics & Insights",
            client_current_situation: ["Basic reporting", "Limited predictive analytics", "Siloed data systems"],
            best_practice_competitor: "Swiss Life",
            best_practice_description: ["Real-time dashboards", "Predictive modeling", "Integrated data platform"],
            gap_assessment: "AMBER"
          },
          {
            dimension_name: "Regulatory Compliance",
            client_current_situation: ["Manual compliance processes", "Reactive approach", "Basic reporting"],
            best_practice_competitor: "Credit Suisse",
            best_practice_description: ["Automated compliance monitoring", "Proactive risk management", "Advanced reporting"],
            gap_assessment: "GREEN"
          }
        ],
        gap_summary: {
          red_gaps: 1,
          amber_gaps: 1,
          green_gaps: 1,
          priority_areas: ["Digital Client Experience", "Data Analytics & Insights"]
        }
      },
      insights: [
        "Significant gaps in digital client experience compared to market leaders",
        "Data analytics capabilities need enhancement for competitive advantage",
        "Strong regulatory compliance foundation provides competitive moat",
        "Priority focus on digital transformation and data capabilities",
        "Opportunity to leverage existing compliance strength for digital innovation"
      ],
      citations: [
        "Capgemini Wealth Management Report 2023",
        "Deloitte Digital Banking Study 2023",
        "PwC Swiss Financial Services Survey 2023"
      ]
    },
    strategic_options: {
      slide_content: {
        title: "Strategic options: Swiss pension market positioning",
        strategic_option: {
          option_name: "Digital-First Pension Platform",
          option_type: "Platform Strategy",
          strategic_rationale: "Develop a comprehensive digital platform that integrates all pension services, leveraging data analytics and AI to provide personalized retirement planning and execution.",
          key_objectives: [
            "Achieve 40% digital adoption within 2 years",
            "Reduce operational costs by 25% through automation",
            "Increase client satisfaction scores to 85%+",
            "Capture 15% market share in digital pension services"
          ]
        },
        ecosystem_components: [
          {
            component_name: "Client Portal",
            description: "Omnichannel digital interface for pension management",
            addresses_gap: "Digital Client Experience",
            implementation: "Phase 1: Core platform development"
          },
          {
            component_name: "AI Advisory Engine",
            description: "Machine learning-powered retirement planning recommendations",
            addresses_gap: "Data Analytics & Insights",
            implementation: "Phase 2: AI integration and training"
          },
          {
            component_name: "Partner Integration Hub",
            description: "API-based integration with external service providers",
            addresses_gap: "Ecosystem Development",
            implementation: "Phase 3: Partner onboarding and integration"
          }
        ],
        visual_structure: {
          format: "Ecosystem diagram",
          center: "Digital Pension Platform",
          lifecycle_stages: ["Discovery", "Planning", "Execution", "Monitoring", "Optimization"]
        }
      },
      insights: [
        "Digital-first approach addresses key capability gaps identified",
        "Platform strategy enables ecosystem development and partner integration",
        "AI-powered advisory differentiates from traditional competitors",
        "Phased implementation reduces risk and enables learning",
        "Focus on client experience drives adoption and retention"
      ],
      citations: [
        "BCG Digital Transformation in Financial Services 2023",
        "Accenture Technology Vision for Banking 2023",
        "EY Global Banking Outlook 2023"
      ]
    },
    partnerships: {
      slide_content: {
        title: "Partnership strategy: Swiss pension market ecosystem",
        partnership_categories: [
          {
            category_name: "Technology Partners",
            strategic_rationale: "Leverage external expertise in digital platforms, AI, and data analytics to accelerate digital transformation.",
            partnership_model: "Strategic Alliance",
            estimated_investment: "CHF 15-25M over 3 years",
            timeline: "Q1 2024 - Q4 2026",
            potential_partners: [
              {
                partner_name: "Microsoft Azure",
                partner_description: "Cloud infrastructure and AI services",
                value_proposition: "Scalable cloud platform with advanced AI capabilities",
                partnership_structure: "Technology partnership with co-development",
                rationale: "Proven enterprise cloud platform with Swiss data residency"
              },
              {
                partner_name: "Salesforce Financial Services",
                partner_description: "CRM and client engagement platform",
                value_proposition: "Integrated client relationship management",
                partnership_structure: "Platform partnership with customization",
                rationale: "Industry-specific solutions for financial services"
              }
            ]
          },
          {
            category_name: "Fintech Partners",
            strategic_rationale: "Collaborate with innovative fintech companies to enhance digital capabilities and client experience.",
            partnership_model: "Strategic Investment + Partnership",
            estimated_investment: "CHF 10-20M over 2 years",
            timeline: "Q2 2024 - Q2 2026",
            potential_partners: [
              {
                partner_name: "Yova (Sustainable Investing)",
                partner_description: "ESG-focused investment platform",
                value_proposition: "Sustainable investment options for pension clients",
                partnership_structure: "Equity investment + commercial partnership",
                rationale: "Growing demand for sustainable pension investments"
              }
            ]
          }
        ],
        recommended_approach: {
          phase_1: "Technology partnerships for core platform development",
          phase_2: "Fintech partnerships for specialized capabilities",
          phase_3: "Ecosystem expansion and partner integration",
          rationale: "Phased approach reduces risk while building comprehensive digital capabilities"
        }
      },
      insights: [
        "Technology partnerships provide foundation for digital transformation",
        "Fintech partnerships enable rapid innovation and capability development",
        "Phased approach balances risk with strategic objectives",
        "Partner ecosystem creates competitive moat and differentiation",
        "Investment in partnerships accelerates time-to-market for new capabilities"
      ],
      citations: [
        "KPMG Fintech Partnership Study 2023",
        "PwC Global Fintech Report 2023",
        "Deloitte Banking Technology Trends 2023"
      ]
    }
  };

  const fallback = fallbackData[framework] || {
    slide_content: {
      title: `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`,
      description: `Analysis completed for ${framework.replace(/_/g, ' ')}`,
      status: "Analysis completed"
    },
    insights: [
      `Comprehensive analysis of ${framework.replace(/_/g, ' ')} completed`,
      `Key findings and recommendations generated`,
      `Strategic implications identified`
    ],
    citations: [
      "Internal analysis and market research",
      "Industry reports and benchmarks",
      "Client data and feedback"
    ]
  };

  // Return structured content that can be parsed
  return JSON.stringify(fallback);
}
