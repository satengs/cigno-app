/**
 * CFA-DEMO Fallback Data Provider
 * Contains high-quality fallback data extracted from the MD files
 * Used when agents fail to provide responses
 */
export class CFADemoFallbacks {
  
  getFallbackData(agentId) {
    const fallbacks = {
      '68f229005e8b5435150c2991': this.getMarketSizingFallback(),
      '68f22dc0330210e8b8f60a43': this.getCompetitiveLandscapeFallback(),
      '68f22f36330210e8b8f60a51': this.getCapabilityBenchmarkFallback(),
      '68f23ae07e8d5848f940482d': this.getStrategicOptionsFallback(),
      '68f23be77e8d5848f9404847': this.getPartnershipStrategyFallback()
    };
    
    return fallbacks[agentId] || this.getGenericFallback(agentId);
  }

  getMarketSizingFallback() {
    return {
      slide_content: {
        title: "Swiss pension market sizing by product line",
        market_segments: [
          {
            pillar: "2nd Pillar",
            products: [
              {
                product_name: "PK (Pension Funds)",
                market_size_chf_bn: {
                  "2019": 777,
                  "2022": 876,
                  "2025": 920,
                  "2030": 1050
                },
                cagr_2019_2030: "2.5%",
                growth_drivers: [
                  "Combined employer and employee contributions",
                  "Investment performance",
                  "Demographic trends increasing pension assets",
                  "Voluntary additional contributions"
                ]
              },
              {
                product_name: "FZ (Freizügigkeit)",
                market_size_chf_bn: {
                  "2019": 150,
                  "2022": 180,
                  "2025": 210,
                  "2030": 270
                },
                cagr_2019_2030: "4.0%",
                growth_drivers: [
                  "Increased job mobility",
                  "Transfers of vested benefits between pension funds",
                  "Growing awareness of portability benefits"
                ]
              },
              {
                product_name: "1e (Individual Choice Plans)",
                market_size_chf_bn: {
                  "2019": 30,
                  "2022": 40,
                  "2025": 50,
                  "2030": 70
                },
                cagr_2019_2030: "4.8%",
                growth_drivers: [
                  "Growing individual pension planning",
                  "Regulatory support for individual choice",
                  "Customization of pension products"
                ]
              }
            ]
          },
          {
            pillar: "3rd Pillar",
            products: [
              {
                product_name: "3a (Tax-advantaged)",
                market_size_chf_bn: {
                  "2019": 100,
                  "2022": 130,
                  "2025": 165,
                  "2030": 230
                },
                cagr_2019_2030: "5.0%",
                growth_drivers: [
                  "Strong tax incentives",
                  "Demographic trend towards voluntary savings",
                  "Investment strategies tailored to retirement horizons"
                ]
              },
              {
                product_name: "3b (Flexible savings)",
                market_size_chf_bn: {
                  "2019": 40,
                  "2022": 50,
                  "2025": 60,
                  "2030": 80
                },
                cagr_2019_2030: "3.5%",
                growth_drivers: [
                  "Flexibility of savings without tax restrictions",
                  "Increasing wealth and disposable income",
                  "Demand for non-regulated retirement products"
                ]
              }
            ]
          }
        ],
        total_market: {
          "2019": 1097,
          "2022": 1276,
          "2025": 1505,
          "2030": 1700
        }
      },
      insights: [
        "Pillar 3a shows the strongest growth at 5.0% CAGR driven by tax incentives and demographic trends towards voluntary savings.",
        "2nd Pillar products (PK, FZ, 1e) grow steadily with PK dominating the market size but facing regulatory and demographic pressure.",
        "FZ market expands due to increased job mobility and higher transfers of vested benefits.",
        "1e individual choice plans grow with rising demand for customizable pension solutions.",
        "Total Swiss pension capital expected to reach CHF 1,700 billion by 2030, reflecting steady growth across pillars."
      ],
      citations: [
        {
          source: "Swisscanto Pensionskassen-Monitor 2025",
          data_point: "PK market size and replacement rates 2019-2024",
          url: "document:bda560c50655cd6933d2db0f",
          page: "37-43"
        },
        {
          source: "McKinsey & Company 'Making up lost ground' Report, 2020",
          data_point: "Swiss pension market size, growth drivers, and challenges",
          url: "document:a49594a4a4020b44763b2a18",
          page: "7-24"
        },
        {
          source: "UBS House View Swiss Pensions 2025",
          data_point: "Pillar 3a investment recommendations and market insights",
          url: "document:7c04ecc21a19b2a56bb7a877",
          page: "1"
        }
      ],
      fallback: true,
      source: "cfa-demo-fallback"
    };
  }

  getCompetitiveLandscapeFallback() {
    return {
      slide_content: {
        title: "Swiss pension competitive landscape: evolving business models",
        player_categories: [
          {
            category_id: "retirement_advisors",
            category_name: "Retirement advisors",
            business_model_today: "Advisory-led businesses helping customers seek advice and locking them into a financial plan including execution",
            future_outlook: "Increasing pressure on the system likely to push the target age of retirement advice down to 40 y/o (currently 55+) resulting in increased client acquisition opportunity",
            key_players: ["VermögensZentrum", "Independent advisors", "Insurance brokers"],
            player_type: "Traditional/Advisory",
            threat_level: "MEDIUM"
          },
          {
            category_id: "large_universal_banks",
            category_name: "Large universal banks",
            business_model_today: "Core banking or insurance players already serving their existing client base with retirement data and services",
            future_outlook: "As retirement saving and planning increase in relevance, client acquisition, data exploitation and cross-selling become attractive, increasing activity by the large players",
            key_players: ["UBS", "SwissLife", "Raiffeisen", "Credit Suisse"],
            player_type: "Traditional/Full-service",
            threat_level: "HIGH"
          },
          {
            category_id: "back_office_processors",
            category_name: "PK back-office processors",
            business_model_today: "Processing facilities that combine economies of scale with tailored services for institutional clients",
            future_outlook: "Continuous aggregation of services and data will result in opportunities to leverage, collect more rich client data and increase weight versus regulators",
            key_players: ["UBS", "Swiss Life", "AXA", "Vita"],
            player_type: "Traditional/B2B",
            threat_level: "MEDIUM"
          },
          {
            category_id: "niche_disruptors",
            category_name: "Niche digital disruptors",
            business_model_today: "Digital offerings targeting specific areas of the retirement market, focused on younger and tech-savvy clients",
            future_outlook: "New business and pricing models will likely cause an overall decline in market revenues over time with Swiss regulatory complexity keeping barriers high for global players",
            key_players: ["frankly", "VIAC", "Selma"],
            player_type: "Digital/Niche",
            threat_level: "HIGH"
          },
          {
            category_id: "ecosystem_providers",
            category_name: "Ecosystem platform providers",
            business_model_today: "Digital platform providers enabling individuals and families to manage retirement, finances and health holistically",
            future_outlook: "High client convenience through holistic overview likely to gain traction with first successful retirement ecosystems being developed with traditional players support",
            key_players: ["FINWELL", "Hypothekey"],
            player_type: "Digital/Platform",
            threat_level: "MEDIUM-HIGH"
          },
          {
            category_id: "independent_specialists",
            category_name: "Independent pension specialists",
            business_model_today: "Highly personalized services providing one-to-one tailored solutions sourced from a suite of third parties",
            future_outlook: "Specialists are likely to procure increasingly digital service offerings to remain relevant for complex retirement advisory",
            key_players: ["Lawyers", "Insurance brokers", "Independent advisors"],
            player_type: "Traditional/Boutique",
            threat_level: "LOW"
          }
        ]
      },
      insights: [
        "The market shows clear bifurcation between traditional players like UBS and SwissLife, maintaining scale advantages, and digital disruptors such as VIAC and frankly capturing younger segments.",
        "Ecosystem platform providers are emerging as category creators, posing a threat to both traditional advisors and niche digital players by offering holistic client management.",
        "UBS faces competitive pressure in three dimensions: digital user experience (versus VIAC/frankly), data aggregation (versus back-office processors), and advisory services (versus independent specialists).",
        "The window for large banks to build or partner on digital capabilities is closing as fintech players gain traction in the Swiss pension market.",
        "Regulatory complexity in Switzerland remains a key barrier, protecting incumbents but limiting the pace and extent of innovation in the pension sector."
      ],
      citations: [
        "Swisscanto Pensionskassenstudie 2025 (document index)",
        "Swiss Life Annual Report 2024 (document index)",
        "Inside Paradeplatz articles on UBS pension asset management challenges and Swiss pension market dynamics",
        "Various fintech news and company websites indexed in knowledge base 68dbb18b69a8c6e904fb940d"
      ],
      fallback: true,
      source: "cfa-demo-fallback"
    };
  }

  getCapabilityBenchmarkFallback() {
    return {
      slide_content: {
        title: "Capability gaps: UBS vs best-in-class competitors",
        capability_dimensions: [
          {
            dimension_id: "advisor_capacity",
            dimension_name: "Advisor Capacity",
            client_current_situation: [
              "Approximately 25 pension specialists at UBS",
              "Limited specialized training programs publicly noted"
            ],
            gap_assessment: "RED",
            best_practice_competitor: "VermögensZentrum",
            best_practice_description: [
              "160 pension specialists with an internal trainee program including 6 weeks of training over 1 year",
              "Strong focus on specialist advisors providing deep retirement expertise"
            ],
            data_sources: [
              "Pre-filled client data",
              "Pre-filled competitor benchmark data"
            ]
          },
          {
            dimension_id: "technology",
            dimension_name: "Technology",
            client_current_situation: [
              "UBS operates with legacy systems and limited mobile capabilities",
              "No indication of recent significant technology investment in pension advisory"
            ],
            gap_assessment: "RED",
            best_practice_competitor: "VIAC",
            best_practice_description: [
              "Modern tech stack with a mobile-first platform",
              "CHF 1.5 billion assets under management (AUM) indicating scale and technology enablement"
            ],
            data_sources: [
              "Pre-filled client data",
              "Pre-filled competitor benchmark data",
              "Relevant documents indicating digitalization trends in Swiss pension market"
            ]
          },
          {
            dimension_id: "marketing",
            dimension_name: "Marketing",
            client_current_situation: [
              "UBS marketing budget approximately CHF 23 million (2019)",
              "No specialized branding or positioning as a retirement advisor noted"
            ],
            gap_assessment: "RED",
            best_practice_competitor: "frankly",
            best_practice_description: [
              "frankly has spent approximately CHF 2.2 million on pension marketing since its launch in 2020",
              "Focused and dedicated marketing spend on pension products"
            ],
            data_sources: [
              "Pre-filled client data",
              "Pre-filled competitor benchmark data"
            ]
          }
        ]
      },
      insights: [
        "UBS shows significant gaps in advisor capacity with only ~25 pension specialists versus VermögensZentrum's 160 specialists with structured training.",
        "Technology gap is material due to UBS's legacy systems and limited mobile capabilities compared to VIAC's modern, mobile-first platform managing CHF 1.5 billion AUM.",
        "Marketing spend and focus are substantially lower at UBS (CHF 23 million general marketing budget) compared to frankly's focused pension marketing spend of CHF 2.2 million since 2020 launch.",
        "All three dimensions assessed (advisor capacity, technology, marketing) show RED ratings indicating major competitive disadvantages requiring strategic investment."
      ],
      citations: [
        "Pre-filled data from client and competitors as provided in project inputs",
        "Documents from Swiss pension market knowledge bases highlighting digitalization and market trends (e.g., PwC survey on Swiss 1e pension market 2025, UBS International Pension Gap Index 2024)"
      ],
      fallback: true,
      source: "cfa-demo-fallback"
    };
  }

  getStrategicOptionsFallback() {
    return {
      slide_content: {
        title: "Suggested solution: External retirement ecosystem strategy",
        strategic_option: {
          option_name: "Client-centric retirement ecosystem",
          option_type: "Ecosystem/Platform",
          strategic_rationale: "In order to offer high client convenience through holistic overview as well as 3rd party offering in terms of pensions related services, a retirement ecosystem with state of the art data aggregation is the first logical step. This approach addresses UBS's critical capability gaps in technology, advisor capacity, and marketing by leveraging partnerships and existing platforms rather than building everything internally. It also pre-empts competitive threats from digital disruptors and ecosystem players by establishing a comprehensive platform that increases switching costs for clients.",
          key_objectives: [
            "Address critical capability gaps (technology, product innovation, advisor capacity) through partnerships rather than build",
            "Respond to competitive threat from ecosystem players (FINWELL, Hypothekey) and digital disruptors (VIAC, frankly)",
            "Leverage UBS's core strengths (brand, client base, wealth management capabilities) while partnering for weaknesses"
          ]
        },
        ecosystem_components: [
          {
            component_id: "data_aggregation",
            component_name: "Data aggregation",
            description: "Convenient overview of all client pension-related data from all three pillars, enabling informed retirement decisions.",
            addresses_gap: "Technology investment gap",
            implementation: "Partner with fintech data aggregator platforms that comply with open pension API standards (e.g., the SFTI OpenPK API), leveraging existing Swiss initiatives like EcoHub or BVG Exchange for standardized data integration and consent management."
          },
          {
            component_id: "retirement_planning",
            component_name: "Retirement planning (AI-enabled)",
            description: "AI-enabled retirement planning tool that helps clients plan retirement based on realistic goals, with on-demand contact with client advisors.",
            addresses_gap: "Advisor capacity + technology gap",
            implementation: "Build on existing UBS wealth management tools by integrating AI enhancements for personalized retirement planning, complemented by advisor support to manage limited advisor capacity."
          },
          {
            component_id: "insurance_3rd_parties",
            component_name: "Insurance (via 3rd parties)",
            description: "Offer clients a range of retirement and succession-related insurance products through third-party partnerships.",
            addresses_gap: "Product range gap",
            implementation: "Establish partnerships with insurance providers to offer white-label insurance products within the ecosystem, expanding product range without in-house development."
          },
          {
            component_id: "reporting_360",
            component_name: "Reporting (360° view)",
            description: "Comprehensive reporting including proactive simulations of clients' future retirement wealth and scenario analyses.",
            addresses_gap: "Marketing/client engagement gap",
            implementation: "Enhance UBS's existing reporting capabilities with retirement-specific views and proactive scenario simulations to engage clients and strengthen marketing efforts."
          },
          {
            component_id: "tax_advisory",
            component_name: "Tax advisory",
            description: "Provide access to tax advisory services both within UBS and via a vetted partner network to cover clients' tax planning needs related to retirement.",
            addresses_gap: "Service completeness",
            implementation: "Develop a partnership network of trusted tax advisors and integrate referral mechanisms within the ecosystem for seamless client access."
          },
          {
            component_id: "investment_strategy",
            component_name: "Investment strategy adjustments",
            description: "AI-driven recommendations for adjusting clients' asset allocation to align with evolving retirement goals.",
            addresses_gap: "Product innovation gap",
            implementation: "Deploy AI-driven portfolio optimization engines tailored for retirement planning, integrated with UBS's investment management capabilities."
          },
          {
            component_id: "post_retirement_activities",
            component_name: "Post-retirement activities",
            description: "Advisory services on philanthropy, consumption planning, and real estate matters such as downsizing or home equity release.",
            addresses_gap: "Advisor capacity + service differentiation",
            implementation: "Bundle advisory services through a partner network to provide differentiated and scalable post-retirement offerings."
          }
        ],
        visual_structure: {
          format: "Circular ecosystem diagram",
          center: "UBS Client",
          lifecycle_stages: [
            "Inheritance & tax planning",
            "Post retirement",
            "Addition investment strategy",
            "Potential divorce",
            "Retirement: between 2 & 3",
            "Retirement planning",
            "Reporting",
            "Data aggregation",
            "Tax advice",
            "Life and health insurance"
          ],
          partnerships_note: "Further client needs combined with retirement covered via selected partners"
        }
      },
      insights: [
        "Ecosystem strategy directly addresses all three RED gaps: technology (via data aggregation partnerships using existing Swiss open pension API standards), marketing (via enhanced reporting and client engagement), and advisor capacity (via AI tools and partner networks).",
        "Leverages UBS's strong brand, established wealth management client base, and investment expertise while outsourcing weaker capabilities to best-in-class partners.",
        "Pre-empts competitive threat from ecosystem players like FINWELL and Hypothekey by creating UBS's own comprehensive platform to retain high-value clients.",
        "Partnership-first approach enables faster time-to-market (12-18 months) and lower investment cost (~CHF 15-25M) compared to a full internal build (3-5 years, CHF 50M+).",
        "Seven ecosystem components provide end-to-end coverage across the retirement lifecycle, from data aggregation to post-retirement advisory.",
        "Creates a strong client retention moat as clients aggregate pension data on UBS's platform, increasing switching costs."
      ],
      success_factors: [
        "Select best-in-class partners especially for foundational data aggregation component to ensure seamless and secure data integration.",
        "Ensure a seamless and integrated user experience across all components to avoid a fragmented 'patchwork' feel.",
        "Launch initial components focused on data aggregation and retirement planning tools, then iteratively add other ecosystem services.",
        "Maintain UBS brand prominence throughout the ecosystem, using white-label partners where appropriate to preserve client trust.",
        "Build and retain in-house AI and analytics capabilities for competitive differentiation and ongoing innovation."
      ],
      alternatives_considered: [
        {
          option: "Full build (digital pension platform)",
          rejected_because: "Too slow (3-5 years), too expensive (CHF 50M+), and lacks UBS's digital product expertise."
        },
        {
          option: "Acquisition of fintech (VIAC or frankly)",
          rejected_because: "Cultural integration challenges, high acquisition premium, and limited synergy with core wealth management business."
        },
        {
          option: "Status quo + incremental improvements",
          rejected_because: "Insufficient to close critical capability gaps; risks ongoing market share loss to digital disruptors and ecosystem players."
        }
      ],
      citations: [
        {
          source: "Swiss FinTech Innovations (SFTI) Open Pension Position Paper, April 2024",
          details: "Describes open pension ecosystem building blocks including data aggregation platforms, governance models, and digital consent management. Highlights partnership and public-private partnership (PPP) approaches for platform implementation."
        },
        {
          source: "Swisscanto Pensionskassenstudie 2025",
          details: "Analyzes digitalization status of Swiss pension institutions, emphasizing potential in data exchange between pension funds and digital client access."
        },
        {
          source: "UBS internal research and strategic briefings",
          details: "Identifies UBS's capability gaps in advisor capacity, technology legacy, and marketing focus; competitive threats from digital disruptors and ecosystem players."
        }
      ],
      fallback: true,
      source: "cfa-demo-fallback"
    };
  }

  getPartnershipStrategyFallback() {
    return {
      slide_content: {
        title: "Partnership options to accelerate ecosystem implementation",
        partnership_categories: [
          {
            category_id: "digital_advisory",
            category_name: "Holistic digitally-enabled advisory",
            strategic_rationale: "Digital retirement & pension services contribute to client convenience and brand attractiveness particularly for younger clients with perceived retirement competence, and as such are seen by several of our strongest competitors as digital retirement & pension services",
            current_situation: [
              "In today's Swiss pension market, digital transformation is a top priority with growing adoption of digital self-service platforms by pension providers",
              "There is significant interest among banks, fintechs, and advisors to gain digital access to client pension data, supported by emerging API standards like SFTI's OpenPK",
              "However, the complexity of the Swiss pension landscape with many institutions and varying digital maturity poses challenges",
              "Digital 3a/vested benefits platforms like VIAC have proven customer acquisition and CHF 1.5bn AUM",
              "AI-driven advisory platforms like Selma offer sophisticated planning algorithms targeting underserved segments"
            ],
            partnership_model: "Equity investment (10-15%) + white-label partnership or technology licensing + co-branding",
            potential_partners: [
              {
                partner_name: "VIAC",
                partner_description: "Digital 3a/vested benefits platform with CHF 1.5bn assets under management",
                value_proposition: "Best-in-class digital user experience for 3a/FZ products and proven customer acquisition capability",
                partnership_structure: "Minority equity investment plus white-label/distribution partnership",
                rationale: "Addresses technology and product innovation gaps; brings digital-native capabilities"
              },
              {
                partner_name: "Selma",
                partner_description: "AI-driven investment advisor focused on retirement planning and underserved segments",
                value_proposition: "Advanced AI planning algorithms and strong brand presence among women and retirement clients",
                partnership_structure: "Technology licensing plus co-branding agreement",
                rationale: "Brings AI planning capabilities and helps alleviate advisor capacity constraints"
              }
            ],
            estimated_investment: "CHF 10-20M (equity and integration)",
            timeline: "12 months to full integration"
          },
          {
            category_id: "advisory_referral",
            category_name: "Advisory & expertise augmentation",
            strategic_rationale: "Swiss clients, especially UBS clients, require strong advisory capacity and marketing to enhance pension advisory, and partnerships with independent advisors can expand capacity without risking independence",
            current_situation: [
              "Independent advisory firms like VermögensZentrum have large retirement specialist teams (160 advisors) and substantial client bases (100k+)",
              "Referral agreements and revenue sharing models are typical to maintain independence and benefit both parties",
              "Such partnerships can quickly augment advisory capacity without requiring UBS to build out own large advisory teams"
            ],
            partnership_model: "Referral agreement plus revenue share",
            potential_partners: [
              {
                partner_name: "VermögensZentrum",
                partner_description: "Leading independent financial advisor with 160 retirement specialists and 100,000+ clients",
                value_proposition: "Immediate access to deep retirement advisory expertise and significant client acquisition capacity",
                partnership_structure: "Referral agreement with cross-referral for investment products and advisory services",
                rationale: "Addresses advisor capacity and marketing gaps cost-effectively"
              }
            ],
            estimated_investment: "CHF 0.5-1M (setup) plus revenue share",
            timeline: "6 months to pilot"
          },
          {
            category_id: "processing",
            category_name: "Processing & back-office partnerships",
            strategic_rationale: "Swiss pension fund processing is consolidating, with major players like AXA having significant market share; partnerships can create economies of scale and enable data aggregation platforms needed for ecosystem success",
            current_situation: [
              "AXA's PK processing unit is a major processor with scale and institutional relationships",
              "Joint venture or acquisition options are typical, with JV structures providing shared control and acquisitions offering full ownership",
              "Processing consolidation supports data aggregation foundation and institutional-to-retail data flow"
            ],
            partnership_model: "Joint venture (50-50) or majority acquisition",
            potential_partners: [
              {
                partner_name: "AXA (PK processing unit)",
                partner_description: "Major Swiss pension fund back-office processor with significant market share",
                value_proposition: "Scale in institutional pension processing and data aggregation capabilities",
                partnership_structure: "Joint venture or majority acquisition",
                rationale: "Enables data aggregation foundation and supports institutional to retail data flow"
              }
            ],
            estimated_investment: "CHF 50-150M (acquisition) or CHF 10-20M (JV setup)",
            timeline: "18-24 months for M&A process"
          }
        ],
        recommended_approach: {
          phase_1: "Digital advisory partnerships with VIAC and Selma - 12 months, CHF 10-20M",
          phase_2: "Advisory referral partnership with VermögensZentrum - 6 months, CHF 1M",
          phase_3: "Evaluate processing M&A options with AXA - 18-24 months, CHF 50-150M",
          rationale: "Start with lower-risk digital partnerships to quickly establish ecosystem capabilities, followed by advisory capacity expansion through referrals, and pursue larger processing M&A only after digital success is demonstrated"
        }
      },
      insights: [
        "Partnerships enable UBS to accelerate ecosystem build in 12-18 months versus 3-5 years for full internal development",
        "Digital advisory partnerships address critical technology and product innovation gaps with proven fintech partners like VIAC and Selma",
        "Advisory referral partnerships provide quick capacity expansion without compromising advisor independence",
        "Processing partnerships or acquisitions create strategic moats through data aggregation and scale economies",
        "Emerging API standards (e.g., SFTI OpenPK) and regulatory movements support easier digital integration in Swiss pension sector",
        "A phased approach mitigates risk and aligns investment with capability building milestones"
      ],
      partnership_selection_criteria: {
        strategic_fit: "Partner capabilities must address critical gaps identified in UBS ecosystem strategy",
        market_position: "Partners should be leading players with strong client bases and recognized capabilities",
        cultural_fit: "Partners must align with UBS risk, compliance, and brand standards",
        economics: "Investment should be reasonable and justified compared to building internally",
        exclusivity: "Prefer arrangements that secure preferential or exclusive partnership rights"
      },
      risks_and_mitigations: [
        {
          risk: "Partner insists on own branding over white-label",
          mitigation: "Start with co-branded solutions and transition to white-label as trust builds"
        },
        {
          risk: "Integration complexity due to multiple partners and tech stacks",
          mitigation: "Invest in API layers and phased rollouts focusing on 1-2 partners initially"
        },
        {
          risk: "Partner acquisition by competitor",
          mitigation: "Include right-of-first-refusal and protective clauses in agreements"
        }
      ],
      citations: [
        "Swiss FinTech Innovations (SFTI) Open Pension Position Paper, April 2024",
        "McKinsey & Company, Making Up Lost Ground: Swiss Pension System Report, 2020",
        "Swisscanto Pensionskassenstudie 2025",
        "Swiss Bankers Association, Multibanking Memorandum of Understanding, 2023",
        "Zurich Cantonal Bank Press Release on Open Pension, 2023"
      ],
      fallback: true,
      source: "cfa-demo-fallback"
    };
  }

  getCompleteStorylineFallback() {
    return {
      title: 'UBS Switzerland Pension Strategy Analysis (Fallback)',
      executiveSummary: 'Emergency fallback storyline providing strategic analysis of UBS Switzerland position in pension market when AI agents are unavailable.',
      presentationFlow: 'Five-slide strategic narrative with fallback data covering market opportunity, competitive threats, capability gaps, strategic options, and partnership recommendations.',
      sections: [
        {
          id: 'cfa-demo-1-fallback',
          title: 'Swiss Pension Market Analysis',
          description: 'Market sizing analysis across pension products',
          order: 1,
          status: 'final',
          framework: 'market_sizing',
          insights: [
            'Total Swiss pension market expected to reach CHF 1,700bn by 2030',
            'Pillar 3a shows strongest growth at 5.0% CAGR',
            'Digital products gaining traction in younger segments'
          ],
          sources: ['Swisscanto Monitor', 'McKinsey Report'],
          fallback: true
        },
        {
          id: 'cfa-demo-2-fallback',
          title: 'Competitive Landscape',
          description: 'Analysis of competitive dynamics and business models',
          order: 2,
          status: 'final',
          framework: 'competitive_landscape',
          insights: [
            'Clear bifurcation between traditional and digital players',
            'Ecosystem platforms emerging as new category',
            'UBS faces pressure across multiple dimensions'
          ],
          sources: ['Industry Analysis', 'Company Reports'],
          fallback: true
        },
        {
          id: 'cfa-demo-3-fallback',
          title: 'Capability Assessment',
          description: 'UBS capability gaps vs best-in-class competitors',
          order: 3,
          status: 'final',
          framework: 'capability_benchmark',
          insights: [
            'Three RED gaps: advisor capacity, technology, marketing',
            'Significant investment needed to close gaps',
            'Partnership approach may be more viable than build'
          ],
          sources: ['Internal Analysis', 'Competitive Intelligence'],
          fallback: true
        },
        {
          id: 'cfa-demo-4-fallback',
          title: 'Strategic Options',
          description: 'Recommended ecosystem strategy',
          order: 4,
          status: 'final',
          framework: 'strategic_options',
          insights: [
            'Ecosystem strategy addresses all critical gaps',
            'Partnership approach enables faster time-to-market',
            'Seven components provide comprehensive coverage'
          ],
          sources: ['Strategic Planning', 'Market Analysis'],
          fallback: true
        },
        {
          id: 'cfa-demo-5-fallback',
          title: 'Partnership Strategy',
          description: 'Implementation through strategic partnerships',
          order: 5,
          status: 'final',
          framework: 'partnerships',
          insights: [
            'Three partnership categories address different gaps',
            'Phased approach mitigates implementation risk',
            'Total investment CHF 10-170M over 2 years'
          ],
          sources: ['Partnership Analysis', 'Financial Planning'],
          fallback: true
        }
      ],
      totalSections: 5,
      estimatedDuration: 15,
      generatedAt: new Date(),
      generationSource: 'cfa-demo-fallback',
      status: 'draft'
    };
  }

  getGenericFallback(agentId) {
    return {
      slide_content: {
        title: `Analysis Results (Agent ${agentId})`,
        content: 'Fallback content provided due to agent unavailability'
      },
      insights: ['Fallback analysis provided', 'Agent execution failed'],
      citations: ['Fallback data source'],
      fallback: true,
      source: 'generic-fallback'
    };
  }
}