/**
 * React Hook for CIGNO Chat Integration
 * Provides easy chat integration for external React applications
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import CIGNOChatClient from '../client/CIGNOChatClient.js';

export function useCIGNOChat(config = {}) {
  // State management
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Refs
  const clientRef = useRef(null);
  const currentThreadId = useRef(null);

  // Initialize client
  useEffect(() => {
    if (!config.apiKey) {
      setError('API key is required');
      return;
    }

    clientRef.current = new CIGNOChatClient({
      baseUrl: config.baseUrl || 'http://localhost:3000',
      wsUrl: config.wsUrl || 'ws://localhost:8080',
      apiKey: config.apiKey,
      userId: config.userId || 'anonymous',
      mode: config.mode || 'websocket',
      autoConnect: config.autoConnect !== false
    });

    const client = clientRef.current;

    // Event handlers
    client.on('connected', () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      setError(null);
    });

    client.on('disconnected', () => {
      setIsConnected(false);
      setConnectionStatus('disconnected');
    });

    client.on('reconnecting', (data) => {
      setConnectionStatus(`reconnecting (${data.attempt})`);
    });

    client.on('response', (data) => {
      const assistantMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'assistant',
        content: data.content,
        timestamp: data.timestamp || new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsLoading(false);
      currentThreadId.current = data.threadId;
    });

    client.on('narrative', (data) => {
      const narrativeMessage = {
        id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'narrative',
        content: data.message,
        timestamp: data.timestamp || new Date().toISOString(),
        metadata: data.metadata
      };

      setMessages(prev => [...prev, narrativeMessage]);
    });

    client.on('status', (data) => {
      // Handle status updates (typing indicators, progress, etc.)
      console.log('Status update:', data.message, data.progress);
    });

    client.on('chunk', (data) => {
      // Handle streaming content chunks
      console.log('Content chunk:', data.content, data.isComplete);
    });

    client.on('complete', (data) => {
      // Handle completion
      console.log('Message complete');
      setIsLoading(false);
    });

    client.on('error', (data) => {
      setError(data.error);
      setIsLoading(false);
      setConnectionStatus('error');
    });

    client.on('max_reconnect_attempts_reached', () => {
      setError('Failed to reconnect to chat server');
      setConnectionStatus('failed');
    });

    // Cleanup
    return () => {
      client.disconnect();
    };
  }, [config.apiKey, config.baseUrl, config.wsUrl, config.userId, config.mode]);

  /**
   * Send a message
   */
  const sendMessage = useCallback(async (messageText) => {
    if (!messageText?.trim()) {
      setError('Message cannot be empty');
      return;
    }

    if (!clientRef.current) {
      setError('Chat client not initialized');
      return;
    }

    setIsLoading(true);
    setError(null);

    // Add user message to UI
    const userMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);

    try {
      const result = await clientRef.current.sendMessage(messageText, {
        threadId: currentThreadId.current
      });

      // For HTTP mode, add response immediately
      if (result.mode === 'http' && result.response) {
        const assistantMessage = {
          id: `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, assistantMessage]);
        currentThreadId.current = result.threadId;
        setIsLoading(false);
      }

      // For WebSocket mode, response will come via event handler
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
      
      // Remove the user message that failed to send
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    }
  }, []);

  /**
   * Load chat history
   */
  const loadChatHistory = useCallback(async (threadId) => {
    if (!clientRef.current || !threadId) return;

    try {
      const history = await clientRef.current.getChatHistory(threadId);
      if (history && history.messages) {
        const formattedMessages = history.messages.map((msg, index) => ({
          id: msg.id || `msg_${index}_${Date.now()}`,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));
        setMessages(formattedMessages);
        currentThreadId.current = threadId;
      }
    } catch (err) {
      setError(`Failed to load chat history: ${err.message}`);
    }
  }, []);

  /**
   * Clear messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
    currentThreadId.current = null;
  }, []);

  /**
   * Retry connection
   */
  const retryConnection = useCallback(() => {
    if (clientRef.current) {
      setError(null);
      setConnectionStatus('connecting');
      clientRef.current.connect();
    }
  }, []);

  /**
   * Get current thread ID
   */
  const getCurrentThreadId = useCallback(() => {
    return currentThreadId.current;
  }, []);

  /**
   * Update client configuration
   */
  const updateConfig = useCallback((newConfig) => {
    if (clientRef.current) {
      clientRef.current.updateConfig(newConfig);
    }
  }, []);

  return {
    // State
    messages,
    isConnected,
    isLoading,
    error,
    connectionStatus,
    
    // Actions
    sendMessage,
    loadChatHistory,
    clearMessages,
    retryConnection,
    getCurrentThreadId,
    updateConfig,
    
    // Utils
    client: clientRef.current
  };
}

export default useCIGNOChat;