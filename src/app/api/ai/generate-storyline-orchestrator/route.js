import { NextResponse } from 'next/server';
import { CFADemoOrchestrator } from '../../../../lib/cfa-demo/orchestrator.js';

export async function POST(request) {
  try {
    console.log('🔧 ===== GENERATE-STORYLINE-ORCHESTRATOR API ROUTE CALLED =====');
    const body = await request.json();
    console.log('📋 Request body:', JSON.stringify(body, null, 2));
    
    const {
      projectId,
      projectName,
      clientName,
      industry,
      projectDescription,
      deliverableId,
      deliverableName,
      deliverableBrief,
      geography
    } = body;

    if (!projectName) {
      return NextResponse.json(
        { error: 'Project name is required' },
        { status: 400 }
      );
    }

    // Create orchestrator instance
    const orchestrator = new CFADemoOrchestrator({
      // Add any config if needed
    });

    // Prepare project input for orchestrator
    const projectInput = {
      projectId: projectId || 'default-project-id',
      projectName: projectName || 'Strategic Analysis',
      clientName: clientName || 'Client',
      industry: industry || 'financial-services',
      projectDescription: projectDescription || 'Strategic analysis and recommendations',
      deliverableId: deliverableId || 'default-deliverable-id',
      deliverableName: deliverableName || 'Strategic Analysis',
      deliverableBrief: deliverableBrief || 'Strategic analysis and recommendations',
      geography: geography || 'Global'
    };

    console.log('📋 Project Input for orchestrator:', projectInput);

    // Execute orchestrator
    const result = await orchestrator.execute(projectInput);

    if (!result.success) {
      console.error('❌ Orchestrator failed:', result.error);
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || 'Orchestrator execution failed',
          fallback: result.fallback || false
        },
        { status: 500 }
      );
    }

    console.log('✅ Orchestrator completed successfully');
    console.log('📊 Generated storyline sections:', result.storyline?.sections?.length || 0);

    return NextResponse.json({
      success: true,
      storyline: result.storyline,
      executionOrder: result.executionOrder,
      totalDuration: result.totalDuration,
      agentResults: result.agentResults
    });

  } catch (error) {
    console.error('❌ Error in generate-storyline-orchestrator API:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error',
        fallback: true
      },
      { status: 500 }
    );
  }
}
