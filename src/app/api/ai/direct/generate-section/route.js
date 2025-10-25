/**
 * Direct Section Generation API
 * Optimized to call external AI directly for async section generation
 */

import { NextResponse } from 'next/server';
import externalAIService from '../../../../../lib/ai/ExternalAIService.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { sectionId, projectId, sectionData = {}, useAsync = true } = body;

    if (!sectionId) {
      return NextResponse.json(
        { error: 'Section ID is required' },
        { status: 400 }
      );
    }

    // AI Configuration
    const agentId = process.env.AI_SECTION_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0';

    console.log(`📄 Direct section generation - Section: ${sectionId}`);
    console.log(`🤖 Using agent: ${agentId}`);
    console.log(`⚡ Mode: ${useAsync ? 'Async' : 'Sync'}`);

    // Prepare optimized payload for direct external call
    const payload = {
      message: `Generate section content for section ID: ${sectionId}`,
      context: {
        requestType: 'generate_section',
        sectionId,
        projectId,
        source: 'cigno_direct_section'
      },
      data: {
        sectionId,
        projectId,
        ...sectionData
      },
      userId: 'cigno-platform-user'
    };

    console.log('🚀 Calling external AI directly...');

    // Call external AI service directly with smart execution
    const result = await externalAIService.executeAgentSmart(agentId, payload, {
      useAsync,
      pollOptions: {
        maxAttempts: 60, // Increased for section generation
        initialDelay: 2000, // Start with 2 seconds
        maxDelay: 15000, // Max 15 seconds between polls
        backoffFactor: 1.3
      }
    });

    console.log('✅ Direct section generation completed');

    return NextResponse.json({
      success: true,
      source: 'direct_external_ai',
      agentId,
      sectionId,
      projectId,
      method: useAsync ? 'async' : 'sync',
      data: result,
      optimized: true
    });

  } catch (error) {
    console.error('❌ Direct section generation error:', error);

    let errorMessage = 'Failed to generate section';
    let statusCode = 500;

    if (error.message?.includes?.('timeout')) {
      errorMessage = 'Section generation timeout. Content generation is taking longer than expected.';
      statusCode = 408;
    } else if (error.message?.includes?.('rate limit')) {
      errorMessage = 'AI service rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes?.('polling timeout')) {
      errorMessage = 'Section generation is taking longer than expected. Please check status manually.';
      statusCode = 408;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        source: 'direct_external_ai',
        optimized: true
      },
      { status: statusCode }
    );
  }
}