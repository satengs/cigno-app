'use client';

import React from 'react';
import { MarketSizingView } from './MarketSizingView';
import { CompetitiveLandscapeView } from './CompetitiveLandscapeView';
import { CompetitionAnalysisView } from './CompetitionAnalysisView';
import { IndustryTrendsView } from './IndustryTrendsView';
import { CapabilityBenchmarkView } from './CapabilityBenchmarkView';
import { CompetitorDeepDiveView } from './CompetitorDeepDiveView';
import { StrategicOptionsView } from './StrategicOptionsView';
import { BuyVsBuildView } from './BuyVsBuildView';
import { PartnershipView } from './PartnershipView';
import { ProductRoadmapView } from './ProductRoadmapView';
import { ClientSegmentsView } from './ClientSegmentsView';
import { ProductLandscapeView } from './ProductLandscapeView';
import { CapabilityAssessmentView } from './CapabilityAssessmentView';
import { GapAnalysisView } from './GapAnalysisView';
import { RecommendationsView } from './RecommendationsView';
import { GenericChartView } from './GenericChartView';

export type FrameworkType = 
  | 'market_sizing' 
  | 'competitive_landscape' 
  | 'competition_analysis'
  | 'competitor_deep_dive'
  | 'client_segments'
  | 'product_landscape'
  | 'capability_benchmark'
  | 'capability_assessment'
  | 'gap_analysis'
  | 'industry_trends'
  | 'strategic_options'
  | 'recommendations'
  | 'buy_vs_build'
  | 'partnerships'
  | 'product_roadmap'
  | 'brief_scorer'
  | 'key_industry_trends'
  | 'deep_dive_strategic_option';

export interface FrameworkData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }>;
  insights?: string[];
  takeaway?: string;
  chartType?: string;
  [key: string]: any;
}

export interface FrameworkRendererProps {
  framework: FrameworkType;
  data: FrameworkData;
  insights?: string[];
  takeaway?: string;
  chartType?: string;
  className?: string;
}

export function FrameworkRenderer({ 
  framework, 
  data, 
  insights, 
  takeaway, 
  chartType,
  className = ''
}: FrameworkRendererProps) {
  const commonProps = {
    data,
    insights,
    takeaway,
    chartType,
    className
  };

  switch (framework) {
    case 'market_sizing':
      return <MarketSizingView {...commonProps} />;
    
    case 'competitive_landscape':
      return <CompetitiveLandscapeView {...commonProps} />;
    
    case 'competition_analysis':
      return <CompetitionAnalysisView {...commonProps} />;
    
    case 'competitor_deep_dive':
      return <CompetitorDeepDiveView {...commonProps} />;
    
    case 'client_segments':
      return <ClientSegmentsView {...commonProps} />;
    
    case 'product_landscape':
      return <ProductLandscapeView {...commonProps} />;
    
    case 'capability_benchmark':
      return <CapabilityBenchmarkView {...commonProps} />;
    
    case 'capability_assessment':
      return <CapabilityAssessmentView {...commonProps} />;
    
    case 'gap_analysis':
      return <GapAnalysisView {...commonProps} />;
    
    case 'industry_trends':
      return <IndustryTrendsView {...commonProps} />;
    
    case 'strategic_options':
      return <StrategicOptionsView {...commonProps} />;
    
    case 'recommendations':
      return <RecommendationsView {...commonProps} />;
    
    case 'buy_vs_build':
      return <BuyVsBuildView {...commonProps} />;
    
    case 'partnerships':
      return <PartnershipView {...commonProps} />;
    
    case 'product_roadmap':
      return <ProductRoadmapView {...commonProps} />;
    
    case 'brief_scorer':
      return <GenericChartView {...commonProps} />; // TODO: Create BriefScorerView
    
    case 'key_industry_trends':
      return <IndustryTrendsView {...commonProps} />; // Reuse existing view
    
    case 'deep_dive_strategic_option':
      return <GenericChartView {...commonProps} />; // TODO: Create DeepDiveStrategicOptionView
    
    default:
      return <GenericChartView {...commonProps} />;
  }
}

// Export individual components for direct use if needed
export {
  MarketSizingView,
  CompetitiveLandscapeView,
  CompetitionAnalysisView,
  IndustryTrendsView,
  CapabilityBenchmarkView,
  CompetitorDeepDiveView,
  StrategicOptionsView,
  BuyVsBuildView,
  PartnershipView,
  ProductRoadmapView,
  ClientSegmentsView,
  ProductLandscapeView,
  CapabilityAssessmentView,
  GapAnalysisView,
  RecommendationsView,
  GenericChartView
};
