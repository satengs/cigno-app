/**
 * Direct AI Agent Execution API
 * Optimized route that calls external AI services directly without intermediate layers
 */

import { NextResponse } from 'next/server';
import externalAIService from '../../../../../lib/ai/ExternalAIService.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const { agentId, message, context = {}, data = {}, useAsync = false } = body;

    // Validate required fields
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

    console.log(`🚀 Direct AI execution - Agent: ${agentId}`);
    console.log(`📝 Message: ${message}`);
    console.log(`⚡ Mode: ${useAsync ? 'Async' : 'Sync'}`);

    // Prepare payload for external AI service
    const payload = {
      message,
      context: {
        ...context,
        requestType: 'direct_execute',
        source: 'cigno_direct_api'
      },
      data,
      userId: context.userId || 'cigno-platform-user'
    };

    // Execute using the optimized external AI service
    const result = await externalAIService.executeAgentSmart(agentId, payload, {
      useAsync,
      pollOptions: {
        maxAttempts: 30,
        initialDelay: 1000,
        maxDelay: 8000
      }
    });

    console.log('✅ Direct AI execution completed');

    return NextResponse.json({
      success: true,
      source: 'direct_external_ai',
      agentId,
      method: useAsync ? 'async' : 'sync',
      data: result
    });

  } catch (error) {
    console.error('❌ Direct AI execution error:', error);
    
    // Extract more specific error information
    let errorMessage = 'Failed to execute AI agent';
    let statusCode = 500;

    if (error.message?.includes?.('timeout')) {
      errorMessage = 'AI agent execution timeout. Please try again.';
      statusCode = 408;
    } else if (error.message?.includes?.('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes?.('(4')) {
      statusCode = 400;
      errorMessage = 'Invalid request parameters';
    } else if (error.message?.includes?.('(5')) {
      statusCode = 502;
      errorMessage = 'External AI service unavailable';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        source: 'direct_external_ai'
      },
      { status: statusCode }
    );
  }
}