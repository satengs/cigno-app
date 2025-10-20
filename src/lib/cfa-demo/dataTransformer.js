/**
 * CFA-DEMO Data Transformer
 * Handles data handoffs between agents and input/output transformations
 */
export class CFADemoDataTransformer {
  
  // Generic method to build input for any framework
  buildFrameworkInput(framework, projectInput, dependencies = {}) {
    console.log(`🔧 Building input for framework: ${framework}`);
    console.log(`📋 Project input:`, projectInput);
    console.log(`🔗 Dependencies:`, Object.keys(dependencies));
    
    // Stringify all data into message field
    const payloadData = {
      project_context: {
        name: projectInput.projectName || "Strategic Analysis",
        client_name: projectInput.clientName || "Client",
        id: projectInput.projectId || "project-1",
        geography: projectInput.geography || "Global"
      },
      deliverable_context: {
        brief: projectInput.deliverableBrief || "Strategic analysis and recommendations",
        type: "Strategy Presentation",
        audience: ["Business Stakeholders"]
      },
      client_context: {
        name: projectInput.clientName || "Client",
        geography: projectInput.geography || "Global",
        industry: [projectInput.industry || "Financial Services"]
      },
      dependencies: dependencies,
      format: 'json',
      output_format: 'json'
    };
    
    const baseInput = {
      message: JSON.stringify(payloadData)
    };
    
    return baseInput;
  }
  
  getAgentIdForFramework(framework) {
    const agentMapping = {
      'market_sizing': '68f3a191dfc921b68ec3e83a',
      'competitive_landscape': '68f3a9a5dfc921b68ec3e959',
      'key_industry_trends': '68f3f71fdfc921b68ec3ea8d',
      'capabilities_assessment': '68f3f817dfc921b68ec3ea8e',
      'competitor_deep_dive': '68f4a393dfc921b68ec3ec36',
      'strategic_options': '68f4a655dfc921b68ec3ec37',
      'deep_dive_strategic_option': '68f4a8dfdfc921b68ec3ec38',
      'buy_vs_build': '68f4ae2fdfc921b68ec3ec39',
      'product_roadmap': '68f4b112dfc921b68ec3ec3a'
    };
    return agentMapping[framework] || 'unknown';
  }
  
  getSlideNumberForFramework(framework) {
    const slideNumbers = {
      'market_sizing': 1,
      'competitive_landscape': 2,
      'key_industry_trends': 3,
      'capabilities_assessment': 4,
      'competitor_deep_dive': 5,
      'strategic_options': 6,
      'deep_dive_strategic_option': 7,
      'buy_vs_build': 8,
      'product_roadmap': 9
    };
    return slideNumbers[framework] || 1;
  }
  
  getFrameworkDisplayName(framework) {
    const displayNames = {
      'market_sizing': 'Market Sizing Analysis',
      'competitive_landscape': 'Competitive Landscape',
      'key_industry_trends': 'Key Industry Trends',
      'capabilities_assessment': 'Capabilities Assessment',
      'competitor_deep_dive': 'Competitor Deep Dive',
      'strategic_options': 'Strategic Options',
      'deep_dive_strategic_option': 'Deep Dive Strategic Option',
      'buy_vs_build': 'Buy vs Build Analysis',
      'product_roadmap': 'Product Roadmap'
    };
    return displayNames[framework] || framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }
  
  getFrameworkTitle(framework, projectInput) {
    const titles = {
      'market_sizing': `${projectInput.clientName || 'Client'} Market Sizing Analysis`,
      'competitive_landscape': `${projectInput.clientName || 'Client'} Competitive Landscape`,
      'key_industry_trends': `Key ${projectInput.industry || 'Industry'} Trends`,
      'capabilities_assessment': `${projectInput.clientName || 'Client'} Capabilities Assessment`,
      'competitor_deep_dive': `${projectInput.clientName || 'Client'} Competitor Deep Dive`,
      'strategic_options': `${projectInput.clientName || 'Client'} Strategic Options`,
      'deep_dive_strategic_option': `${projectInput.clientName || 'Client'} Strategic Option Deep Dive`,
      'buy_vs_build': `${projectInput.clientName || 'Client'} Buy vs Build Analysis`,
      'product_roadmap': `${projectInput.clientName || 'Client'} Product Roadmap`
    };
    return titles[framework] || `${framework.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} Analysis`;
  }
  
  getFrameworkSlots(framework) {
    // Define slots for each framework
    const frameworkSlots = {
      'market_sizing': [
        {
          slot_id: "market_segments",
          slot_name: "Market Segments",
          slot_type: "table",
          required: true,
          description: "Market size breakdown by segments with historical and forecast data"
        },
        {
          slot_id: "total_market",
          slot_name: "Total Market Size",
          slot_type: "number",
          required: true,
          description: "Aggregate market size across all segments"
        },
        {
          slot_id: "insights",
          slot_name: "Key Insights",
          slot_type: "list",
          required: true,
          description: "3-5 key insights about market trends and growth drivers"
        }
      ],
      'competitive_landscape': [
        {
          slot_id: "competitors",
          slot_name: "Key Competitors",
          slot_type: "table",
          required: true,
          description: "Analysis of key competitors and their positioning"
        },
        {
          slot_id: "positioning",
          slot_name: "Market Positioning",
          slot_type: "chart",
          required: true,
          description: "Visual representation of competitive positioning"
        },
        {
          slot_id: "insights",
          slot_name: "Competitive Insights",
          slot_type: "list",
          required: true,
          description: "Key insights about competitive dynamics"
        }
      ],
      'key_industry_trends': [
        {
          slot_id: "trends",
          slot_name: "Industry Trends",
          slot_type: "list",
          required: true,
          description: "Key industry trends and their implications"
        },
        {
          slot_id: "timeline",
          slot_name: "Trend Timeline",
          slot_type: "timeline",
          required: true,
          description: "Timeline of trend development and future projections"
        },
        {
          slot_id: "insights",
          slot_name: "Trend Insights",
          slot_type: "list",
          required: true,
          description: "Strategic implications of industry trends"
        }
      ],
      'capabilities_assessment': [
        {
          slot_id: "capabilities",
          slot_name: "Current Capabilities",
          slot_type: "table",
          required: true,
          description: "Assessment of current organizational capabilities"
        },
        {
          slot_id: "gaps",
          slot_name: "Capability Gaps",
          slot_type: "list",
          required: true,
          description: "Identified gaps in capabilities"
        },
        {
          slot_id: "insights",
          slot_name: "Capability Insights",
          slot_type: "list",
          required: true,
          description: "Key insights about capability strengths and weaknesses"
        }
      ],
      'competitor_deep_dive': [
        {
          slot_id: "competitor_profile",
          slot_name: "Competitor Profile",
          slot_type: "table",
          required: true,
          description: "Detailed profile of selected competitor"
        },
        {
          slot_id: "best_practices",
          slot_name: "Best Practices",
          slot_type: "list",
          required: true,
          description: "Best practices identified from competitor analysis"
        },
        {
          slot_id: "insights",
          slot_name: "Competitor Insights",
          slot_type: "list",
          required: true,
          description: "Key insights and learnings from competitor analysis"
        }
      ],
      'strategic_options': [
        {
          slot_id: "options",
          slot_name: "Strategic Options",
          slot_type: "table",
          required: true,
          description: "Evaluation of strategic options with pros/cons"
        },
        {
          slot_id: "recommendation",
          slot_name: "Recommended Option",
          slot_type: "text",
          required: true,
          description: "Recommended strategic option with rationale"
        },
        {
          slot_id: "insights",
          slot_name: "Strategic Insights",
          slot_type: "list",
          required: true,
          description: "Key insights about strategic options and recommendations"
        }
      ],
      'deep_dive_strategic_option': [
        {
          slot_id: "detailed_analysis",
          slot_name: "Detailed Analysis",
          slot_type: "text",
          required: true,
          description: "Detailed analysis of the selected strategic option"
        },
        {
          slot_id: "implementation",
          slot_name: "Implementation Plan",
          slot_type: "list",
          required: true,
          description: "Step-by-step implementation plan"
        },
        {
          slot_id: "insights",
          slot_name: "Deep Dive Insights",
          slot_type: "list",
          required: true,
          description: "Detailed insights and recommendations"
        }
      ],
      'buy_vs_build': [
        {
          slot_id: "analysis",
          slot_name: "Buy vs Build Analysis",
          slot_type: "table",
          required: true,
          description: "Comparative analysis of buy vs build options"
        },
        {
          slot_id: "recommendation",
          slot_name: "Recommendation",
          slot_type: "text",
          required: true,
          description: "Recommended approach with rationale"
        },
        {
          slot_id: "insights",
          slot_name: "Buy vs Build Insights",
          slot_type: "list",
          required: true,
          description: "Key insights about sourcing decisions"
        }
      ],
      'product_roadmap': [
        {
          slot_id: "roadmap",
          slot_name: "Product Roadmap",
          slot_type: "timeline",
          required: true,
          description: "Detailed product roadmap with phases and milestones"
        },
        {
          slot_id: "priorities",
          slot_name: "Priorities",
          slot_type: "list",
          required: true,
          description: "Prioritized list of initiatives and features"
        },
        {
          slot_id: "insights",
          slot_name: "Roadmap Insights",
          slot_type: "list",
          required: true,
          description: "Key insights about product development strategy"
        }
      ]
    };
    
    return frameworkSlots[framework] || [
      {
        slot_id: "content",
        slot_name: "Content",
        slot_type: "text",
        required: true,
        description: "Framework-specific content and analysis"
      },
      {
        slot_id: "insights",
        slot_name: "Key Insights",
        slot_type: "list",
        required: true,
        description: "Key insights and recommendations"
      }
    ];
  }
  
  // Build input for Market Sizing Agent (CFA-DEMO-1) - Legacy method
  buildMarketSizingInput(projectInput) {
    const input = {
      task_id: "task_slide1_market_sizing",
      agent_id: "68f229005e8b5435150c2991",
      slide: {
        slide_number: 1,
        framework_id: "market_sizing_by_product",
        framework_name: "Market Sizing by Product",
        title: "Swiss pension market size by product line",
        slots: [
          {
            slot_id: "market_segments",
            slot_name: "Market Segments by Product",
            slot_type: "table",
            required: true,
            description: "Market size breakdown by Pillar 2 (PK, FZ, 1e) and Pillar 3 (3a, 3b) products with historical and forecast data"
          },
          {
            slot_id: "total_market",
            slot_name: "Total Market Size",
            slot_type: "number",
            required: true,
            description: "Aggregate Swiss pension market size across all products"
          },
          {
            slot_id: "insights",
            slot_name: "Key Insights",
            slot_type: "list",
            required: true,
            description: "3-5 key insights about market trends, growth drivers, and implications"
          }
        ]
      },
      project: {
        project_name: projectInput.project?.name || "New Pension Strategy",
        client_name: projectInput.client?.name || "UBS",
        client_industry: ["Wealth Management", "Retail Banking"],
        geography: "Switzerland",
        sector: "Pension / Vorsorge",
        project_type: "Strategy"
      },
      brief_context: {
        brief_summary: projectInput.deliverable?.brief || "Define a new product strategy for UBS Switzerland's retirement offering including market sizing, competitive analysis, capability gaps, and strategic recommendations.",
        key_topics: ["market sizing", "pension products", "Switzerland", "Pillar 2", "Pillar 3"],
        time_horizon: "2019-2030",
        expected_outputs: ["market size by product", "growth trends", "strategic implications"]
      },
      data_sources: {
        knowledge_bases: [
          {
            kb_id: "68dbb18b69a8c6e904fb940d",
            kb_type: "url_index",
            description: "Reputable source URLs (Swisscanto, BSV, ASIP, etc.)"
          },
          {
            kb_id: "68ee09bb3336fc38f961c113",
            kb_type: "document_index",
            description: "Hosted documents (reports, studies, annual reports)"
          }
        ],
        search_priority: ["knowledge_base", "web_search"],
        min_search_attempts: 3,
        max_search_attempts: 13
      },
      validation_rules: [
        {
          rule_id: "product_coverage",
          rule_type: "completeness",
          parameters: {
            required_products: ["PK", "FZ", "1e", "3a", "3b"],
            min_coverage: 0.8
          }
        },
        {
          rule_id: "time_series",
          rule_type: "format",
          parameters: {
            required_years: [2019, 2022, 2025, 2030],
            mark_forecasts: true
          }
        },
        {
          rule_id: "citations_required",
          rule_type: "citation",
          parameters: {
            min_citations: 3,
            citation_quality_min: 0.6
          }
        }
      ],
      token_budget: 12000,
      current_date: "2025-01-15"
    };

    return {
      message: JSON.stringify(input),
      context: this.sanitizeContext(input),
      data: input
    };
  }

  // Build input for Competitive Landscape Agent (CFA-DEMO-2)
  buildCompetitiveLandscapeInput(projectInput) {
    const input = {
      task_id: "task_slide2_competitive_landscape",
      agent_id: "68f22dc0330210e8b8f60a43",
      slide: {
        slide_number: 2,
        framework_id: "competitive_landscape_qualitative",
        framework_name: "Qualitative Assessment of Competitive Landscape",
        title: "Swiss pension competitive landscape: evolving business models",
        slots: [
          {
            slot_id: "player_categories",
            slot_name: "Competitive Player Categories",
            slot_type: "matrix",
            required: true,
            description: "Classification of Swiss pension market players by business model type, including current model, future outlook, and named examples"
          },
          {
            slot_id: "insights",
            slot_name: "Competitive Insights",
            slot_type: "list",
            required: true,
            description: "4-6 key insights about competitive dynamics, threats, and opportunities"
          }
        ]
      },
      project: {
        project_name: "New Pension Strategy",
        client_name: "UBS",
        client_industry: ["Wealth Management", "Retail Banking"],
        geography: "Switzerland",
        sector: "Pension / Vorsorge",
        project_type: "Strategy"
      },
      brief_context: {
        brief_summary: "Analyze the Swiss pension competitive environment to understand key players, business models, and future market dynamics for UBS strategy development.",
        key_topics: ["competitive landscape", "business models", "traditional vs digital players", "market positioning", "Switzerland pension"],
        expected_outputs: ["player categorization", "business model analysis", "future outlook", "competitive threats"]
      },
      data_sources: {
        knowledge_bases: [
          {
            kb_id: "68dbb18b69a8c6e904fb940d",
            kb_type: "url_index",
            description: "Reputable source URLs (fintech news, company websites, industry reports)"
          },
          {
            kb_id: "68ee09bb3336fc38f961c113",
            kb_type: "document_index",
            description: "Hosted documents (market analyses, competitor reports)"
          }
        ],
        search_priority: ["knowledge_base", "web_search"],
        min_search_attempts: 3,
        max_search_attempts: 13
      },
      validation_rules: [
        {
          rule_id: "category_coverage",
          rule_type: "completeness",
          parameters: {
            min_categories: 5,
            required_types: ["traditional", "digital"]
          }
        },
        {
          rule_id: "player_examples",
          rule_type: "presence",
          parameters: {
            min_players_per_category: 2,
            must_include_client: true
          }
        },
        {
          rule_id: "citations_required",
          rule_type: "citation",
          parameters: {
            min_citations: 3,
            citation_quality_min: 0.6
          }
        }
      ],
      token_budget: 12000,
      current_date: "2025-01-15"
    };

    return {
      message: JSON.stringify(input),
      context: this.sanitizeContext(input),
      data: input
    };
  }

  // Build input for Capability Benchmark Agent (CFA-DEMO-3)
  buildCapabilityBenchmarkInput(projectInput, dependencies = {}) {
    // Extract best-in-class competitors from CFA-DEMO-2 output
    const competitiveData = dependencies.competitive_landscape;
    const bestCompetitors = this.extractBestInClassCompetitors(competitiveData);

    const input = {
      task_id: "task_slide3_capability_benchmark",
      agent_id: "68f22f36330210e8b8f60a51",
      slide: {
        slide_number: 3,
        framework_id: "capability_benchmark",
        title: "Capability gaps: UBS vs best-in-class competitors",
        slots: [
          {
            slot_id: "capability_dimensions",
            slot_name: "Capability Dimensions",
            required: true,
            description: "Assess 3 key capabilities: Advisor capacity, Technology, Marketing. Rate each as RED/AMBER/GREEN."
          },
          {
            slot_id: "insights",
            slot_name: "Key Insights",
            required: true,
            description: "3-4 insights about critical gaps"
          }
        ]
      },
      project: {
        client_name: "UBS",
        geography: "Switzerland",
        sector: "Pension"
      },
      brief_context: {
        brief_summary: "Compare UBS pension capabilities vs top competitors. Focus on 3 dimensions only: advisors, technology, marketing.",
        key_topics: ["capability gaps", "benchmarking", "UBS vs competitors"]
      },
      dependencies: {
        competitors: bestCompetitors
      },
      pre_filled_data: {
        ubs_current_state: {
          advisors: "~25 pension specialists",
          technology: "Legacy systems, limited mobile",
          marketing: "CHF ~23M total marketing budget (2019)"
        },
        competitor_benchmarks: {
          VermögensZentrum: "160 pension specialists with 6-week training program",
          VIAC: "Modern tech stack, mobile-first platform, CHF 1.5bn AUM",
          frankly: "CHF ~2.2M pension marketing spend since 2020 launch"
        }
      },
      instructions: {
        assess_only_3_dimensions: [
          "Advisor capacity (UBS vs VermögensZentrum)",
          "Technology (UBS vs VIAC)",
          "Marketing (UBS vs frankly)"
        ],
        gap_ratings: {
          RED: "Major gap, >2x disadvantage",
          AMBER: "Observable gap",
          GREEN: "Competitive"
        },
        max_searches: 5,
        use_pre_filled_data: "You have pre_filled_data above. Search only if you need additional details."
      },
      data_sources: {
        knowledge_bases: [
          {
            kb_id: "68dbb18b69a8c6e904fb940d"
          },
          {
            kb_id: "68ee09bb3336fc38f961c113"
          }
        ],
        max_search_attempts: 5
      },
      token_budget: 8000
    };

    return {
      message: JSON.stringify(input),
      context: this.sanitizeContext(input),
      data: input
    };
  }

  // Build input for Strategic Options Agent (CFA-DEMO-4)
  buildStrategicOptionsInput(projectInput, dependencies = {}) {
    const marketData = dependencies.market_sizing;
    const competitiveData = dependencies.competitive_landscape;
    const capabilityData = dependencies.capability_benchmark;

    // Extract key insights from dependencies
    const synthesizedData = this.synthesizeStrategicInputs(marketData, competitiveData, capabilityData);

    const input = {
      task_id: "task_slide4_strategic_options",
      agent_id: "68f23ae07e8d5848f940482d",
      slide: {
        slide_number: 4,
        framework_id: "strategic_option_deep_dive",
        title: "Suggested solution: External retirement ecosystem strategy",
        slots: [
          {
            slot_id: "strategic_option",
            slot_name: "Strategic Option",
            required: true,
            description: "Define the ecosystem strategy with rationale and key objectives"
          },
          {
            slot_id: "ecosystem_components",
            slot_name: "Ecosystem Components",
            required: true,
            description: "7 components of the retirement ecosystem"
          },
          {
            slot_id: "insights",
            slot_name: "Key Insights",
            required: true,
            description: "4-6 insights about why this strategy addresses gaps"
          }
        ]
      },
      project: {
        client_name: "UBS",
        geography: "Switzerland",
        sector: "Pension"
      },
      brief_context: {
        brief_summary: "Recommend an ecosystem strategy for UBS that addresses capability gaps through partnerships rather than full build.",
        strategic_direction: "Client-centric retirement ecosystem with state-of-the-art data aggregation"
      },
      dependencies: {
        from_slides: [1, 2, 3],
        key_insights: synthesizedData
      },
      pre_filled_strategy: {
        option_name: "Client-centric retirement ecosystem",
        option_type: "Ecosystem/Platform strategy",
        strategic_rationale: "Address capability gaps through partnerships; respond to ecosystem player threat; leverage UBS brand while partnering for weaknesses",
        required_components: [
          "Data aggregation",
          "Retirement planning (AI-enabled)",
          "Insurance (via 3rd parties)",
          "Reporting (360° view)",
          "Tax advisory (partner network)",
          "Investment strategy adjustments",
          "Post-retirement activities"
        ]
      },
      instructions: {
        your_task: "Expand on the pre_filled_strategy above. For each of the 7 ecosystem components, describe: what it does, which gap it addresses, how to implement (build vs partner).",
        gap_mapping: {
          data_aggregation: "addresses technology gap",
          retirement_planning: "addresses advisor capacity + technology gap",
          insurance: "addresses product range gap",
          reporting: "addresses marketing/engagement gap",
          tax_advisory: "addresses service completeness",
          investment_strategy: "addresses product innovation gap",
          post_retirement: "addresses advisor capacity + service differentiation"
        },
        max_searches: 5,
        focus: "Use dependencies data. Search only for ecosystem platform examples or partnership models if needed."
      },
      data_sources: {
        knowledge_bases: [
          {
            kb_id: "68dbb18b69a8c6e904fb940d"
          },
          {
            kb_id: "68ee09bb3336fc38f961c113"
          }
        ],
        max_search_attempts: 5
      },
      token_budget: 8000
    };

    return {
      message: JSON.stringify(input),
      context: this.sanitizeContext(input),
      data: input
    };
  }

  // Build input for Partnership Strategy Agent (CFA-DEMO-5)
  buildPartnershipInput(projectInput, dependencies = {}) {
    const strategicData = dependencies.strategic_options;
    const ecosystemComponents = this.extractEcosystemComponents(strategicData);

    const input = {
      task_id: "task_slide5_partnership_strategy",
      agent_id: "68f23be77e8d5848f9404847",
      slide: {
        slide_number: 5,
        framework_id: "partnership_strategy",
        title: "Partnership options to accelerate ecosystem implementation",
        slots: [
          {
            slot_id: "partnership_categories",
            slot_name: "Partnership Categories",
            required: true,
            description: "3 partnership types: Digital advisory, Advisory referral, Processing. Each with potential partners and structure."
          },
          {
            slot_id: "recommended_approach",
            slot_name: "Recommended Phased Approach",
            required: true,
            description: "3-phase implementation plan with timeline and investment"
          },
          {
            slot_id: "insights",
            slot_name: "Key Insights",
            required: true,
            description: "4-6 insights about partnership strategy"
          }
        ]
      },
      project: {
        client_name: "UBS",
        geography: "Switzerland",
        sector: "Pension"
      },
      brief_context: {
        brief_summary: "Identify specific partnership opportunities to implement the ecosystem strategy quickly and cost-effectively."
      },
      dependencies: {
        from_slide: 4,
        ecosystem_components: ecosystemComponents
      },
      pre_filled_partnerships: {
        digital_advisory_partners: [
          {
            partner: "VIAC",
            capability: "Digital 3a/vested benefits platform, CHF 1.5bn AUM",
            partnership_type: "Equity investment (10-15%) + white-label"
          },
          {
            partner: "Selma",
            capability: "AI-driven investment advisor, retirement planning",
            partnership_type: "Technology licensing + co-branding"
          }
        ],
        advisory_referral_partners: [
          {
            partner: "VermögensZentrum",
            capability: "160 retirement specialists, 100k+ clients",
            partnership_type: "Referral agreement + revenue share"
          }
        ],
        processing_partners: [
          {
            partner: "AXA (PK processing unit)",
            capability: "Major PK processor with significant market share",
            partnership_type: "JV (50-50) or acquisition"
          }
        ]
      },
      instructions: {
        your_task: "For each partnership category (Digital advisory, Advisory referral, Processing), describe: strategic rationale, current situation, partnership model, potential partners (use pre_filled_partnerships), estimated investment, timeline.",
        partnership_categories_to_cover: [
          "Digital advisory (addresses technology + product gaps)",
          "Advisory referral (addresses advisor capacity gap)",
          "Processing (addresses data aggregation foundation)"
        ],
        phased_approach: {
          phase_1: "Digital advisory partnerships (12 months, CHF 10-20M)",
          phase_2: "Advisory referral partnerships (6 months, CHF 1M)",
          phase_3: "Evaluate processing M&A (18-24 months, CHF 50-150M)"
        },
        max_searches: 5,
        focus: "Use pre_filled_partnerships. Search only for partnership valuations, structures, or recent fintech deals if needed."
      },
      data_sources: {
        knowledge_bases: [
          {
            kb_id: "68dbb18b69a8c6e904fb940d"
          },
          {
            kb_id: "68ee09bb3336fc38f961c113"
          }
        ],
        max_search_attempts: 5
      },
      token_budget: 8000
    };

    return {
      message: JSON.stringify(input),
      context: this.sanitizeContext(input),
      data: input
    };
  }

  // Helper methods for data extraction and transformation

  extractBestInClassCompetitors(competitiveData) {
    if (!competitiveData?.slide_content?.player_categories) {
      return {
        best_for_advisors: "VermögensZentrum",
        best_for_technology: "VIAC",
        best_for_marketing: "frankly"
      };
    }

    const categories = competitiveData.slide_content.player_categories;
    const bestCompetitors = {};

    // Extract best competitors from competitive analysis
    categories.forEach(category => {
      if (category.category_id === 'retirement_advisors') {
        bestCompetitors.best_for_advisors = category.key_players?.[0] || "VermögensZentrum";
      }
      if (category.category_id === 'niche_disruptors') {
        bestCompetitors.best_for_technology = category.key_players?.[1] || "VIAC"; // VIAC typically second in list
      }
      if (category.category_id === 'niche_disruptors') {
        bestCompetitors.best_for_marketing = category.key_players?.[0] || "frankly"; // frankly typically first
      }
    });

    return bestCompetitors;
  }

  synthesizeStrategicInputs(marketData, competitiveData, capabilityData) {
    return {
      market_sizing: marketData?.insights || [
        "Pillar 3a growing fastest at 5.0% CAGR",
        "Total market CHF 1,700bn by 2030",
        "Digital products capturing younger segments"
      ],
      competitive_landscape: competitiveData?.insights || [
        "Digital disruptors (VIAC, frankly) gaining traction",
        "Ecosystem platforms (FINWELL, Hypothekey) emerging as threat",
        "UBS faces pressure in digital UX, data aggregation, and advisory"
      ],
      capability_gaps: capabilityData?.insights || [
        "RED: Advisor capacity (25 vs VZ 160)",
        "RED: Technology (legacy vs VIAC modern)",
        "RED: Marketing (unfocused vs targeted)"
      ]
    };
  }

  extractEcosystemComponents(strategicData) {
    if (!strategicData?.slide_content?.ecosystem_components) {
      return [
        "Data aggregation",
        "Retirement planning (AI-enabled)",
        "Insurance (via 3rd parties)",
        "Reporting (360° view)",
        "Tax advisory",
        "Investment strategy adjustments",
        "Post-retirement activities"
      ];
    }

    return strategicData.slide_content.ecosystem_components.map(component => 
      component.component_name || component.name
    );
  }

  extractChartData(agentResult) {
    // Extract chart-ready data from agent results
    if (!agentResult?.slide_content) return null;

    const slideContent = agentResult.slide_content;
    
    // Market sizing chart data
    if (slideContent.market_segments) {
      return {
        type: 'market_sizing',
        segments: slideContent.market_segments,
        total: slideContent.total_market
      };
    }

    // Competitive landscape chart data
    if (slideContent.player_categories) {
      return {
        type: 'competitive_matrix',
        categories: slideContent.player_categories
      };
    }

    // Capability benchmark chart data
    if (slideContent.capability_dimensions) {
      return {
        type: 'capability_gaps',
        dimensions: slideContent.capability_dimensions
      };
    }

    return null;
  }

  extractKeyPoints(agentResult) {
    // Extract key points for slide bullets
    if (agentResult?.insights) {
      return agentResult.insights.slice(0, 4); // Max 4 key points per slide
    }
    
    return [`Analysis completed by ${agentResult?.agent_name || 'AI Agent'}`];
  }

  sanitizeContext(data) {
    // Remove sensitive or large data from context
    const sanitized = { ...data };
    
    // Remove large data structures
    delete sanitized.data_sources;
    delete sanitized.validation_rules;
    delete sanitized.pre_filled_data;
    delete sanitized.pre_filled_partnerships;
    
    return sanitized;
  }
}