/**
 * WebSocket Server for External Chat Connections
 * Handles real-time chat connections from external applications
 */
import { WebSocketServer } from 'ws';
import ChatService from '../services/ChatService.js';
import OpenAIProvider from '../ai/OpenAIProvider.js';

export default class CIGNOWebSocketServer {
  constructor(options = {}) {
    this.port = options.port || 8080;
    this.server = null;
    this.clients = new Map(); // clientId -> { ws, userId, apiKey, metadata }
    this.chatService = new ChatService();
    this.aiProvider = new OpenAIProvider();
    
    // Initialize AI provider
    this.aiProvider.initialize().catch(console.error);
    this.chatService.setAIProvider(this.aiProvider);
    
    // Valid API keys - in production, store these securely
    this.validApiKeys = new Set([
      'd8888197b6edf249bfa0c8dd7ec1af7176d273529802c39ecdd79eb1324065c4',
      'd4abe60bb87d3f6156285c0e0341ccb7965b387638cab06ed4f7d8566e9b3111',
      'ca4f82e78deb36a4d3ebdbf9d22de6db72e2eb9705097a4e0074a3742c746b29',
      'b0d67edcba8e1554253cc96a86b3556b38be1585b14ff8b084468b7646d0180b'
    ]);
  }

  /**
   * Start the WebSocket server
   */
  start() {
    this.server = new WebSocketServer({
      port: this.port,
      path: '/ws'
    });

    this.server.on('connection', (ws, request) => {
      this.handleConnection(ws, request);
    });

    this.server.on('listening', () => {
      console.log(`CIGNO WebSocket Server listening on port ${this.port}`);
    });

    this.server.on('error', (error) => {
      console.error('WebSocket Server error:', error);
    });
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, request) {
    const url = new URL(request.url, `http://${request.headers.host}`);
    const apiKey = url.searchParams.get('apiKey');
    const userId = url.searchParams.get('userId') || 'anonymous';

    // Validate API key
    if (!this.validateApiKey(apiKey)) {
      ws.close(1008, 'Invalid API key');
      return;
    }

    const clientId = this.generateClientId();
    
    // Store client connection
    this.clients.set(clientId, {
      ws,
      userId,
      apiKey,
      metadata: {
        connectedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString()
      }
    });

    // Send connection confirmation
    this.sendMessage(ws, {
      type: 'connected',
      clientId,
      message: 'Connected to CIGNO Chat Server'
    });

    // Handle incoming messages
    ws.on('message', (data) => {
      this.handleMessage(clientId, data);
    });

    // Handle connection close
    ws.on('close', () => {
      this.clients.delete(clientId);
      console.log(`Client ${clientId} (${userId}) disconnected`);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
      this.clients.delete(clientId);
    });

    console.log(`Client ${clientId} (${userId}) connected`);
  }

  /**
   * Handle incoming message from client
   */
  async handleMessage(clientId, data) {
    try {
      const client = this.clients.get(clientId);
      if (!client) return;

      const message = JSON.parse(data.toString());
      
      // Update last activity
      client.metadata.lastActivity = new Date().toISOString();

      switch (message.type) {
        case 'message':
          await this.handleChatMessage(clientId, message);
          break;
          
        case 'ping':
          this.sendMessage(client.ws, { type: 'pong' });
          break;
          
        default:
          this.sendMessage(client.ws, {
            type: 'error',
            message: 'Unknown message type'
          });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      const client = this.clients.get(clientId);
      if (client) {
        this.sendMessage(client.ws, {
          type: 'error',
          message: 'Failed to process message'
        });
      }
    }
  }

  /**
   * Handle chat message
   */
  async handleChatMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const threadId = message.threadId || `thread_${client.userId}_${Date.now()}`;
      
      // Send message through existing ChatService
      const result = await this.chatService.sendMessage(threadId, message.content);
      
      // Send AI response back to client
      this.sendMessage(client.ws, {
        type: 'response',
        threadId: result.threadId,
        content: result.assistantMessage,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error processing chat message:', error);
      this.sendMessage(client.ws, {
        type: 'error',
        message: 'Failed to process chat message',
        details: error.message
      });
    }
  }

  /**
   * Send message to WebSocket client
   */
  sendMessage(ws, message) {
    if (ws.readyState === ws.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  /**
   * Validate API key
   */
  validateApiKey(apiKey) {
    return this.validApiKeys.has(apiKey);
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get connected clients stats
   */
  getStats() {
    const clients = Array.from(this.clients.values());
    return {
      totalConnections: clients.length,
      uniqueUsers: new Set(clients.map(c => c.userId)).size,
      apiKeyUsage: clients.reduce((acc, client) => {
        acc[client.apiKey] = (acc[client.apiKey] || 0) + 1;
        return acc;
      }, {}),
      oldestConnection: clients.length > 0 ? 
        Math.min(...clients.map(c => new Date(c.metadata.connectedAt))) : null
    };
  }

  /**
   * Stop the WebSocket server
   */
  stop() {
    if (this.server) {
      this.server.close();
      // Close all client connections
      this.clients.forEach((client) => {
        client.ws.close();
      });
      this.clients.clear();
      console.log('CIGNO WebSocket Server stopped');
    }
  }
}