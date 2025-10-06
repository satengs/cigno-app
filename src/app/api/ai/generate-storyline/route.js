import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, projectData, deliverableData } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // AI Configuration - using storyline generation agent
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      storylineAgentId: process.env.AI_STORYLINE_AGENT_ID || '68db998aabd74ae6e0a5fbc8' // Default agent ID
    };

    console.log(`📖 Generating storyline for project: ${projectId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.storylineAgentId}`);

    // Prepare context for storyline generation
    const context = {
      projectId: projectId,
      projectName: projectData?.name || 'Unknown Project',
      clientName: projectData?.client_name || 'Unknown Client',
      industry: projectData?.industry || 'General',
      description: projectData?.description || '',
      deliverable: deliverableData || {},
      requestType: 'storyline_generation'
    };

    const message = `Generate a comprehensive storyline structure for the project "${projectData?.name || 'project'}" for client "${projectData?.client_name || 'client'}". 

Project Details:
- Industry: ${projectData?.industry || 'Not specified'}
- Description: ${projectData?.description || 'Not provided'}

Please create a structured storyline with sections including:
1. Executive Summary
2. Market Context & Analysis  
3. Strategic Implications
4. Technical Architecture (if applicable)
5. Risk Assessment & Compliance
6. Implementation Roadmap

For each section, provide:
- Title and section number
- Brief description
- Key content points
- Sources/references
- Status (Final/Draft/Not Started)

Return the response as a JSON structure with sections array.`;

    try {
      // Try custom agent first
      const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.storylineAgentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_CONFIG.apiKey
        },
        body: JSON.stringify({
          message: message,
          context: context
        })
      });

      if (customAgentResponse.ok) {
        const agentResult = await customAgentResponse.json();
        console.log('✅ Storyline generated via custom agent');
        
        return NextResponse.json({
          success: true,
          source: 'custom-agent',
          agentId: AI_CONFIG.storylineAgentId,
          projectId: projectId,
          data: agentResult
        });
      }

      console.log('🔄 Custom agent failed, falling back to chat endpoint...');
    } catch (error) {
      console.log('🔄 Custom agent error, falling back to chat endpoint...', error.message);
    }

    // Fallback to chat endpoint
    const chatResponse = await fetch(`${AI_CONFIG.baseUrl}/api/chat/send-streaming`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_CONFIG.apiKey
      },
      body: JSON.stringify({
        message: message,
        context: context
      })
    });

    if (!chatResponse.ok) {
      throw new Error(`Chat API failed: ${chatResponse.status} ${chatResponse.statusText}`);
    }

    const chatResult = await chatResponse.json();
    console.log('✅ Storyline generated via chat endpoint');
    
    return NextResponse.json({
      success: true,
      source: 'chat',
      projectId: projectId,
      data: chatResult
    });

  } catch (error) {
    console.error('❌ Storyline generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate storyline',
        details: error.message 
      },
      { status: 500 }
    );
  }
}