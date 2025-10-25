/**
 * Direct Async AI Execution API
 * Step 1: Starts async execution and returns executionId immediately
 * Client then polls /api/ai/direct/status/{executionId} for completion
 */

import { NextResponse } from 'next/server';
import externalAIService from '../../../../../lib/ai/ExternalAIService.js';

export async function POST(request) {
  const startTime = Date.now();
  
  try {
    console.log(`🚀 ASYNC EXECUTE API REQUEST: Starting async execution`);
    console.log(`📋 Request URL: ${request.url}`);
    console.log(`📋 Request method: ${request.method}`);
    console.log(`📋 Request headers:`, Object.fromEntries(request.headers.entries()));

    const body = await request.json();
    const { agentId, message, context = {}, data = {} } = body;

    console.log(`📋 Request body:`, JSON.stringify(body, null, 2));

    // Validate required fields
    if (!agentId) {
      console.log('❌ Async Execute API: Missing agent ID');
      return NextResponse.json(
        { error: 'Agent ID is required' },
        { status: 400 }
      );
    }

    if (!message) {
      console.log('❌ Async Execute API: Missing message');
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log(`🚀 ASYNC EXECUTE: Starting async execution - Agent: ${agentId}`);
    console.log(`📝 Message: ${message}`);
    console.log(`📋 Context:`, JSON.stringify(context, null, 2));

    // Prepare payload for external AI service
    const payload = {
      message,
      context: {
        ...context,
        requestType: 'async_execute',
        source: 'cigno_direct_async'
      },
      data,
      userId: context.userId || 'cigno-platform-user'
    };

    // Step 1: Start async execution
    console.log('🔄 Calling execute-async endpoint...');
    const asyncResult = await externalAIService.executeAgentAsync(agentId, payload);

    // Extract execution ID
    const executionId = asyncResult.executionId || asyncResult.id || asyncResult.execution_id;

    if (!executionId) {
      console.warn('⚠️ No execution ID returned from async start');
      return NextResponse.json({
        success: false,
        error: 'No execution ID returned from async execution start',
        details: asyncResult
      }, { status: 500 });
    }

    console.log(`✅ ASYNC EXECUTE SUCCESS: Execution started with ID: ${executionId}`);

    const duration = Date.now() - startTime;
    
    const responseData = {
      success: true,
      source: 'direct_external_ai_async',
      agentId,
      executionId,
      status: 'pending',
      message: 'Execution started successfully',
      pollUrl: `/api/ai/direct/status/${executionId}`,
      instructions: {
        step1: 'Execution started with executionId',
        step2: `Poll GET /api/ai/direct/status/${executionId} for status updates`,
        step3: 'Continue polling until status is "complete" or "failed"'
      },
      executionInfo: {
        timestamp: new Date().toISOString(),
        duration: duration,
        requestUrl: request.url
      }
    };

    console.log(`📤 ASYNC EXECUTE RESPONSE:`, JSON.stringify(responseData, null, 2));

    // Return immediately with execution ID and polling instructions
    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Direct async execution error:', error);
    
    let errorMessage = 'Failed to start async AI agent execution';
    let statusCode = 500;

    if (error.message?.includes?.('timeout')) {
      errorMessage = 'Async execution start timeout. Please try again.';
      statusCode = 408;
    } else if (error.message?.includes?.('rate limit')) {
      errorMessage = 'API rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message?.includes?.('(4')) {
      statusCode = 400;
      errorMessage = 'Invalid async execution parameters';
    } else if (error.message?.includes?.('(5')) {
      statusCode = 502;
      errorMessage = 'External AI service unavailable';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message,
        source: 'direct_external_ai_async'
      },
      { status: statusCode }
    );
  }
}