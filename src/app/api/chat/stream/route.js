import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import ChatService from '../../../../lib/services/ChatService.js';
import BackendProvider from '../../../../lib/ai/BackendProvider.js';
import ProgressiveResponseStreamer from '../../../../lib/communication/ProgressiveResponseStreamer.js';

// Initialize chat service
const chatService = new ChatService();

// Initialize AI provider
const backendProvider = new BackendProvider({
  backendUrl: 'https://ai.vave.ch',
  endpoint: '/api/chat/send-streaming',
  timeout: 30000
});

async function initializeAIProvider() {
  try {
    await backendProvider.initialize();
    chatService.setAIProvider(backendProvider);
    return backendProvider;
  } catch (error) {
    console.error('Failed to initialize AI provider:', error);
    return null;
  }
}

// POST /api/chat/stream - Send a message and get streaming AI response with narratives
export async function POST(request) {
  try {
    // Ensure AI provider is initialized before processing
    await initializeAIProvider();
    
    const body = await request.json();
    const { threadId, message, userId, enableNarratives = true } = body;

    // Validate required fields
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ 
        error: 'Message is required and must be a string' 
      }, { status: 400 });
    }

    // Generate thread ID if not provided
    const finalThreadId = threadId || `thread_${userId || 'user'}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create a readable stream for Server-Sent Events
    const encoder = new TextEncoder();
    
    const stream = new ReadableStream({
      async start(controller) {
        const sendEvent = (type, data) => {
          const eventData = `data: ${JSON.stringify({ type, ...data })}\n\n`;
          controller.enqueue(encoder.encode(eventData));
        };

        try {
          // Send initial status
          sendEvent('status', {
            message: 'Starting analysis...',
            progress: 0,
            timestamp: new Date().toISOString()
          });

          if (enableNarratives) {
            // Create narrative streamer
            const streamer = new ProgressiveResponseStreamer({
              onNarrative: (data) => {
                try {
                  sendEvent('narrative', data);
                } catch (e) {
                  console.warn('Failed to send narrative event:', e.message);
                }
              },
              onStatus: (data) => {
                try {
                  sendEvent('status', data);
                } catch (e) {
                  console.warn('Failed to send status event:', e.message);
                }
              },
              onChunk: (data) => {
                try {
                  sendEvent('chunk', data);
                } catch (e) {
                  console.warn('Failed to send chunk event:', e.message);
                }
              },
              onComplete: (data) => {
                try {
                  sendEvent('complete', data);
                } catch (e) {
                  console.warn('Failed to send complete event:', e.message);
                }
              },
              onError: (data) => {
                try {
                  sendEvent('error', data);
                } catch (e) {
                  console.warn('Failed to send error event:', e.message);
                }
              }
            });

            // Generate narrative response
            const aiProvider = chatService.aiProvider;
            if (aiProvider && aiProvider.generateNarrativeResponse) {
              const response = await aiProvider.generateNarrativeResponse(message, [], {
                onNarrative: (data) => streamer.streamNarrative(data.message, data.type),
                onStatus: (data) => streamer.streamStatus(data.message, data.progress),
                onChunk: (data) => streamer.streamChunk(data.content, data.isComplete),
                onComplete: () => streamer.streamComplete(),
                onError: (data) => streamer.streamError(data.message, data.details)
              });

              // Send final response
              sendEvent('response', {
                content: response,
                threadId: finalThreadId,
                timestamp: new Date().toISOString()
              });
            } else {
              // Fallback to regular response
              const result = await chatService.sendMessage(finalThreadId, message);
              sendEvent('response', {
                content: result.assistantMessage,
                threadId: finalThreadId,
                timestamp: new Date().toISOString()
              });
            }
          } else {
            // Regular response without narratives
            const result = await chatService.sendMessage(finalThreadId, message);
            sendEvent('response', {
              content: result.assistantMessage,
              threadId: finalThreadId,
              timestamp: new Date().toISOString()
            });
          }

          // Send completion event
          sendEvent('complete', {
            timestamp: new Date().toISOString()
          });

        } catch (error) {
          console.error('Streaming error:', error);
          try {
            sendEvent('error', {
              message: 'Failed to process message',
              details: error.message,
              timestamp: new Date().toISOString()
            });
          } catch (e) {
            console.error('Failed to send error event:', e.message);
          }
        } finally {
          try {
            controller.close();
          } catch (e) {
            console.warn('Controller already closed:', e.message);
          }
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Chat stream error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error.message 
    }, { status: 500 });
  }
}
