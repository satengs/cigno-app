/**
 * CIGNO Chat Client Library
 * For connecting external applications to CIGNO Chat Platform
 */
import { authService } from '../auth/AuthService.js';
export default class CIGNOChatClient {
  constructor(config = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3000';
    this.wsUrl = config.wsUrl || 'ws://localhost:8080';
    this.apiKey = config.apiKey;
    this.userId = config.userId || 'anonymous';
    this.mode = config.mode || 'websocket'; // 'websocket' or 'http'
    
    // Connection state
    this.isConnected = false;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 5;
    this.reconnectDelay = config.reconnectDelay || 1000;
    
    // Event handlers
    this.eventHandlers = new Map();
    
    // Message tracking
    this.pendingRequests = new Map();
    this.requestIdCounter = 0;
    
    // Auto-initialize if API key is provided
    if (this.apiKey && config.autoConnect !== false) {
      this.connect();
    }
  }

  /**
   * Connect to CIGNO chat server
   */
  async connect() {
    if (this.mode === 'websocket') {
      await this.connectWebSocket();
    }
    // HTTP mode doesn't need persistent connection
    return this.isConnected;
  }

  /**
   * Connect via WebSocket
   */
  async connectWebSocket() {
    if (!this.apiKey) {
      throw new Error('API key is required for WebSocket connection');
    }

    const wsUrl = `${this.wsUrl}/ws?apiKey=${this.apiKey}&userId=${this.userId}`;
    
    try {
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', { userId: this.userId });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onclose = () => {
        this.isConnected = false;
        this.emit('disconnected');
        this.attemptReconnection();
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.emit('error', { error: 'WebSocket connection error', details: error });
      };

    } catch (error) {
      throw new Error(`Failed to connect to WebSocket: ${error.message}`);
    }
  }

  /**
   * Handle incoming WebSocket message
   */
  handleMessage(data) {
    switch (data.type) {
      case 'connected':
        this.emit('connected', data);
        break;
        
      case 'response':
        this.emit('response', {
          content: data.content,
          threadId: data.threadId,
          timestamp: data.timestamp
        });
        break;
        
      case 'narrative':
        this.emit('narrative', {
          message: data.message,
          timestamp: data.timestamp,
          metadata: data.metadata
        });
        break;
        
      case 'status':
        this.emit('status', {
          message: data.message,
          progress: data.progress,
          timestamp: data.timestamp
        });
        break;
        
      case 'chunk':
        this.emit('chunk', {
          content: data.content,
          isComplete: data.isComplete,
          timestamp: data.timestamp
        });
        break;
        
      case 'complete':
        this.emit('complete', {
          timestamp: data.timestamp
        });
        break;
        
      case 'error':
        this.emit('error', {
          error: data.message,
          details: data.details
        });
        break;
        
      case 'pong':
        // Handle ping/pong for keepalive
        break;
        
      default:
        console.warn('Unknown message type:', data.type);
    }
  }

  /**
   * Send message to chat server
   */
  async sendMessage(message, options = {}) {
    if (!message || typeof message !== 'string') {
      throw new Error('Message must be a non-empty string');
    }

    const threadId = options.threadId;
    
    if (this.mode === 'websocket') {
      return this.sendWebSocketMessage(message, threadId);
    } else {
      return this.sendHttpMessage(message, threadId);
    }
  }

  /**
   * Send message via WebSocket
   */
  async sendWebSocketMessage(message, threadId) {
    if (!this.isConnected || !this.ws) {
      throw new Error('Not connected to WebSocket server');
    }

    const messageData = {
      type: 'message',
      content: message,
      threadId,
      userId: this.userId
    };

    this.ws.send(JSON.stringify(messageData));
    
    // For WebSocket, responses come via event handlers
    return { sent: true, mode: 'websocket' };
  }

  /**
   * Send message via HTTP
   */
  async sendHttpMessage(message, threadId) {
    const url = `${this.baseUrl}/api/chat`;
    const headers = {
      'Content-Type': 'application/json',
      ...authService.getAuthHeaders()
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    const body = JSON.stringify({
      message,
      threadId,
      userId: this.userId
    });

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.ok) {
        const lastMessage = data.data.messages[data.data.messages.length - 1];
        return {
          threadId: data.data.threadId,
          response: lastMessage?.content,
          messages: data.data.messages,
          mode: 'http'
        };
      } else {
        throw new Error(data.error || 'Failed to send message');
      }
    } catch (error) {
      throw new Error(`HTTP request failed: ${error.message}`);
    }
  }

  /**
   * Get chat history
   */
  async getChatHistory(threadId) {
    const url = `${this.baseUrl}/api/chat?threadId=${encodeURIComponent(threadId)}`;
    const headers = {
      ...authService.getAuthHeaders()
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, { headers });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.ok ? data.data : null;
    } catch (error) {
      throw new Error(`Failed to get chat history: ${error.message}`);
    }
  }

  /**
   * Ping server (WebSocket only)
   */
  ping() {
    if (this.isConnected && this.ws) {
      this.ws.send(JSON.stringify({ type: 'ping' }));
    }
  }

  /**
   * Attempt reconnection
   */
  attemptReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.emit('max_reconnect_attempts_reached');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * this.reconnectAttempts;
    
    setTimeout(() => {
      this.emit('reconnecting', { attempt: this.reconnectAttempts });
      this.connectWebSocket().catch(() => {
        // Retry will be handled by onclose event
      });
    }, delay);
  }

  /**
   * Disconnect from server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnected = false;
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent auto-reconnect
  }

  /**
   * Add event listener
   */
  on(event, handler) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event).push(handler);
  }

  /**
   * Remove event listener
   */
  off(event, handler) {
    if (this.eventHandlers.has(event)) {
      const handlers = this.eventHandlers.get(event);
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Emit event to listeners
   */
  emit(event, data) {
    if (this.eventHandlers.has(event)) {
      this.eventHandlers.get(event).forEach(handler => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      mode: this.mode,
      userId: this.userId,
      reconnectAttempts: this.reconnectAttempts,
      hasApiKey: !!this.apiKey
    };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    if (newConfig.apiKey !== undefined) this.apiKey = newConfig.apiKey;
    if (newConfig.userId !== undefined) this.userId = newConfig.userId;
    if (newConfig.baseUrl !== undefined) this.baseUrl = newConfig.baseUrl;
    if (newConfig.wsUrl !== undefined) this.wsUrl = newConfig.wsUrl;
    if (newConfig.mode !== undefined) this.mode = newConfig.mode;
  }
}