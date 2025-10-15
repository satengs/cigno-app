#!/usr/bin/env node

/**
 * CIGNO Chat Server Startup Script
 * Initializes both HTTP and WebSocket servers for external chat connections
 */

import CIGNOWebSocketServer from '../src/lib/websocket/WebSocketServer.js';
import { ChatConfig } from '../src/lib/config/chat.js';

class ChatServerManager {
  constructor() {
    this.wsServer = null;
    this.isShuttingDown = false;
  }

  /**
   * Start the chat server
   */
  async start() {
    console.log('🚀 Starting CIGNO Chat Server...');
    console.log(`📊 Configuration:
  - HTTP Port: ${ChatConfig.server.httpPort}
  - WebSocket Port: ${ChatConfig.server.wsPort}
  - Base URL: ${ChatConfig.server.baseUrl}
  - WebSocket URL: ${ChatConfig.server.wsUrl}
  - AI Provider: ${ChatConfig.ai.provider}
  - Rate Limit: ${ChatConfig.api.rateLimit.maxRequests} requests/${ChatConfig.api.rateLimit.windowMs}ms
`);

    try {
      // Start WebSocket server
      this.wsServer = new CIGNOWebSocketServer({
        port: ChatConfig.server.wsPort
      });
      
      await this.wsServer.start();

      console.log(`✅ CIGNO Chat Server started successfully!

🔗 Connection Information:
  - HTTP API: ${ChatConfig.server.baseUrl}/api/chat
  - WebSocket: ${ChatConfig.server.wsUrl}/ws
  - Health Check: ${ChatConfig.server.baseUrl}/api/health
  - Next.js App: ${ChatConfig.server.baseUrl}

🔑 API Keys:
  - Production: ${ChatConfig.apiKeys.production}
  - Development: ${ChatConfig.apiKeys.development}
  - Consultant: ${ChatConfig.apiKeys.consultant}
  - Manager: ${ChatConfig.apiKeys.manager}

📖 Usage Examples:

WebSocket Connection:
  ws://localhost:${ChatConfig.server.wsPort}/ws?apiKey=${ChatConfig.apiKeys.development}&userId=test_user

HTTP Request:
  curl -X POST ${ChatConfig.server.baseUrl}/api/chat \\
    -H "X-API-Key: ${ChatConfig.apiKeys.development}" \\
    -H "Content-Type: application/json" \\
    -d '{"message": "Hello CIGNO!", "userId": "test_user"}'

Server is ready to accept connections! 🎉
`);

      // Setup graceful shutdown
      this.setupGracefulShutdown();

    } catch (error) {
      console.error('❌ Failed to start CIGNO Chat Server:', error);
      process.exit(1);
    }
  }

  /**
   * Setup graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      
      console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
      this.isShuttingDown = true;

      try {
        if (this.wsServer) {
          console.log('📡 Closing WebSocket server...');
          this.wsServer.stop();
        }

        console.log('✅ CIGNO Chat Server stopped gracefully');
        process.exit(0);
      } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
      }
    };

    // Handle different shutdown signals
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR1', () => shutdown('SIGUSR1'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('unhandledRejection');
    });
  }

  /**
   * Get server status
   */
  getStatus() {
    return {
      wsServer: this.wsServer ? this.wsServer.getStats() : null,
      config: {
        httpPort: ChatConfig.server.httpPort,
        wsPort: ChatConfig.server.wsPort,
        aiProvider: ChatConfig.ai.provider
      }
    };
  }
}

// Start the server if this file is run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const chatServer = new ChatServerManager();
  chatServer.start().catch(console.error);
}

export default ChatServerManager;