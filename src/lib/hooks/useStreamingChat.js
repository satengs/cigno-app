/**
 * Streaming Chat Hook
 * Implements the streaming chat API according to the documentation
 */
import { useState, useCallback } from 'react';

export function useStreamingChat() {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Send a streaming message according to the documentation
   * @param {string} message - The message to send
   * @param {string} userId - User identifier
   * @param {string} chatId - Chat identifier
   * @param {Array} attachments - Optional attachments for context
   */
  const sendMessage = useCallback(async (message, userId, chatId, attachments = []) => {
    if (!message || !userId || !chatId) {
      throw new Error('Message, userId, and chatId are required');
    }

    setIsLoading(true);
    setError(null);

    // Add user message to chat
    const userMessage = {
      id: `user_${Date.now()}`,
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          userId,
          chatId,
          ...(attachments.length > 0 && { attachments })
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Handle streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6));
                console.log('AI says:', data.response); // Log streaming response

                // Handle different response types from the API
                if (data.type === 'narrative') {
                  // Add narrative message
                  const narrativeMessage = {
                    id: `narrative_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    type: 'narrative',
                    content: data.content,
                    timestamp: data.timestamp || new Date().toISOString()
                  };
                  setMessages(prev => [...prev, narrativeMessage]);
                } else if (data.role === 'assistant' && data.content) {
                  // Handle streaming assistant response
                  fullResponse = data.content;
                  
                  // Update the assistant message with streaming content
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    if (lastMessage && lastMessage.type === 'assistant') {
                      // Update existing assistant message
                      lastMessage.content = fullResponse;
                    } else {
                      // Add new assistant message
                      newMessages.push({
                        id: data.id || `assistant_${Date.now()}`,
                        type: 'assistant',
                        content: fullResponse,
                        timestamp: data.timestamp || new Date().toISOString()
                      });
                    }
                    return newMessages;
                  });
                } else if (data.response) {
                  // Handle response according to documentation
                  fullResponse += data.response;
                  
                  // Update the assistant message with streaming content
                  setMessages(prev => {
                    const newMessages = [...prev];
                    const lastMessage = newMessages[newMessages.length - 1];
                    
                    if (lastMessage && lastMessage.type === 'assistant') {
                      // Update existing assistant message
                      lastMessage.content = fullResponse;
                    } else {
                      // Add new assistant message
                      newMessages.push({
                        id: `assistant_${Date.now()}`,
                        type: 'assistant',
                        content: fullResponse,
                        timestamp: new Date().toISOString()
                      });
                    }
                    return newMessages;
                  });
                } else if (data.error) {
                  throw new Error(data.error);
                }
              } catch (e) {
                console.warn('Failed to parse stream data:', e);
              }
            }
          }
        }
      }

      console.log('✅ Streaming completed:', fullResponse);
      return fullResponse;

    } catch (error) {
      console.error('❌ Streaming chat error:', error);
      setError(error.message);
      
      // Add error message to chat
      const errorMessage = {
        id: `error_${Date.now()}`,
        type: 'error',
        content: `Error: ${error.message}`,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear all messages
   */
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  /**
   * Add context attachments to a message
   * @param {string} title - Attachment title
   * @param {Object} body - Attachment body data
   * @param {string} type - Attachment type (default: 'context')
   */
  const createContextAttachment = useCallback((title, body, type = 'context') => {
    return {
      type,
      title,
      body
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    createContextAttachment
  };
}

export default useStreamingChat;
