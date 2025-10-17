import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, projectData = {}, deliverableData = {}, clientData = {}, testMode = false } = body;

    if (!projectId && !testMode) {
      return NextResponse.json(
        { error: 'Project ID is required (unless in test mode)' },
        { status: 400 }
      );
    }

    // AI Configuration for CFA-DEMO agents
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      timeout: 120000 // 2 minutes per agent
    };

    console.log('🚀 ===== CFA-DEMO API ROUTE CALLED =====');
    console.log(`📊 Project: ${projectId || 'TEST'}`);
    console.log(`🏢 Client: ${clientData.name || projectData.client?.name || 'UBS'}`);
    console.log(`🌍 Geography: ${clientData.geography || 'Switzerland'}`);
    console.log('🔧 AI Config:', AI_CONFIG);
    console.log('📋 Full request body:', JSON.stringify(body, null, 2));
    
    // Import orchestrator dynamically to avoid build issues
    const { CFADemoOrchestrator } = await import('../../../../lib/cfa-demo/orchestrator.js');
    
    // Create orchestrator instance
    console.log('🛠️ Creating CFADemoOrchestrator instance...');
    const orchestrator = new CFADemoOrchestrator(AI_CONFIG);
    
    // Prepare input data
    const inputData = {
      project: {
        id: projectId,
        name: projectData.name || 'New Pension Strategy',
        client: clientData.name || projectData.client?.name || 'UBS',
        industry: clientData.industry || ['Wealth Management', 'Retail Banking'],
        geography: clientData.geography || 'Switzerland',
        ...projectData
      },
      deliverable: {
        brief: deliverableData.brief || projectData.brief,
        type: deliverableData.type || 'Strategy Presentation',
        audience: deliverableData.audience || ['C-Level Executives', 'Board of Directors'],
        ...deliverableData
      },
      client: {
        name: 'UBS',
        geography: 'Switzerland',
        sector: 'Pension / Vorsorge',
        ...clientData
      },
      projectId: projectId || 'cfa-demo-test'
    };

    console.log('📋 Input Data:', JSON.stringify(inputData, null, 2));

    // Test mode: return fallback data immediately
    if (testMode) {
      console.log('🧪 Test mode: Using fallback data');
      
      const testResult = {
        success: true,
        source: 'cfa-demo-test',
        projectId: inputData.projectId,
        testMode: true,
        data: await orchestrator.fallbacks.getCompleteStorylineFallback()
      };
      
      return NextResponse.json(testResult);
    }

    // Set up progress tracking (optional)
    let lastProgress = null;
    orchestrator.onProgress((progress) => {
      lastProgress = progress;
      console.log(`📈 Progress: ${progress.phase} - ${progress.progress}%`);
    });

    // Execute CFA-DEMO orchestration
    const startTime = Date.now();
    const result = await orchestrator.execute(inputData);
    const totalDuration = Date.now() - startTime;

    console.log(`✅ CFA-DEMO orchestration completed in ${totalDuration}ms`);
    console.log(`📊 Success: ${result.success}`);
    console.log(`🤖 Agents executed: ${result.executionOrder?.length || 0}`);

    if (result.success) {
      return NextResponse.json({
        success: true,
        source: 'cfa-demo-orchestrator',
        projectId: inputData.projectId,
        totalDuration,
        agentsExecuted: result.executionOrder,
        fallbackUsed: result.fallback || false,
        lastProgress,
        data: result.storyline
      });
    } else {
      // Orchestration failed but we have fallback data
      console.log('⚠️ Orchestration failed, returning fallback storyline');
      
      return NextResponse.json({
        success: false,
        source: 'cfa-demo-fallback',
        projectId: inputData.projectId,
        error: result.error,
        fallbackUsed: true,
        totalDuration,
        data: result.storyline
      }, { status: 206 }); // 206 Partial Content
    }

  } catch (error) {
    console.error('❌ CFA-DEMO API error:', error);

    // Extract specific error information
    let errorMessage = 'Failed to generate CFA-DEMO storyline';
    let statusCode = 500;
    let errorDetails = error.message;

    if (error.message?.includes?.('rate limit')) {
      errorMessage = 'AI service rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes?.('timeout')) {
      errorMessage = 'CFA-DEMO generation timed out. The process is complex and may take several minutes.';
      statusCode = 408;
    } else if (error.message?.includes?. ('agent')) {
      errorMessage = 'One or more AI agents failed to respond. Using fallback analysis.';
      statusCode = 503;
    }

    // Try to provide fallback data even on error
    try {
      const { CFADemoFallbacks } = await import('../../../../lib/cfa-demo/fallbacks.js');
      const fallbacks = new CFADemoFallbacks();
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        details: errorDetails,
        fallbackUsed: true,
        data: fallbacks.getCompleteStorylineFallback()
      }, { status: statusCode });
      
    } catch (fallbackError) {
      console.error('❌ Fallback generation also failed:', fallbackError);
      
      return NextResponse.json({
        error: errorMessage,
        details: errorDetails,
        fallbackError: 'Could not generate fallback data'
      }, { status: statusCode });
    }
  }
}

// Health check endpoint
export async function GET(request) {
  try {
    // Test agent connectivity
    const { AgentExecutor } = await import('../../../../lib/cfa-demo/agentExecutor.js');
    
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17'
    };

    const executor = new AgentExecutor(AI_CONFIG);
    const connectivity = await executor.testAllAgents();

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      agents: connectivity,
      ready: connectivity.allConnected,
      message: connectivity.allConnected 
        ? 'All CFA-DEMO agents are available'
        : `${connectivity.connectedAgents}/${connectivity.totalAgents} agents available - fallback mode enabled`
    });

  } catch (error) {
    console.error('❌ CFA-DEMO health check failed:', error);
    
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      error: error.message,
      message: 'CFA-DEMO service is degraded - fallback mode available'
    }, { status: 503 });
  }
}