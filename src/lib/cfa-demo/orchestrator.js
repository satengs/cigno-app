import { AgentExecutor } from './agentExecutor.js';
import { CFADemoDataTransformer } from './dataTransformer.js';
import { CFADemoProgressTracker } from './progressTracker.js';
import { CFADemoFallbacks } from './fallbacks.js';

export class CFADemoOrchestrator {
  constructor(config) {
    this.config = config;
    this.executor = new AgentExecutor(config);
    this.transformer = new CFADemoDataTransformer();
    this.progressTracker = new CFADemoProgressTracker();
    this.fallbacks = new CFADemoFallbacks();
    
    this.agents = {
      '68f229005e8b5435150c2991': { 
        name: 'Market Sizing', 
        dependencies: [],
        phase: 0,
        parallel: true
      },
      '68f22dc0330210e8b8f60a43': { 
        name: 'Competitive Landscape', 
        dependencies: [],
        phase: 0,
        parallel: true
      },
      '68f22f36330210e8b8f60a51': { 
        name: 'Capability Benchmark', 
        dependencies: ['68f22dc0330210e8b8f60a43'],
        phase: 1
      },
      '68f23ae07e8d5848f940482d': { 
        name: 'Strategic Options', 
        dependencies: ['68f229005e8b5435150c2991', '68f22dc0330210e8b8f60a43', '68f22f36330210e8b8f60a51'],
        phase: 2
      },
      '68f23be77e8d5848f9404847': { 
        name: 'Partnership Strategy', 
        dependencies: ['68f23ae07e8d5848f940482d'],
        phase: 3
      }
    };
    
    this.results = new Map();
    this.startTime = null;
  }

  async execute(projectInput) {
    this.startTime = Date.now();
    console.log('🚀 Starting CFA-DEMO orchestration...');
    console.log('📊 Project Input:', JSON.stringify(projectInput, null, 2));
    console.log('🔧 Agent IDs configured:', Object.keys(this.agents));
    
    try {
      // Phase 1: Parallel execution (Market Sizing + Competitive Landscape)
      console.log('📈 === PHASE 1: PARALLEL EXECUTION ===');
      const phase1Results = await this.executePhase1Parallel(projectInput);
      
      // Phase 2: Sequential execution with dependencies
      console.log('📈 === PHASE 2: SEQUENTIAL EXECUTION ===');
      const phase2Results = await this.executePhase2Sequential(phase1Results, projectInput);
      
      // Consolidate and return results
      console.log('📈 === CONSOLIDATING RESULTS ===');
      const storyline = await this.consolidateResults(phase2Results);
      
      const totalDuration = Date.now() - this.startTime;
      console.log(`✅ CFA-DEMO orchestration completed in ${totalDuration}ms`);
      
      return {
        success: true,
        executionOrder: this.getExecutionOrder(),
        totalDuration,
        storyline,
        agentResults: Object.fromEntries(this.results)
      };
      
    } catch (error) {
      console.error('❌ CFA-DEMO orchestration failed:', error);
      return this.handleOrchestrationError(error);
    }
  }

  async executePhase1Parallel(projectInput) {
    console.log('📊 Executing Phase 1: Market Sizing + Competitive Landscape (Parallel)');
    
    // Start tracking Market Sizing (phase 0)
    this.progressTracker.updateProgress(0, 'starting');
    
    const marketSizingInput = this.transformer.buildMarketSizingInput(projectInput);
    const competitiveInput = this.transformer.buildCompetitiveLandscapeInput(projectInput);
    
    try {
      const [marketResult, competitiveResult] = await Promise.allSettled([
        this.executeAgentWithFallback('68f229005e8b5435150c2991', marketSizingInput),
        this.executeAgentWithFallback('68f22dc0330210e8b8f60a43', competitiveInput)
      ]);

      // Handle results (success or fallback)
      const marketData = marketResult.status === 'fulfilled' 
        ? marketResult.value 
        : this.fallbacks.getMarketSizingFallback();
        
      const competitiveData = competitiveResult.status === 'fulfilled' 
        ? competitiveResult.value 
        : this.fallbacks.getCompetitiveLandscapeFallback();

      this.results.set('68f229005e8b5435150c2991', marketData);
      this.results.set('68f22dc0330210e8b8f60a43', competitiveData);
      
      // Complete Market Sizing (phase 0)
      this.progressTracker.updateProgress(0, 'completed');
      // Complete Competitive Analysis (phase 1)  
      this.progressTracker.updateProgress(1, 'completed');
      
      return { marketData, competitiveData };
      
    } catch (error) {
      console.error('❌ Phase 1 failed:', error);
      throw new Error(`Phase 1 execution failed: ${error.message}`);
    }
  }

  async executePhase2Sequential(phase1Results, projectInput) {
    console.log('🔄 Executing Phase 2: Sequential agents with dependencies');
    
    try {
      // CFA-DEMO-3: Capability Benchmark (requires CFA-DEMO-2)
      this.progressTracker.updateProgress(2, 'starting');
      
      const capabilityInput = this.transformer.buildCapabilityBenchmarkInput(
        projectInput,
        { competitive_landscape: phase1Results.competitiveData }
      );
      
      const capabilityResult = await this.executeAgentWithFallback(
        '68f22f36330210e8b8f60a51', 
        capabilityInput
      );
      
      this.results.set('68f22f36330210e8b8f60a51', capabilityResult);
      this.progressTracker.updateProgress(2, 'completed');
      
      // CFA-DEMO-4: Strategic Options (requires CFA-DEMO-1, 2, 3)
      this.progressTracker.updateProgress(3, 'starting');
      
      const strategicInput = this.transformer.buildStrategicOptionsInput(
        projectInput,
        {
          market_sizing: phase1Results.marketData,
          competitive_landscape: phase1Results.competitiveData,
          capability_benchmark: capabilityResult
        }
      );
      
      const strategicResult = await this.executeAgentWithFallback(
        '68f23ae07e8d5848f940482d',
        strategicInput
      );
      
      this.results.set('68f23ae07e8d5848f940482d', strategicResult);
      this.progressTracker.updateProgress(3, 'completed');
      
      // CFA-DEMO-5: Partnership Strategy (requires CFA-DEMO-4)
      this.progressTracker.updateProgress(4, 'starting');
      
      const partnershipInput = this.transformer.buildPartnershipInput(
        projectInput,
        { strategic_options: strategicResult }
      );
      
      const partnershipResult = await this.executeAgentWithFallback(
        '68f23be77e8d5848f9404847',
        partnershipInput
      );
      
      this.results.set('68f23be77e8d5848f9404847', partnershipResult);
      this.progressTracker.updateProgress(4, 'completed');
      
      return {
        ...phase1Results,
        capabilityResult,
        strategicResult,
        partnershipResult
      };
      
    } catch (error) {
      console.error('❌ Phase 2 failed:', error);
      throw new Error(`Phase 2 execution failed: ${error.message}`);
    }
  }

  async executeAgentWithFallback(agentId, input, maxRetries = 2) {
    const agentName = this.agents[agentId]?.name || agentId;
    console.log(`🤖 Executing ${agentName} (${agentId})`);
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const result = await this.executor.executeAgent(agentId, input);
        console.log(`✅ ${agentName} completed on attempt ${attempt}`);
        return result;
        
      } catch (error) {
        console.warn(`⚠️ ${agentName} attempt ${attempt} failed:`, error.message);
        
        if (attempt <= maxRetries) {
          const delay = 1000 * attempt; // Progressive backoff
          console.log(`⏰ Retrying ${agentName} in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        // All attempts failed - use fallback
        console.log(`🔄 Using fallback data for ${agentName}`);
        return this.fallbacks.getFallbackData(agentId);
      }
    }
  }

  async consolidateResults(results) {
    console.log('📋 Consolidating CFA-DEMO results into storyline...');
    
    const sections = [];
    
    // Convert each agent result to a storyline section
    const agentOrder = [
      '68f229005e8b5435150c2991',
      '68f22dc0330210e8b8f60a43', 
      '68f22f36330210e8b8f60a51',
      '68f23ae07e8d5848f940482d',
      '68f23be77e8d5848f9404847'
    ];
    
    agentOrder.forEach((agentId, index) => {
      const agentResult = this.results.get(agentId);
      const agentName = this.agents[agentId].name;
      
      if (agentResult) {
        sections.push({
          id: `cfa-demo-${index + 1}`,
          title: agentResult.slide_content?.title || `${agentName} Analysis`,
          description: `Strategic analysis: ${agentName}`,
          order: index + 1,
          status: 'final',
          framework: this.getFrameworkForAgent(agentId),
          insights: agentResult.insights || [],
          sources: agentResult.citations || [],
          chartData: this.transformer.extractChartData(agentResult),
          keyPoints: this.transformer.extractKeyPoints(agentResult),
          generated_at: new Date(),
          source: 'cfa-demo-agent',
          agentId
        });
      }
    });
    
    return {
      title: 'UBS Switzerland Pension Strategy Analysis',
      executiveSummary: 'Comprehensive strategic analysis of UBS Switzerland\'s position in the pension market, including market sizing, competitive dynamics, capability assessment, strategic options, and partnership opportunities.',
      presentationFlow: 'Five-slide strategic narrative covering market opportunity, competitive threats, internal capabilities, recommended strategy, and implementation partnerships.',
      sections,
      totalSections: sections.length,
      estimatedDuration: sections.length * 3, // 3 minutes per section
      generatedAt: new Date(),
      generationSource: 'cfa-demo',
      status: 'draft'
    };
  }

  getFrameworkForAgent(agentId) {
    const frameworks = {
      '68f229005e8b5435150c2991': 'market_sizing',
      '68f22dc0330210e8b8f60a43': 'competitive_landscape',
      '68f22f36330210e8b8f60a51': 'capability_benchmark',
      '68f23ae07e8d5848f940482d': 'strategic_options',
      '68f23be77e8d5848f9404847': 'partnerships'
    };
    return frameworks[agentId] || 'generic';
  }

  getExecutionOrder() {
    return Array.from(this.results.keys()).map(agentId => ({
      agentId,
      name: this.agents[agentId]?.name || 'Unknown',
      completed: true
    }));
  }

  handleOrchestrationError(error) {
    console.error('🚨 Orchestration failed - creating fallback storyline');
    
    return {
      success: false,
      error: error.message,
      fallback: true,
      storyline: this.fallbacks.getCompleteStorylineFallback(),
      totalDuration: Date.now() - this.startTime
    };
  }

  onProgress(callback) {
    this.progressTracker.onProgress(callback);
  }
}