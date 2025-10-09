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
      storylineAgentId: process.env.AI_STORYLINE_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0' // Default agent ID
    };

    console.log(`📖 Generating storyline for project: ${projectId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.storylineAgentId}`);

    const structuredPayload = {
      projectId,
      project: projectData,
      deliverable: deliverableData
    };

    const message = `Generate a comprehensive storyline structure for the project "${projectData?.name || 'project'}" for client "${projectData?.client_name || 'client'}".

Deliverable focus:
- Title: ${deliverableData?.name || 'Unnamed Deliverable'}
- Type: ${deliverableData?.type || 'recommendation'}
- Format: ${deliverableData?.format || 'unspecified'}
- Priority: ${deliverableData?.priority || 'medium'}
- Due date: ${deliverableData?.due_date || deliverableData?.dueDate || 'not provided'}
- Audience: ${(deliverableData?.audience || []).join(', ') || 'General stakeholders'}
- Brief: ${deliverableData?.brief || 'No brief provided'}

Project Details:
- Industry: ${projectData?.industry || 'Not specified'}
- Description: ${projectData?.description || 'Not provided'}

Structured data JSON (use this for precise fields):
${JSON.stringify(structuredPayload, null, 2)}

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

Return the response as a JSON structure with sections array. Include deliverable-specific recommendations where relevant.`;

    try {
      // Try custom agent first
      const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.storylineAgentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_CONFIG.apiKey
        },
        body: JSON.stringify({
          message,
        })
      });

      if (!customAgentResponse.ok) {
        const errorText = await customAgentResponse.text();
        throw new Error(`Custom agent failed (${customAgentResponse.status}): ${errorText}`);
      }

      const agentResult = await customAgentResponse.json();
      console.log('✅ Storyline generated via custom agent', agentResult);

      return NextResponse.json({
        success: true,
        source: 'custom-agent',
        agentId: AI_CONFIG.storylineAgentId,
        projectId: projectId,
        data: agentResult
      });
    } catch (agentError) {
      throw agentError;
    }

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
