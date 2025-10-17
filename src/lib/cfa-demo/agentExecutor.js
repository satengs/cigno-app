/**
 * CFA-DEMO Agent Executor
 * Handles execution of individual agents with proper input formatting
 * and error handling
 */
export class AgentExecutor {
  constructor(config) {
    this.config = {
      baseUrl: config.baseUrl || 'https://ai.vave.ch',
      apiKey: config.apiKey,
      timeout: config.timeout || 120000, // 2 minutes
      ...config
    };
  }

  async executeAgent(agentId, input) {
    const agentName = this.getAgentName(agentId);
    console.log(`🤖 ===============================================`);
    console.log(`🤖 EXECUTING AGENT: ${agentName}`);
    console.log(`🤖 Agent ID: ${agentId}`);
    console.log(`🤖 Base URL: ${this.config.baseUrl}`);
    console.log(`🤖 Timeout: ${this.config.timeout}ms`);
    console.log(`📊 Input data:`, JSON.stringify(input, null, 2));
    console.log(`🤖 ===============================================`);

    try {
      const url = `${this.config.baseUrl}/api/custom-agents/${agentId}/execute`;
      console.log(`🌐 Making request to: ${url}`);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(this.config.timeout)
      });

      console.log(`📡 Response status: ${response.status}`);
      console.log(`📡 Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Agent ${agentName} failed with status ${response.status}`);
        console.error(`❌ Error response:`, errorText);
        throw new Error(`Agent ${agentName} failed (${response.status}): ${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ ${agentName} completed successfully`);
      console.log(`📋 Full response:`, JSON.stringify(result, null, 2));
      
      return this.validateAgentOutput(agentId, result);

    } catch (error) {
      console.error(`❌ ${agentName} execution failed:`, error.message);
      
      if (error.name === 'TimeoutError') {
        throw new Error(`Agent ${agentName} timed out after ${this.config.timeout}ms`);
      }
      
      throw error;
    }
  }

  validateAgentOutput(agentId, result) {
    const agentName = this.getAgentName(agentId);
    
    // Basic validation - ensure we have the expected structure
    if (!result || typeof result !== 'object') {
      console.warn(`⚠️ ${agentName} returned invalid output format`);
      return {
        slide_content: { title: `${agentName} Analysis` },
        insights: [`${agentName} completed with limited output`],
        citations: [],
        validation_warning: 'Invalid output format'
      };
    }

    // Check for expected fields
    const hasSlideContent = result.slide_content && typeof result.slide_content === 'object';
    const hasInsights = Array.isArray(result.insights);
    
    if (!hasSlideContent) {
      console.warn(`⚠️ ${agentName} missing slide_content`);
      result.slide_content = result.slide_content || { title: `${agentName} Analysis` };
    }
    
    if (!hasInsights) {
      console.warn(`⚠️ ${agentName} missing insights array`);
      result.insights = result.insights || [`${agentName} analysis completed`];
    }

    return {
      ...result,
      agent_id: agentId,
      agent_name: agentName,
      executed_at: new Date().toISOString(),
      validation_passed: hasSlideContent && hasInsights
    };
  }

  getAgentName(agentId) {
    const agentNames = {
      '68f229005e8b5435150c2991': 'Market Sizing',
      '68f22dc0330210e8b8f60a43': 'Competitive Landscape',
      '68f22f36330210e8b8f60a51': 'Capability Benchmark',
      '68f23ae07e8d5848f940482d': 'Strategic Options',
      '68f23be77e8d5848f9404847': 'Partnership Strategy'
    };
    
    return agentNames[agentId] || `Agent ${agentId}`;
  }

  // Test agent connectivity
  async testAgentConnectivity(agentId) {
    try {
      const testInput = {
        message: "connectivity_test",
        context: { test: true }
      };
      
      const response = await fetch(`${this.config.baseUrl}/api/custom-agents/${agentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.config.apiKey
        },
        body: JSON.stringify(testInput),
        signal: AbortSignal.timeout(10000) // 10 second timeout for test
      });

      return {
        agentId,
        name: this.getAgentName(agentId),
        connected: response.ok,
        status: response.status,
        latency: Date.now() - Date.now()
      };

    } catch (error) {
      return {
        agentId,
        name: this.getAgentName(agentId),
        connected: false,
        error: error.message
      };
    }
  }

  // Test all CFA-DEMO agents
  async testAllAgents() {
    const agentIds = [
      '68f229005e8b5435150c2991',
      '68f22dc0330210e8b8f60a43', 
      '68f22f36330210e8b8f60a51',
      '68f23ae07e8d5848f940482d',
      '68f23be77e8d5848f9404847'
    ];

    console.log('🔍 Testing CFA-DEMO agent connectivity...');
    
    const results = await Promise.allSettled(
      agentIds.map(agentId => this.testAgentConnectivity(agentId))
    );

    const connectivity = results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        return {
          agentId: agentIds[index],
          name: this.getAgentName(agentIds[index]),
          connected: false,
          error: result.reason?.message || 'Test failed'
        };
      }
    });

    const connectedCount = connectivity.filter(c => c.connected).length;
    const totalCount = connectivity.length;
    
    console.log(`📡 Agent connectivity: ${connectedCount}/${totalCount} agents available`);
    
    connectivity.forEach(agent => {
      const status = agent.connected ? '✅' : '❌';
      console.log(`${status} ${agent.name}: ${agent.connected ? 'Connected' : agent.error}`);
    });

    return {
      totalAgents: totalCount,
      connectedAgents: connectedCount,
      allConnected: connectedCount === totalCount,
      agents: connectivity
    };
  }
}