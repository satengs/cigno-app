import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { deliverableId, currentBrief, deliverableData, projectData } = body;

    if (!deliverableId) {
      return NextResponse.json(
        { error: 'Deliverable ID is required' },
        { status: 400 }
      );
    }

    if (!currentBrief) {
      return NextResponse.json(
        { error: 'Current brief content is required' },
        { status: 400 }
      );
    }

    // AI Configuration - using brief improvement agent
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      briefAgentId: process.env.AI_BRIEF_AGENT_ID || '68db998aabd74ae6e0a5fbc8' // Default agent ID
    };

    console.log(`📝 Improving brief for deliverable: ${deliverableId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.briefAgentId}`);

    // Prepare context for brief improvement
    const context = {
      deliverableId: deliverableId,
      deliverableName: deliverableData?.title || 'Unknown Deliverable',
      deliverableType: deliverableData?.type || 'presentation',
      audience: deliverableData?.audience || [],
      projectName: projectData?.name || 'Unknown Project',
      clientName: projectData?.client_name || 'Unknown Client',
      industry: projectData?.industry || 'General',
      currentBrief: currentBrief,
      requestType: 'brief_improvement'
    };

    const message = `Improve the following deliverable brief to make it more comprehensive, clear, and actionable.

Deliverable Details:
- Name: ${deliverableData?.title || 'Unknown Deliverable'}
- Type: ${deliverableData?.type || 'presentation'}
- Audience: ${deliverableData?.audience?.join(', ') || 'Not specified'}
- Project: ${projectData?.name || 'Unknown Project'}
- Client: ${projectData?.client_name || 'Unknown Client'}
- Industry: ${projectData?.industry || 'General'}

Current Brief:
"${currentBrief}"

Please improve this brief by:
1. Adding more specific objectives and success criteria
2. Clarifying the target audience and their needs
3. Including relevant market context and industry considerations
4. Suggesting key messaging and strategic positioning
5. Recommending supporting data and evidence needed
6. Outlining potential challenges and how to address them

Provide the improved brief as a well-structured, comprehensive document that gives clear direction for creating the deliverable. Also provide a brief quality score improvement explanation.

Return the response as JSON with:
- improvedBrief: The enhanced brief content
- qualityScore: Estimated quality score (0-10)
- improvements: Array of specific improvements made
- suggestions: Additional recommendations`;

    try {
      // Try custom agent first
      const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.briefAgentId}/chat`, {
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
        console.log('✅ Brief improved via custom agent');
        
        return NextResponse.json({
          success: true,
          source: 'custom-agent',
          agentId: AI_CONFIG.briefAgentId,
          deliverableId: deliverableId,
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
    console.log('✅ Brief improved via chat endpoint');
    
    return NextResponse.json({
      success: true,
      source: 'chat',
      deliverableId: deliverableId,
      data: chatResult
    });

  } catch (error) {
    console.error('❌ Brief improvement error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to improve brief',
        details: error.message 
      },
      { status: 500 }
    );
  }
}