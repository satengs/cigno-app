import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { agentId, message, context } = body;

    if (!agentId) {
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // AI Configuration
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17'
    };

    console.log(`🤖 Calling custom agent: ${agentId}`);
    console.log(`📝 Message: ${message}`);

    // Call custom agent API
    const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${agentId}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': AI_CONFIG.apiKey
      },
      body: JSON.stringify({
        message: message,
        context: context || {}
      })
    });

    if (!customAgentResponse.ok) {
      const errorText = await customAgentResponse.text();
      throw new Error(`Custom agent failed (${customAgentResponse.status}): ${errorText}`);
    }

    const agentResult = await customAgentResponse.json();
    console.log('✅ Custom agent response received');

    return NextResponse.json({
      success: true,
      source: 'custom-agent',
      agentId: agentId,
      data: agentResult
    });

  } catch (error) {
    console.error('❌ Custom agent API error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process custom agent request',
        details: error.message 
      },
      { status: 500 }
    );
  }
}