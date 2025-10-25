/**
 * Direct Storyline Generation API
 * Optimized to call external AI directly without intermediate layers
 */

import { NextResponse } from 'next/server';
import externalAIService from '../../../../../lib/ai/ExternalAIService.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { projectId, projectData = {}, deliverableData = {}, clientData = {} } = body;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // AI Configuration - using storyline generation agent
    const storylineAgentId = process.env.AI_STORYLINE_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0';

    console.log(`📖 Direct storyline generation for project: ${projectId}`);
    console.log(`🤖 Using agent: ${storylineAgentId}`);
    
    const structuredPayload = {
      projectId,
      project: projectData,
      deliverable: deliverableData,
      client: clientData
    };

    // Prepare optimized payload for direct external call
    const payload = {
      message: JSON.stringify(structuredPayload),
      context: {
        requestType: 'generate_storyline',
        projectId,
        source: 'cigno_direct_storyline'
      },
      data: structuredPayload,
      userId: 'cigno-platform-user'
    };

    console.log('🚀 Calling external AI directly...');

    // Call external AI service directly
    const result = await externalAIService.executeAgent(storylineAgentId, payload);

    console.log('✅ Direct storyline generation completed');

    return NextResponse.json({
      success: true,
      source: 'direct_external_ai',
      agentId: storylineAgentId,
      projectId: projectId,
      data: result,
      optimized: true // Flag to indicate this is the optimized flow
    });

  } catch (error) {
    console.error('❌ Direct storyline generation error:', error);

    // Extract more specific error messages
    let errorMessage = 'Failed to generate storyline';
    let statusCode = 500;
    let errorDetails = error.message;

    if (error.message?.includes?.('rate limit')) {
      errorMessage = 'AI service rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes?.('timeout')) {
      errorMessage = 'Storyline generation timeout. Please try again.';
      statusCode = 408;
    } else if (error.message?.includes?.('(4')) {
      statusCode = 400;
      errorMessage = 'Invalid storyline request parameters';
    } else if (error.message?.includes?.('(5')) {
      statusCode = 502;
      errorMessage = 'External AI service unavailable';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        source: 'direct_external_ai',
        optimized: true
      },
      { status: statusCode }
    );
  }
}