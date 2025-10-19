import { NextResponse } from 'next/server';
import ChatService from '../../../lib/services/ChatService.js';
import OpenAIProvider from '../../../lib/ai/OpenAIProvider.js';
import BackendProvider from '../../../lib/ai/BackendProvider.js';
import ApiKeyManager from '../../../lib/auth/ApiKeyManager.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError,
  logError 
} from '../../../lib/api/errors.js';

const chatService = new ChatService();
const backendProvider = new BackendProvider({
  backendUrl: process.env.AI_API_BASE_URL || 'https://ai.vave.ch',
  endpoint: '/api/chat/send-streaming',
  apiKey: process.env.AI_API_KEY || '53e53331a91f51237307407ee976d19ccd1be395a96f7931990a326772b12bae',
  timeout: 30000
});
const openAIProvider = new OpenAIProvider(); // Keep as fallback
const apiKeyManager = new ApiKeyManager();

// Track initialization state
let isInitializing = false;
let isInitialized = false;

// Initialize the Backend provider first, fallback to OpenAI if it fails
async function initializeAIProvider() {
  if (isInitialized || isInitializing) {
    return; // Already initialized or currently initializing
  }
  
  isInitializing = true;
  
  try {
    console.log('Attempting to initialize Backend provider...');
    const backendInitialized = await backendProvider.initialize();
    
    if (backendInitialized) {
      console.log('✅ Backend provider initialized successfully');
      chatService.setAIProvider(backendProvider);
      console.log('🔄 Backend provider set in ChatService');
    } else {
      console.log('⚠️ Backend provider failed, falling back to OpenAI provider');
      try {
        await openAIProvider.initialize();
        chatService.setAIProvider(openAIProvider);
        console.log('🔄 OpenAI provider set in ChatService');
      } catch (openAIError) {
        console.log('⚠️ OpenAI provider also failed, using mock responses');
        chatService.setAIProvider(null);
      }
    }
    
    isInitialized = true;
  } catch (error) {
    console.error('Backend provider initialization failed:', error);
    console.log('🔄 Falling back to OpenAI provider...');
    try {
      await openAIProvider.initialize();
      chatService.setAIProvider(openAIProvider);
      console.log('🔄 OpenAI provider set in ChatService (fallback)');
    } catch (fallbackError) {
      console.error('OpenAI provider fallback also failed:', fallbackError);
    }
    isInitialized = true;
  } finally {
    isInitializing = false;
  }
}

/**
 * Authenticate request using API key
 * @param {Request} request - HTTP request
 * @returns {Object|null} Authentication result
 */
function authenticateRequest(request) {
  // Check for API key in headers or query params
  const apiKey = request.headers.get('X-API-Key') || 
                 request.headers.get('Authorization')?.replace('Bearer ', '') ||
                 new URL(request.url).searchParams.get('apiKey');

  if (!apiKey) {
    return null; // No API key provided - allow for internal use
  }

  const keyInfo = apiKeyManager.validateApiKey(apiKey);
  if (!keyInfo) {
    return { error: 'Invalid API key' };
  }

  const rateLimit = apiKeyManager.checkRateLimit(apiKey);
  if (!rateLimit.allowed) {
    return { error: rateLimit.reason, rateLimit };
  }

  return { success: true, keyInfo, rateLimit };
}

// POST /api/chat - Send a message and get AI response
export async function POST(request) {
  try {
    // Ensure AI provider is initialized before processing
    await initializeAIProvider();
    
    // Authenticate external requests
    const auth = authenticateRequest(request);
    if (auth?.error) {
      const errorResponse = createErrorResponse('AUTHENTICATION_FAILED', auth.error, auth.rateLimit);
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const body = await request.json();
    const { threadId, message, userId } = body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      const errorResponse = createValidationError(['Message is required and must be a string'], 'message');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    // Generate thread ID if not provided
    const finalThreadId = threadId || `thread_${userId || 'user'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Send message through chat service
    const result = await chatService.sendMessage(finalThreadId, message);

    // Get the full conversation for response
    const conversation = await chatService.getConversation(finalThreadId);
    
    if (!conversation) {
      const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve conversation after sending message');
      return NextResponse.json(errorResponse, { status: 500 });
    }

    const responseData = {
      threadId: finalThreadId,
      messages: conversation.messages,
      conversation: result.conversation
    };

    // Add rate limit headers for external requests
    const response = NextResponse.json(createSuccessResponse(responseData, 'Message processed successfully'));
    
    if (auth?.success) {
      response.headers.set('X-RateLimit-Limit', auth.rateLimit.limit.toString());
      response.headers.set('X-RateLimit-Current', auth.rateLimit.current.toString());
      response.headers.set('X-RateLimit-Reset', new Date(auth.rateLimit.resetTime).toISOString());
    }

    return response;

  } catch (error) {
    logError(error, { operation: 'POST /api/chat' });
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to process chat message', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET /api/chat - Get chat history and status
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');

    if (!threadId) {
      const errorResponse = createValidationError(['Thread ID is required'], 'threadId');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const conversation = await chatService.getConversation(threadId);
    
    if (!conversation) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Conversation not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    const successResponse = createSuccessResponse({
      threadId,
      messages: conversation.messages,
      metadata: {
        messageCount: conversation.messages.length,
        lastMessage: conversation.messages[conversation.messages.length - 1]?.timestamp || null
      }
    }, 'Chat history retrieved successfully');

    return NextResponse.json(successResponse);

  } catch (error) {
    logError(error, { operation: 'GET /api/chat' });
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve chat history', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/chat - Delete conversation or clear all
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const threadId = searchParams.get('threadId');
    const clearAll = searchParams.get('clearAll') === 'true';

    if (clearAll) {
      // Clear all conversations
      chatService.clearAllConversations();
      
      return NextResponse.json({
        ok: true,
        data: { message: 'All conversations cleared' }
      });
    } else if (threadId) {
      // Delete specific conversation
      const deleted = chatService.deleteConversation(threadId);
      
      if (!deleted) {
        return NextResponse.json({
          ok: false,
          error: 'Conversation not found'
        }, { status: 404 });
      }

      return NextResponse.json({
        ok: true,
        data: { message: 'Conversation deleted' }
      });
    } else {
      return NextResponse.json({
        ok: false,
        error: 'threadId or clearAll parameter required'
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Chat DELETE API error:', error);
    
    return NextResponse.json({
      ok: false,
      error: 'Failed to delete chat data',
      details: error.message
    }, { status: 500 });
  }
}
