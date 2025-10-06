import { NextResponse } from 'next/server';
import ProjectChatService from '../../../../lib/services/ProjectChatService.js';
import OpenAIProvider from '../../../../lib/ai/OpenAIProvider.js';
import BackendProvider from '../../../../lib/ai/BackendProvider.js';
import ApiKeyManager from '../../../../lib/auth/ApiKeyManager.js';
import { 
  createSuccessResponse, 
  createErrorResponse, 
  createValidationError,
  logError 
} from '../../../../lib/api/errors.js';

const projectChatService = new ProjectChatService();
const backendProvider = new BackendProvider({
  backendUrl: process.env.AGENT_API_URL || 'https://ai.vave.ch',
  endpoint: '/api/custom-agents/68dddd9ac1b3b5cc990ad5f0/execute',
  timeout: 30000
});
const openAIProvider = new OpenAIProvider();
const apiKeyManager = new ApiKeyManager();

// Track initialization state
let isInitializing = false;
let isInitialized = false;

// Initialize AI provider
async function initializeAIProvider() {
  if (isInitialized || isInitializing) {
    return;
  }
  
  isInitializing = true;
  
  try {
    console.log('Initializing AI provider for project chat...');
    
    // Try Vave AI first if configured
    if (process.env.AGENT_API_URL && process.env.AGENT_API_KEY) {
      console.log('Using Vave AI provider for project chat');
      const vaveProvider = {
        isAvailable: () => true,
        generate: async (messages) => {
          const lastMessage = messages[messages.length - 1];
          const response = await fetch(`${process.env.AGENT_API_URL}/api/custom-agents/68dddd9ac1b3b5cc990ad5f0/execute`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': process.env.AGENT_API_KEY,
            },
            body: JSON.stringify({
              message: lastMessage.content,
              temperature: 0.7,
              maxTokens: 2000
            }),
          });

          if (!response.ok) {
            throw new Error(`Vave AI API failed: ${response.status}`);
          }

          const result = await response.json();
          return result.response || result.content || result.message || 'Response received';
        }
      };
      
      projectChatService.setAIProvider(vaveProvider);
    } else {
      console.log('Vave AI not configured, using fallback providers');
      
      // Try backend provider
      const backendInitialized = await backendProvider.initialize();
      if (backendInitialized) {
        projectChatService.setAIProvider(backendProvider);
      } else {
        // Fallback to OpenAI
        await openAIProvider.initialize();
        projectChatService.setAIProvider(openAIProvider);
      }
    }
    
    isInitialized = true;
    console.log('✅ Project chat AI provider initialized');
  } catch (error) {
    console.error('Project chat AI provider initialization failed:', error);
    isInitialized = true; // Continue with mock responses
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
  const apiKey = request.headers.get('X-API-Key') || 
                 request.headers.get('Authorization')?.replace('Bearer ', '') ||
                 new URL(request.url).searchParams.get('apiKey');

  if (!apiKey) {
    return null; // Allow internal use without API key
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

// POST /api/chat/project - Switch to project context or send message
export async function POST(request) {
  try {
    await initializeAIProvider();
    
    const auth = authenticateRequest(request);
    if (auth?.error) {
      const errorResponse = createErrorResponse('AUTHENTICATION_FAILED', auth.error, auth.rateLimit);
      return NextResponse.json(errorResponse, { status: 401 });
    }

    const body = await request.json();
    const { action, userId, projectId, projectData, message } = body;

    // Validate required fields
    if (!userId || typeof userId !== 'string') {
      const errorResponse = createValidationError(['User ID is required'], 'userId');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (!projectId || typeof projectId !== 'string') {
      const errorResponse = createValidationError(['Project ID is required'], 'projectId');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    let result;

    if (action === 'switch' || !action) {
      // Switch to project context
      result = await projectChatService.switchToProjectContext(userId, projectId, projectData || {});
      
      const responseData = {
        contextId: result.contextId,
        projectId: result.projectId,
        userId: result.userId,
        messages: projectChatService.getVisibleMessages(result.contextId),
        projectData: result.projectData
      };

      return NextResponse.json(createSuccessResponse(responseData, 'Project context loaded'));

    } else if (action === 'send') {
      // Send message in project context
      if (!message || typeof message !== 'string') {
        const errorResponse = createValidationError(['Message is required for send action'], 'message');
        return NextResponse.json(errorResponse, { status: 400 });
      }

      const contextId = projectChatService.createContextId(userId, projectId);
      
      // Ensure context exists
      if (!projectChatService.getProjectConversation(contextId)) {
        await projectChatService.switchToProjectContext(userId, projectId, projectData || {});
      }

      result = await projectChatService.sendProjectMessage(contextId, message);

      const responseData = {
        contextId: result.contextId,
        userMessage: result.userMessage,
        assistantMessage: result.assistantMessage,
        messages: projectChatService.getVisibleMessages(result.contextId),
        conversation: result.conversation
      };

      return NextResponse.json(createSuccessResponse(responseData, 'Message sent successfully'));

    } else {
      const errorResponse = createValidationError(['Invalid action. Use "switch" or "send"'], 'action');
      return NextResponse.json(errorResponse, { status: 400 });
    }

  } catch (error) {
    logError(error, { operation: 'POST /api/chat/project' });
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to process project chat request', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// GET /api/chat/project - Get project chat history or user contexts
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');
    const action = searchParams.get('action') || 'history';

    if (!userId) {
      const errorResponse = createValidationError(['User ID is required'], 'userId');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    if (action === 'contexts') {
      // Get all project contexts for user
      const contexts = projectChatService.getUserProjectContexts(userId);
      
      return NextResponse.json(createSuccessResponse({
        userId,
        contexts,
        totalProjects: contexts.length
      }, 'User project contexts retrieved'));

    } else if (action === 'history') {
      // Get specific project chat history
      if (!projectId) {
        const errorResponse = createValidationError(['Project ID is required for history'], 'projectId');
        return NextResponse.json(errorResponse, { status: 400 });
      }

      const contextId = projectChatService.createContextId(userId, projectId);
      const conversation = projectChatService.getProjectConversation(contextId);
      
      if (!conversation) {
        const errorResponse = createErrorResponse('NOT_FOUND', 'Project conversation not found');
        return NextResponse.json(errorResponse, { status: 404 });
      }

      const messages = projectChatService.getVisibleMessages(contextId);
      
      return NextResponse.json(createSuccessResponse({
        contextId,
        projectId,
        userId,
        messages,
        projectData: conversation.projectData,
        metadata: {
          messageCount: messages.length,
          lastActivity: conversation.lastActivity,
          createdAt: conversation.createdAt
        }
      }, 'Project chat history retrieved'));

    } else {
      const errorResponse = createValidationError(['Invalid action. Use "history" or "contexts"'], 'action');
      return NextResponse.json(errorResponse, { status: 400 });
    }

  } catch (error) {
    logError(error, { operation: 'GET /api/chat/project' });
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to retrieve project chat data', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// DELETE /api/chat/project - Clear project conversation
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const projectId = searchParams.get('projectId');

    if (!userId || !projectId) {
      const errorResponse = createValidationError(['User ID and Project ID are required'], 'userId,projectId');
      return NextResponse.json(errorResponse, { status: 400 });
    }

    const contextId = projectChatService.createContextId(userId, projectId);
    const deleted = projectChatService.clearProjectConversation(contextId);
    
    if (!deleted) {
      const errorResponse = createErrorResponse('NOT_FOUND', 'Project conversation not found');
      return NextResponse.json(errorResponse, { status: 404 });
    }

    return NextResponse.json(createSuccessResponse({
      contextId,
      projectId,
      userId
    }, 'Project conversation cleared'));

  } catch (error) {
    logError(error, { operation: 'DELETE /api/chat/project' });
    
    const errorResponse = createErrorResponse('INTERNAL_ERROR', 'Failed to clear project conversation', {
      originalError: error.message
    });
    return NextResponse.json(errorResponse, { status: 500 });
  }
}