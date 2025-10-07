import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, projectData, topic, category } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // AI Configuration - using insights generation agent
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      insightsAgentId: process.env.AI_INSIGHTS_AGENT_ID || '68dde123c1b3b5cc990ad5f1' // Default agent ID
    };

    console.log(`💡 Generating insights for project: ${projectId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.insightsAgentId}`);

    // Prepare context for insights generation
    const context = {
      projectId: projectId,
      projectName: projectData?.name || 'Unknown Project',
      clientName: projectData?.client_name || 'Unknown Client',
      industry: projectData?.industry || 'General',
      description: projectData?.description || '',
      topic: topic || 'general',
      category: category || 'Market Research',
      requestType: 'insights_generation'
    };

    const message = `Generate actionable insights for the project "${projectData?.name || 'project'}" for client "${projectData?.client_name || 'client'}".

Project Details:
- Industry: ${projectData?.industry || 'Not specified'}
- Description: ${projectData?.description || 'Not provided'}
- Focus Topic: ${topic || 'General analysis'}
- Category: ${category || 'Market Research'}

Please generate 3-5 specific, actionable insights that include:
1. Market trends and implications
2. Strategic recommendations
3. Risk factors and mitigation strategies
4. Competitive advantages
5. Implementation considerations

For each insight, provide:
- Clear, concise title
- Detailed explanation (2-3 sentences)
- Confidence level (0-100%)
- Data source or reasoning
- Category classification
- Relevant tags

Return the response as a JSON structure with insights array.`;

    const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.insightsAgentId}/execute`, {
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

    if (!customAgentResponse.ok) {
      const errorText = await customAgentResponse.text();
      throw new Error(`Custom agent failed (${customAgentResponse.status}): ${errorText}`);
    }

    const agentResult = await customAgentResponse.json();
    console.log('✅ Insights generated via custom agent');
    
    return NextResponse.json({
      success: true,
      source: 'custom-agent',
      agentId: AI_CONFIG.insightsAgentId,
      projectId: projectId,
      topic: topic,
      category: category,
      data: agentResult
    });

  } catch (error) {
    console.error('❌ Insights generation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate insights',
        details: error.message 
      },
      { status: 500 }
    );
  }
}