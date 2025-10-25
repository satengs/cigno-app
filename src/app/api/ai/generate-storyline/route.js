import { NextResponse } from 'next/server';
import getRequiredAiApiKey from '../../../../lib/ai/getRequiredAiApiKey.js';
import aiLogger from '../../../../lib/logging/aiLogger.js';

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
    const AI_CONFIG = {
      baseUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
      apiKey: process.env.AI_API_KEY || 'b51b67b2924988b88809a421bd3cfb09d9a58d19ac746053f358e11b2895ac17',
      storylineAgentId: process.env.AI_STORYLINE_AGENT_ID || '68dddd9ac1b3b5cc990ad5f0' // Default agent ID
    };

    console.log(`📖 Generating storyline for project: ${projectId}`);
    console.log(`🤖 Using agent: ${AI_CONFIG.storylineAgentId}`);
    
    // Log the received data for verification
    console.log('📊 Project Data:', projectData);
    console.log('📋 Deliverable Data:', deliverableData);
    console.log('🏢 Client Data:', clientData);

    const structuredPayload = {
      projectId,
      project: projectData,
      deliverable: deliverableData,
      client: clientData
    };

    const sanitisedContext = sanitiseAgentContext(structuredPayload);

    const agentPayload = {
      message: JSON.stringify(structuredPayload),
      context: {
        ...sanitisedContext,
        requestType: 'generate_storyline',
        projectId
      },
      data: structuredPayload
    };

    console.log('📤 Context sent to storyline agent:', JSON.stringify(agentPayload.context, null, 2));
    console.log('🚀 Storyline agent payload:', JSON.stringify(agentPayload, null, 2));

    // Log the AI request
    const requestId = aiLogger.logAIRequest({
      url: `${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.storylineAgentId}/execute`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': '[REDACTED]'
      },
      payload: agentPayload,
      agentId: AI_CONFIG.storylineAgentId,
      requestType: 'generate_storyline',
      projectId: projectId,
      userId: 'cigno-platform-user'
    });

    const startTime = Date.now();

    try {
      // Try custom agent first
      const customAgentResponse = await fetch(`${AI_CONFIG.baseUrl}/api/custom-agents/${AI_CONFIG.storylineAgentId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': AI_CONFIG.apiKey
        },
        body: JSON.stringify(agentPayload)
      });

      if (!customAgentResponse.ok) {
        const errorText = await customAgentResponse.text();
        const sanitized = sanitiseAgentError(errorText);

        const agentError = new Error('CUSTOM_AGENT_ERROR');
        agentError.status = customAgentResponse.status;
        agentError.agentMessage = sanitized.message;
        agentError.agentDetails = sanitized.details;

        console.error('❌ Storyline agent call failed:', {
          status: customAgentResponse.status,
          message: agentError.agentMessage,
          preview: typeof errorText === 'string' ? errorText.slice(0, 200) : null
        });

        throw agentError;
      }

      const agentResult = await customAgentResponse.json();
      console.log('✅ Storyline generated via custom agent', agentResult);

      // Log successful response
      aiLogger.logAIResponse(requestId, {
        status: customAgentResponse.status,
        success: true,
        duration: Date.now() - startTime,
        responseSize: JSON.stringify(agentResult).length,
        agentId: AI_CONFIG.storylineAgentId,
        source: 'custom-agent'
      });

      return NextResponse.json({
        success: true,
        source: 'custom-agent',
        agentId: AI_CONFIG.storylineAgentId,
        projectId: projectId,
        data: agentResult
      });
    } catch (agentError) {
      const diagnostic = summariseAgentFailure(agentError);

      console.warn('❌ Storyline agent call failed. No fallback available.', diagnostic);

      // Log failed response
      aiLogger.logAIResponse(requestId, {
        status: diagnostic.status || agentError.status || 502,
        success: false,
        duration: Date.now() - startTime,
        error: diagnostic.message,
        agentId: AI_CONFIG.storylineAgentId,
        source: 'custom-agent'
      });

      const wrappedError = new Error('CUSTOM_AGENT_ERROR');
      wrappedError.status = diagnostic.status || agentError.status || 502;
      wrappedError.agentMessage = diagnostic.message;
      wrappedError.agentDetails = diagnostic.details;

      throw wrappedError;
    }

  } catch (error) {
    console.error('❌ Storyline generation error:', error);

    // Extract more specific error messages
    let errorMessage = 'Failed to generate storyline';
    let statusCode = 500;
    let errorDetails = error.message;

    if (error.message?.includes?.('rate limit')) {
      errorMessage = 'OpenAI rate limit exceeded. Please try again in a few minutes.';
      statusCode = 429;
    } else if (error.message === 'CUSTOM_AGENT_ERROR') {
      statusCode = error.status || 502;
      errorMessage = error.agentMessage || errorMessage;
      errorDetails = error.agentDetails || errorDetails;
    } else if (error.message?.includes?.('Custom agent failed')) {
      // Backwards compatibility for any remaining string-based errors
      const match = error.message.match(/Custom agent failed \((\d+)\): (.+)/);
      if (match) {
        const [, status, rawBody] = match;
        statusCode = Number(status) || statusCode;
        const sanitised = sanitiseAgentError(rawBody);
        errorMessage = sanitised.message || errorMessage;
        errorDetails = sanitised.details || errorDetails;
      }
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails
      },
      { status: statusCode }
    );
  }
}

function sanitiseAgentError(rawText) {
  if (!rawText) {
    return {
      message: 'Storyline agent returned an empty error response.',
      details: null
    };
  }

  if (typeof rawText !== 'string') {
    return {
      message: 'Storyline agent returned an unexpected error payload.',
      details: rawText
    };
  }

  const trimmed = rawText.trim();

  if (!trimmed) {
    return {
      message: 'Storyline agent returned an empty error response.',
      details: null
    };
  }

  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        message: parsed.error || parsed.message || 'Storyline agent reported an error.',
        details: parsed
      };
    } catch {
      // Fall through to additional checks if JSON parsing fails
    }
  }

  if (/<!DOCTYPE\s+html>/i.test(trimmed) || /<html/i.test(trimmed)) {
    return {
      message: 'Storyline agent returned an HTML error page. Verify the agent endpoint configuration.',
      details: 'HTML response received from agent'
    };
  }

  return {
    message: trimmed.slice(0, 200),
    details: trimmed.slice(0, 500)
  };
}

function summariseAgentFailure(error) {
  if (!error) {
    return {
      type: 'agent_error',
      message: 'Unknown agent failure occurred.',
      details: null,
      status: 502
    };
  }

  if (error.message === 'CUSTOM_AGENT_ERROR') {
    return {
      type: 'agent_error',
      status: error.status,
      message: error.agentMessage || 'Storyline agent reported an error.',
      details: error.agentDetails || null
    };
  }

  if (typeof error === 'string') {
    const sanitised = sanitiseAgentError(error);
    return {
      type: 'agent_error',
      message: sanitised.message,
      details: sanitised.details,
      status: 502
    };
  }

  if (error instanceof Error) {
    return {
      type: 'agent_error',
      message: error.message || 'Storyline agent failed with an unexpected error.',
      details: null,
      status: error.status || 502
    };
  }

  return {
    type: 'agent_error',
    message: 'Storyline agent encountered an unexpected error payload.',
    details: error,
    status: 502
  };
}

function sanitiseAgentContext(value, depth = 0) {
  if (value == null) {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return value;
  }

  if (Array.isArray(value)) {
    const items = value
      .map(item => sanitiseAgentContext(item, depth + 1))
      .filter(item => item !== undefined);
    return items.length ? items : undefined;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).reduce((acc, [key, val]) => {
      const sanitised = sanitiseAgentContext(val, depth + 1);

      if (sanitised === undefined) {
        return acc;
      }

      if (key === 'data' || key === 'raw' || key === 'buffer' || key === 'file' || key === 'files' || key === 'attachments') {
        return acc;
      }

      acc[key] = sanitised;
      return acc;
    }, {});

    const keys = Object.keys(entries);
    if (!keys.length) {
      return depth === 0 ? {} : undefined;
    }

    return entries;
  }

  return undefined;
}
