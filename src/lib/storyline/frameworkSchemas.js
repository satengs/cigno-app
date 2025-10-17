export const FRAMEWORK_SCHEMAS = {
  market_sizing: {
    agent: 'MarketSizingAgent',
    promptKey: 'market-sizing',
    title: 'Market Size Analysis',
    chartTypes: ['bar'],
    defaultChartType: 'bar',
    defaultConfig: { datasets: [], labels: [] }
  },
  competitive_landscape: {
    agent: 'CompetitiveLandscapeAgent',
    promptKey: 'competitive-landscape',
    title: 'Competitive Positioning',
    chartTypes: ['radar', 'scatter'],
    defaultChartType: 'radar'
  },
  industry_trends: {
    agent: 'IndustryTrendsAgent',
    promptKey: 'industry-trends',
    title: 'Industry Trends Overview',
    chartTypes: ['horizontalBar'],
    defaultChartType: 'horizontalBar'
  },
  capability_benchmark: {
    agent: 'CapabilityBenchmarkAgent',
    promptKey: 'capability-benchmark',
    title: 'Capability Benchmark',
    chartTypes: ['groupedBar', 'table'],
    defaultChartType: 'groupedBar'
  },
  competitor_deep_dive: {
    agent: 'CompetitorDeepDiveAgent',
    promptKey: 'competitor-deepdive',
    title: 'Competitor Deep Dive',
    chartTypes: ['profile', 'card'],
    defaultChartType: 'profile'
  },
  strategic_options: {
    agent: 'StrategicOptionsAgent',
    promptKey: 'strategic-options',
    title: 'Strategic Options Matrix',
    chartTypes: ['bubble'],
    defaultChartType: 'bubble'
  },
  buy_vs_build: {
    agent: 'BuyVsBuildAgent',
    promptKey: 'buy-vs-build',
    title: 'Buy vs Build Comparison',
    chartTypes: ['groupedBar'],
    defaultChartType: 'groupedBar'
  },
  product_roadmap: {
    agent: 'ProductRoadmapAgent',
    promptKey: 'product-roadmap',
    title: 'Product Roadmap',
    chartTypes: ['timeline'],
    defaultChartType: 'timeline'
  },
  competition_analysis: {
    agent: 'CompetitionAnalysisAgent',
    promptKey: 'competition-analysis',
    title: 'Competitive Analysis',
    chartTypes: ['radar'],
    defaultChartType: 'radar'
  },
  client_segments: {
    agent: 'ClientSegmentsAgent',
    promptKey: 'client-segments',
    title: 'Client Segmentation',
    chartTypes: ['pie'],
    defaultChartType: 'pie'
  },
  product_landscape: {
    agent: 'ProductLandscapeAgent',
    promptKey: 'product-landscape',
    title: 'Product Portfolio',
    chartTypes: ['matrix'],
    defaultChartType: 'matrix'
  },
  capability_assessment: {
    agent: 'CapabilityAssessmentAgent',
    promptKey: 'capability-assessment',
    title: 'Capability Assessment',
    chartTypes: ['radar'],
    defaultChartType: 'radar'
  },
  gap_analysis: {
    agent: 'GapAnalysisAgent',
    promptKey: 'gap-analysis',
    title: 'Gap Analysis',
    chartTypes: ['bar'],
    defaultChartType: 'bar'
  },
  recommendations: {
    agent: 'RecommendationsAgent',
    promptKey: 'recommendations',
    title: 'Recommendations',
    chartTypes: ['table'],
    defaultChartType: 'table'
  },
  partnerships: {
    agent: 'PartnershipsAgent',
    promptKey: 'partnerships',
    title: 'Partnership Strategy',
    chartTypes: ['network'],
    defaultChartType: 'network'
  }
};
