import { NextResponse } from 'next/server';
import ChatService from '../../../../lib/services/ChatService.js';
import BackendProvider from '../../../../lib/ai/BackendProvider.js';
import OpenAIProvider from '../../../../lib/ai/OpenAIProvider.js';

const chatService = new ChatService();
const backendProvider = new BackendProvider({
  backendUrl: 'https://ai.vave.ch',
  endpoint: '/api/chat/send-streaming',
  timeout: 5000
});

// GET /api/ai/status - Check AI backend status
export async function GET() {
  try {
    console.log('🔍 Checking AI backend status...');
    
    // Test backend provider initialization
    const backendInitialized = await backendProvider.initialize();
    console.log('   Backend initialized:', backendInitialized);
    
    let status = {
      online: false,
      message: 'AI Backend: Offline',
      details: {
        backend: 'unavailable',
        fallback: 'available',
        mode: 'offline'
      },
      timestamp: new Date().toISOString()
    };

    if (backendInitialized && backendProvider.isAvailable()) {
      status = {
        online: true,
        message: 'AI Backend: Online',
        details: {
          backend: 'available',
          fallback: 'available', 
          mode: 'online'
        },
        timestamp: new Date().toISOString()
      };
      console.log('✅ Backend status: Online');
    } else {
      // Get detailed error information
      const lastError = backendProvider.getLastError();
      console.log('❌ Backend status: Offline', lastError);
      
      if (lastError) {
        status.message = lastError.userMessage || 'AI Backend: Offline';
        status.details.error = lastError.message;
        status.details.errorType = lastError.type;
        status.details.errorTime = lastError.timestamp;
      }
    }

    return NextResponse.json({
      ok: true,
      ...status
    });

  } catch (error) {
    console.error('AI status check error:', error);
    
    return NextResponse.json({
      ok: true,
      online: false,
      message: 'AI Backend: Error',
      details: {
        backend: 'error',
        fallback: 'available',
        mode: 'offline',
        error: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
}