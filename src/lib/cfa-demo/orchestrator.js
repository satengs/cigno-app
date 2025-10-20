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
      // Phase 0: Initial frameworks (no dependencies)
      'market_sizing': { 
        name: 'Market Sizing', 
        dependencies: ['brief_scorer'],
        phase: 1,
        parallel: false,
        framework: 'market_sizing'
      },
      
      // Phase 1: Market sizing dependent
      'competitive_landscape': { 
        name: 'Competitive Landscape', 
        dependencies: ['market_sizing'],
        phase: 2,
        parallel: false,
        framework: 'competitive_landscape'
      },
      
      // Phase 2: Market + Competitive dependent
      'key_industry_trends': { 
        name: 'Key Industry Trends', 
        dependencies: ['market_sizing', 'competitive_landscape'],
        phase: 3,
        parallel: false,
        framework: 'key_industry_trends'
      },
      
      // Phase 3: Market + Competitive + Industry dependent
      'capabilities_assessment': { 
        name: 'Capabilities Assessment', 
        dependencies: ['market_sizing', 'competitive_landscape', 'key_industry_trends'],
        phase: 4,
        parallel: false,
        framework: 'capabilities_assessment'
      },
      
      // Phase 4: Market + Competitive + Capabilities dependent
      'competitor_deep_dive': { 
        name: 'Competitor Deep Dive', 
        dependencies: ['market_sizing', 'competitive_landscape', 'capabilities_assessment'],
        phase: 5,
        parallel: false,
        framework: 'competitor_deep_dive'
      },
      
      // Phase 5: Capabilities + Competitor + Industry dependent
      'strategic_options': { 
        name: 'Strategic Options', 
        dependencies: ['capabilities_assessment', 'competitor_deep_dive', 'key_industry_trends'],
        phase: 6,
        parallel: false,
        framework: 'strategic_options'
      },
      
      // Phase 6: Strategic options dependent
      'deep_dive_strategic_option': { 
        name: 'Deep Dive Strategic Option', 
        dependencies: ['strategic_options'],
        phase: 7,
        parallel: false,
        framework: 'deep_dive_strategic_option'
      },
      
      // Phase 7: Capabilities + Strategic dependent
      'buy_vs_build': { 
        name: 'Buy vs Build', 
        dependencies: ['capabilities_assessment', 'strategic_options'],
        phase: 8,
        parallel: false,
        framework: 'buy_vs_build'
      },
      
      // Phase 8: Buy vs Build + Strategic + Deep dive dependent
      'product_roadmap': { 
        name: 'Product Roadmap', 
        dependencies: ['buy_vs_build', 'strategic_options', 'deep_dive_strategic_option'],
        phase: 9,
        parallel: false,
        framework: 'product_roadmap'
      }
    };
    
    this.results = new Map();
    this.startTime = null;
  }

  async execute(projectInput) {
    this.startTime = Date.now();
    console.log('🚀 Starting Framework orchestration...');
    console.log('📊 Project Input:', JSON.stringify(projectInput, null, 2));
    console.log('🔧 Agents configured:', Object.keys(this.agents));
    
    try {
      // Execute frameworks in dependency order
      console.log('📈 === EXECUTING FRAMEWORKS IN DEPENDENCY ORDER ===');
      const results = await this.executeFrameworksInOrder(projectInput);
      
      // Consolidate and return results
      console.log('📈 === CONSOLIDATING RESULTS ===');
      const storyline = await this.consolidateResults(results);
      
      const totalDuration = Date.now() - this.startTime;
      console.log(`✅ Framework orchestration completed in ${totalDuration}ms`);
      
      return {
        success: true,
        executionOrder: this.getExecutionOrder(),
        totalDuration,
        storyline,
        agentResults: Object.fromEntries(this.results)
      };
      
    } catch (error) {
      console.error('❌ Framework orchestration failed:', error);
      return this.handleOrchestrationError(error);
    }
  }

  async executeFrameworksInOrder(projectInput) {
    console.log('📊 Executing frameworks in dependency order...');
    
    const results = {};
    const completedFrameworks = new Set();
    
    // Get frameworks sorted by phase
    const frameworksByPhase = this.getFrameworksByPhase();
    
    for (const phase of Object.keys(frameworksByPhase).sort((a, b) => parseInt(a) - parseInt(b))) {
      const frameworks = frameworksByPhase[phase];
      console.log(`📈 === PHASE ${phase}: ${frameworks.map(f => f.name).join(', ')} ===`);
      
      // Check if all dependencies are met for this phase
      const readyFrameworks = frameworks.filter(framework => 
        framework.dependencies.every(dep => completedFrameworks.has(dep))
      );
      
      if (readyFrameworks.length === 0) {
        console.warn(`⚠️ No frameworks ready for phase ${phase} - skipping`);
        continue;
      }
      
      // Execute ready frameworks (parallel if multiple, sequential if single)
      if (readyFrameworks.length === 1) {
        const framework = readyFrameworks[0];
        console.log(`🔄 Executing ${framework.name} (sequential)`);
        const result = await this.executeFramework(framework, projectInput, results);
        results[framework.framework] = result;
        completedFrameworks.add(framework.framework);
      } else {
        console.log(`⚡ Executing ${readyFrameworks.length} frameworks in parallel`);
        const promises = readyFrameworks.map(framework => 
          this.executeFramework(framework, projectInput, results)
            .then(result => ({ framework: framework.framework, result }))
        );
        
        const frameworkResults = await Promise.allSettled(promises);
        
        frameworkResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled') {
            const { framework, result } = promiseResult.value;
            results[framework] = result;
            completedFrameworks.add(framework);
          } else {
            console.error(`❌ Framework ${readyFrameworks[index].name} failed:`, promiseResult.reason);
            // Use fallback for failed framework
            const fallbackResult = this.fallbacks.getFallbackData(readyFrameworks[index].framework);
            results[readyFrameworks[index].framework] = fallbackResult;
            completedFrameworks.add(readyFrameworks[index].framework);
          }
        });
      }
    }
    
    return results;
  }

  getFrameworksByPhase() {
    const frameworksByPhase = {};
    
    Object.values(this.agents).forEach(agent => {
      if (!frameworksByPhase[agent.phase]) {
        frameworksByPhase[agent.phase] = [];
      }
      frameworksByPhase[agent.phase].push(agent);
    });
    
    return frameworksByPhase;
  }

  async executeFramework(framework, projectInput, completedResults) {
    console.log(`🤖 Executing ${framework.name} (${framework.framework})`);
    
    try {
      // Build input with dependencies
      const dependencyData = {};
      framework.dependencies.forEach(dep => {
        if (completedResults[dep]) {
          dependencyData[dep] = completedResults[dep];
        }
      });
      
      // Get agent ID for this framework
      const agentId = this.getAgentIdForFramework(framework.framework);
      
      if (!agentId) {
        throw new Error(`No agent ID configured for framework: ${framework.framework}`);
      }
      
      // Build framework-specific input
      const input = this.transformer.buildFrameworkInput(
        framework.framework, 
        projectInput,
        dependencyData
      );
      
      // Execute agent
      const result = await this.executeAgentWithFallback(agentId, input);
      
      // Store result
      this.results.set(agentId, result);
      
      console.log(`✅ ${framework.name} completed successfully`);
      return result;
      
    } catch (error) {
      console.error(`❌ ${framework.name} failed:`, error);
      throw error;
    }
  }

  getAgentIdForFramework(framework) {
    const frameworkAgentMapping = {
      'brief_scorer': process.env.AI_BRIEF_SCORER_AGENT_ID || '68f4f36ddfc921b68ec3eded', // taxonomy
      'market_sizing': process.env.AI_MARKET_SIZING_AGENT_ID || '68f3a191dfc921b68ec3e83a',
      'competitive_landscape': process.env.AI_COMPETITIVE_LANDSCAPE_AGENT_ID || '68f3a9a5dfc921b68ec3e959',
      'key_industry_trends': process.env.AI_KEY_INDUSTRY_TRENDS_AGENT_ID || '68f3f71fdfc921b68ec3ea8d',
      'capabilities_assessment': process.env.AI_CAPABILITIES_ASSESSMENT_AGENT_ID || '68f3f817dfc921b68ec3ea8e',
      'competitor_deep_dive': process.env.AI_COMPETITOR_DEEP_DIVE_AGENT_ID || '68f4a393dfc921b68ec3ec36',
      'strategic_options': process.env.AI_STRATEGIC_OPTIONS_AGENT_ID || '68f4a655dfc921b68ec3ec37',
      'deep_dive_strategic_option': process.env.AI_DEEP_DIVE_STRATEGIC_OPTION_AGENT_ID || '68f4a8dfdfc921b68ec3ec38',
      'buy_vs_build': process.env.AI_BUY_VS_BUILD_AGENT_ID || '68f4ae2fdfc921b68ec3ec39',
      'product_roadmap': process.env.AI_PRODUCT_ROADMAP_AGENT_ID || '68f4b112dfc921b68ec3ec3a'
    };
    
    return frameworkAgentMapping[framework];
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
    console.log('📋 Consolidating framework results into storyline...');
    
    const sections = [];
    
    // Convert each framework result to a storyline section
    const frameworkOrder = [
      'brief_scorer',
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
    
    frameworkOrder.forEach((framework, index) => {
      const frameworkResult = results[framework];
      const agentConfig = Object.values(this.agents).find(a => a.framework === framework);
      
      if (frameworkResult && agentConfig) {
        sections.push({
          id: `framework-${index + 1}`,
          title: frameworkResult.slide_content?.title || `${agentConfig.name} Analysis`,
          description: `Strategic analysis: ${agentConfig.name}`,
          order: index + 1,
          status: 'final',
          framework: framework,
          insights: frameworkResult.insights || [],
          sources: frameworkResult.citations || [],
          chartData: this.transformer.extractChartData(frameworkResult),
          keyPoints: this.transformer.extractKeyPoints(frameworkResult),
          generated_at: new Date(),
          source: 'framework-agent',
          agentId: this.getAgentIdForFramework(framework)
        });
      }
    });
    
    return {
      title: 'Strategic Analysis Framework',
      executiveSummary: 'Comprehensive strategic analysis covering market sizing, competitive landscape, industry trends, capabilities assessment, strategic options, and implementation roadmap.',
      presentationFlow: 'Multi-phase strategic narrative covering market opportunity, competitive dynamics, internal capabilities, recommended strategy, and implementation plan.',
      sections,
      totalSections: sections.length,
      estimatedDuration: sections.length * 3, // 3 minutes per section
      generatedAt: new Date(),
      generationSource: 'framework-orchestrator',
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