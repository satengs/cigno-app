/**
 * CFA-DEMO Data Transformer
 * Handles data handoffs between agents and input/output transformations
 */
export class CFADemoDataTransformer {
  
  // Build input for Market Sizing Agent (CFA-DEMO-1)
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