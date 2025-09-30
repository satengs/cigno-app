import { NextRequest } from 'next/server';
import CIGNOWebSocketServer from '../../../lib/websocket/WebSocketServer.js';

// Global WebSocket server instance
let wsServer = null;

/**
 * Initialize WebSocket server if not already running
 */
function initializeWebSocketServer() {
  if (!wsServer) {
    wsServer = new CIGNOWebSocketServer({
      port: process.env.WS_PORT || 8080
    });
    wsServer.start();
    
    // Cleanup on process exit
    process.on('SIGINT', () => {
      if (wsServer) {
        wsServer.stop();
      }
    });
    
    process.on('SIGTERM', () => {
      if (wsServer) {
        wsServer.stop();
      }
    });
  }
  return wsServer;
}

/**
 * GET /api/ws - WebSocket server info
 */
export async function GET(request) {
  try {
    const server = initializeWebSocketServer();
    const stats = server.getStats();
    
    return Response.json({
      ok: true,
      data: {
        status: 'running',
        port: process.env.WS_PORT || 8080,
        wsUrl: `ws://localhost:${process.env.WS_PORT || 8080}/ws`,
        stats,
        endpoints: {
          connection: `ws://localhost:${process.env.WS_PORT || 8080}/ws?apiKey=YOUR_API_KEY&userId=YOUR_USER_ID`,
          health: '/api/ws/health'
        }
      }
    });
  } catch (error) {
    console.error('WebSocket API error:', error);
    
    return Response.json({
      ok: false,
      error: 'Failed to get WebSocket server status',
      details: error.message
    }, { status: 500 });
  }
}

/**
 * POST /api/ws - Control WebSocket server
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    switch (action) {
      case 'start':
        const server = initializeWebSocketServer();
        return Response.json({
          ok: true,
          data: { message: 'WebSocket server started', port: process.env.WS_PORT || 8080 }
        });
        
      case 'stop':
        if (wsServer) {
          wsServer.stop();
          wsServer = null;
        }
        return Response.json({
          ok: true,
          data: { message: 'WebSocket server stopped' }
        });
        
      case 'restart':
        if (wsServer) {
          wsServer.stop();
        }
        wsServer = new CIGNOWebSocketServer({
          port: process.env.WS_PORT || 8080
        });
        wsServer.start();
        
        return Response.json({
          ok: true,
          data: { message: 'WebSocket server restarted', port: process.env.WS_PORT || 8080 }
        });
        
      case 'stats':
        if (!wsServer) {
          return Response.json({
            ok: false,
            error: 'WebSocket server not running'
          }, { status: 400 });
        }
        
        return Response.json({
          ok: true,
          data: wsServer.getStats()
        });
        
      default:
        return Response.json({
          ok: false,
          error: 'Invalid action. Use: start, stop, restart, stats'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('WebSocket control API error:', error);
    
    return Response.json({
      ok: false,
      error: 'Failed to control WebSocket server',
      details: error.message
    }, { status: 500 });
  }
}