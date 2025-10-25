/**
 * Direct AI Execution Status API
 * Optimized route for checking execution status without intermediate layers
 */

import { NextResponse } from 'next/server';
import externalAIService from '../../../../../../lib/ai/ExternalAIService.js';

export async function GET(request, { params }) {
  const startTime = Date.now();
  const { executionId } = params;
  
  try {
    if (!executionId) {
      console.log('❌ Polling API: Missing execution ID');
      return NextResponse.json(
        { error: 'Execution ID is required' },
        { status: 400 }
      );
    }

    console.log(`🔍 POLLING API REQUEST: Checking status for execution: ${executionId}`);
    console.log(`📋 Request URL: ${request.url}`);
    console.log(`📋 Request method: ${request.method}`);
    console.log(`📋 Request headers:`, Object.fromEntries(request.headers.entries()));

    // Get status directly from external AI service
    const status = await externalAIService.getExecutionStatus(executionId);

    const duration = Date.now() - startTime;
    
    console.log(`📊 POLLING API RESPONSE: Status: ${status.status} (${status.progress || 0}%)`);
    console.log(`📋 Response duration: ${duration}ms`);
    console.log(`📋 Full status data:`, JSON.stringify(status, null, 2));

    const responseData = {
      success: true,
      executionId,
      status: status.status,
      progress: status.progress || 0,
      data: status,
      source: 'direct_external_ai',
      pollingInfo: {
        timestamp: new Date().toISOString(),
        duration: duration,
        requestUrl: request.url
      }
    };

    console.log(`📤 POLLING API FINAL RESPONSE:`, JSON.stringify(responseData, null, 2));

    return NextResponse.json(responseData);

  } catch (error) {
    const duration = Date.now() - startTime;
    
    console.error(`❌ POLLING API ERROR: Direct status check error for ${executionId}:`, error);
    console.error(`📋 Error duration: ${duration}ms`);
    console.error(`📋 Error stack:`, error.stack);
    
    let errorMessage = 'Failed to check execution status';
    let statusCode = 500;

    if (error.message?.includes?.('not found')) {
      errorMessage = 'Execution not found';
      statusCode = 404;
    } else if (error.message?.includes?.('timeout')) {
      errorMessage = 'Status check timeout';
      statusCode = 408;
    }

    const errorResponse = {
      error: errorMessage,
      details: error.message,
      executionId,
      source: 'direct_external_ai',
      pollingInfo: {
        timestamp: new Date().toISOString(),
        duration: duration,
        requestUrl: request.url,
        errorType: error.name
      }
    };

    console.log(`📤 POLLING API ERROR RESPONSE:`, JSON.stringify(errorResponse, null, 2));

    return NextResponse.json(errorResponse, { status: statusCode });
  }
}