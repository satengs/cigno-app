/**
 * Chat Service
 * Manages chat conversations and AI interactions
 */

// Dynamic import for server-only modules
async function getServerModules() {
  if (typeof window !== 'undefined') {
    return { ChatMessage: null, connectDB: null };
  }
  
  const [chatMessageModule, connectDBModule] = await Promise.all([
    import('../models/ChatMessage.js'),
    import('../db/mongoose.js')
  ]);
  
  return {
    ChatMessage: chatMessageModule.default,
    connectDB: connectDBModule.default
  };
}

export default class ChatService {
  constructor(aiProvider = null) {
    this.aiProvider = aiProvider;
    this.conversations = new Map(); // threadId -> conversation
  }

  /**
   * Send a message and get AI response
   * @param {string} threadId - Conversation thread identifier
   * @param {string} userMessage - User's message content
   * @returns {Promise<Object>} Response with assistant message
   */
  async sendMessage(threadId, userMessage) {
    try {
      // Validate inputs
      if (!threadId || typeof threadId !== 'string') {
        throw new Error('Invalid threadId provided');
      }
      
      if (!userMessage || typeof userMessage !== 'string') {
        throw new Error('Invalid user message provided');
      }

      // Get or create conversation thread
      let conversation = this.conversations.get(threadId);
      if (!conversation) {
        conversation = this.createNewThread(threadId);
        this.conversations.set(threadId, conversation);
      }

      // Add user message to conversation
      const userMsg = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(userMsg);

      // Save user message to database
      await this.saveMessageToDatabase(threadId, userMsg);

      // Generate AI response
      let assistantMessage;
      if (this.aiProvider && this.aiProvider.isAvailable()) {
        console.log('🤖 Using AI provider for response generation');
        try {
          // Use AI provider if available
          assistantMessage = await this.generateAIResponse(conversation.messages);
        } catch (error) {
          console.log('⚠️ AI provider failed, falling back to intelligent mock response:', error.message);
          // Fallback to intelligent mock response
          assistantMessage = this.generateIntelligentMockResponse(userMessage);
        }
      } else {
        console.log('🎭 Operating in offline mode (AI backend unavailable)');
        if (this.aiProvider && this.aiProvider.getLastError) {
          const lastError = this.aiProvider.getLastError();
          if (lastError && lastError.userMessage) {
            console.log('ℹ️ Offline reason:', lastError.userMessage);
          }
        }
        // Fallback to intelligent mock response with offline indicator
        assistantMessage = `🔄 **Operating in Offline Mode**\n\n${this.generateIntelligentMockResponse(userMessage)}\n\n---\n*Note: AI backend is currently unavailable. Responses are generated using intelligent fallback logic.*`;
      }

      // Add assistant message to conversation
      const assistantMsg = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(assistantMsg);
      conversation.lastActivity = new Date().toISOString();

      // Save assistant message to database
      await this.saveMessageToDatabase(threadId, assistantMsg);

      return {
        threadId,
        assistantMessage,
        conversation: this.getConversationSummary(conversation)
      };

    } catch (error) {
      console.error('ChatService.sendMessage error:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Create a new conversation thread
   * @param {string} threadId - Thread identifier
   * @returns {Object} New conversation object
   */
  createNewThread(threadId) {
    const conversation = {
      threadId,
      messages: [
        {
          id: this.generateMessageId(),
          role: 'system',
          content: 'Hello! I\'m your AI assistant. How can I help you today?',
          timestamp: new Date().toISOString()
        }
      ],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: {
        title: 'New Conversation',
        messageCount: 1
      }
    };

    return conversation;
  }

  /**
   * Generate AI response using the AI provider
   * @param {Array} messages - Conversation history
   * @returns {Promise<string>} AI generated response
   */
  async generateAIResponse(messages) {
    try {
      if (!this.aiProvider) {
        throw new Error('No AI provider configured');
      }

      const response = await this.aiProvider.generate(messages);
      return response;
    } catch (error) {
      console.error('AI response generation failed:', error);
      throw new Error(`AI response failed: ${error.message}`);
    }
  }

  /**
   * Generate mock response for testing/fallback
   * @param {string} userMessage - User's message
   * @returns {string} Mock response
   */
  generateMockResponse(userMessage) {
    const mockResponses = [
      "I understand you're asking about that. Let me help you with some information.",
      "That's an interesting question! Here's what I can tell you about it.",
      "I'm here to help! Based on your message, I think I can provide some useful insights.",
      "Thanks for reaching out. Let me address your question with some helpful details.",
      "I appreciate your question. Here's what I know about that topic.",
      "That's a great point! Let me share some relevant information with you.",
      "I'm glad you asked about that. Here's what I can tell you.",
      "Interesting question! Let me provide you with some helpful information."
    ];

    // Simple keyword-based responses
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('help') || lowerMessage.includes('assist')) {
      return "I'm here to help! What specific assistance do you need? I can help with information, answer questions, or provide guidance on various topics.";
    }
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return "Hello! It's great to meet you. How can I assist you today?";
    }
    
    if (lowerMessage.includes('thank')) {
      return "You're very welcome! I'm happy to help. Is there anything else you'd like to know?";
    }
    
    if (lowerMessage.includes('dashboard') || lowerMessage.includes('widget')) {
      return "I can help you with dashboard and widget questions! The dashboard system supports various widget types like text, numbers, and charts. What would you like to know about?";
    }
    
    if (lowerMessage.includes('data') || lowerMessage.includes('analytics')) {
      return "I can help you with data and analytics questions! Whether you need help with charts, metrics, or data visualization, I'm here to assist.";
    }

    // Return random mock response
    return mockResponses[Math.floor(Math.random() * mockResponses.length)];
  }

  /**
   * Save message to database
   * @param {string} threadId - Thread identifier
   * @param {Object} message - Message object
   */
  async saveMessageToDatabase(threadId, message) {
    try {
      const { ChatMessage, connectDB } = await getServerModules();
      
      if (!ChatMessage || !connectDB) {
        console.log('Client side - skipping database save');
        return;
      }

      await connectDB();

      const messageData = {
        messageId: message.id,
        threadId: threadId,
        projectId: this.extractProjectIdFromThread(threadId) || 'unknown',
        userId: 'cigno-user',
        role: message.role,
        content: message.content,
        type: 'text',
        timestamp: new Date(message.timestamp)
      };

      await ChatMessage.createMessage(messageData);
      console.log(`💾 Saved ${message.role} message to database`);
    } catch (error) {
      console.error('Failed to save message to database:', error);
    }
  }

  /**
   * Extract project ID from thread ID
   * @param {string} threadId - Thread identifier
   * @returns {string|null} Project ID or null
   */
  extractProjectIdFromThread(threadId) {
    // Try to extract project ID from thread ID pattern: project_XXX_timestamp
    const match = threadId.match(/^project_([^_]+)_/);
    return match ? match[1] : null;
  }

  /**
   * Load conversation from database
   * @param {string} threadId - Thread identifier
   * @returns {Promise<Object|null>} Conversation object or null if not found
   */
  async loadConversationFromDatabase(threadId) {
    try {
      const { ChatMessage, connectDB } = await getServerModules();
      
      if (!ChatMessage || !connectDB) {
        return null;
      }

      await connectDB();

      const messages = await ChatMessage.getThreadMessages(threadId, 100);
      
      if (messages.length === 0) {
        return null;
      }

      // Convert database messages to conversation format
      const conversationMessages = messages.map(msg => ({
        id: msg.messageId,
        role: msg.role,
        content: msg.content,
        timestamp: msg.timestamp
      }));

      const conversation = {
        threadId,
        messages: conversationMessages,
        createdAt: messages[0].timestamp,
        lastActivity: messages[messages.length - 1].timestamp,
        metadata: {
          title: 'Loaded Conversation',
          messageCount: messages.length
        }
      };

      return conversation;
    } catch (error) {
      console.error('Failed to load conversation from database:', error);
      return null;
    }
  }

  /**
   * Get conversation by thread ID
   * @param {string} threadId - Thread identifier
   * @returns {Object|null} Conversation object or null if not found
   */
  async getConversation(threadId) {
    // First check in-memory conversations
    let conversation = this.conversations.get(threadId);
    
    if (!conversation) {
      // Try to load from database
      conversation = await this.loadConversationFromDatabase(threadId);
      if (conversation) {
        // Cache in memory for future use
        this.conversations.set(threadId, conversation);
      }
    }
    
    return conversation;
  }

  /**
   * Get conversation summary (without full message content)
   * @param {Object} conversation - Full conversation object
   * @returns {Object} Conversation summary
   */
  getConversationSummary(conversation) {
    return {
      threadId: conversation.threadId,
      messageCount: conversation.messages.length,
      lastActivity: conversation.lastActivity,
      createdAt: conversation.createdAt,
      metadata: conversation.metadata
    };
  }

  /**
   * Get all conversations
   * @returns {Array} Array of conversation summaries
   */
  getAllConversations() {
    return Array.from(this.conversations.values()).map(conv => 
      this.getConversationSummary(conv)
    );
  }

  /**
   * Delete conversation thread
   * @param {string} threadId - Thread identifier
   * @returns {boolean} True if deleted, false if not found
   */
  deleteConversation(threadId) {
    return this.conversations.delete(threadId);
  }

  /**
   * Clear all conversations
   */
  clearAllConversations() {
    this.conversations.clear();
  }

  /**
   * Generate unique message ID
   * @returns {string} Unique message identifier
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation statistics
   * @returns {Object} Statistics about conversations
   */
  getStats() {
    const conversations = Array.from(this.conversations.values());
    const totalMessages = conversations.reduce((sum, conv) => sum + conv.messages.length, 0);
    
    return {
      totalConversations: conversations.length,
      totalMessages,
      averageMessagesPerConversation: conversations.length > 0 ? totalMessages / conversations.length : 0,
      oldestConversation: conversations.length > 0 ? Math.min(...conversations.map(c => new Date(c.createdAt))) : null,
      newestConversation: conversations.length > 0 ? Math.max(...conversations.map(c => new Date(c.lastActivity))) : null
    };
  }

  /**
   * Generate intelligent mock response based on user message
   * @param {string} userMessage - User's message
   * @returns {string} Intelligent mock response
   */
  generateIntelligentMockResponse(userMessage) {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('how are you')) {
      return `Hello! I'm the Cigno AI assistant, designed to help with EMEA Financial Services consulting. I'm currently running in offline mode, but I can still assist you with:

• **Consulting Strategy**: Wealth management, investment banking, retail banking
• **Regulatory Compliance**: EMEA financial regulations and compliance
• **Market Analysis**: Financial services trends and opportunities
• **Deliverable Creation**: Presentations, reports, and strategic documents

How can I help you with your consulting needs today?`;
    } else if (lowerMessage.includes('weather')) {
      return `I'm a specialized AI assistant for EMEA Financial Services consulting, so I don't have access to weather information. However, I can help you with:

• **Financial Market Analysis**: Economic conditions and market trends
• **Risk Assessment**: Weather-related business risks in financial services
• **Regulatory Impact**: How environmental factors affect financial regulations
• **Strategic Planning**: Business continuity and risk management

Would you like me to help with any financial services consulting topics instead?`;
    } else if (lowerMessage.includes('cigno') || lowerMessage.includes('platform')) {
      return `The Cigno Platform is a comprehensive consulting enablement platform for EMEA Financial Services. Here's what I can tell you:

**Core Mission**: "Helping consultants delivering high value services"

**Key Features**:
• Multi-agent research and analysis
• Real-time narrative progress updates
• EMEA regulatory compliance support
• Client relationship management
• Deliverable creation and collaboration

**Target Industries**: Wealth Management, Investment Banking, Retail Banking, Insurance

I'm currently running in offline mode, but I can still provide insights and assistance. What specific aspect of the Cigno platform would you like to know more about?`;
    } else {
      return `I understand you're asking about "${userMessage}". As the Cigno AI assistant, I'm designed to help with EMEA Financial Services consulting. 

While I'm currently in offline mode, I can still assist with:

• **Strategic Analysis**: Your query relates to consulting and financial services
• **Research Support**: I can help identify key areas for investigation
• **Regulatory Guidance**: EMEA compliance and regulatory considerations
• **Deliverable Development**: Creating professional consulting outputs

Could you rephrase your question in the context of financial services consulting, or let me know how I can help with your consulting needs?`;
    }
  }

  /**
   * Set AI provider
   * @param {Object} aiProvider - AI provider instance
   */
  setAIProvider(aiProvider) {
    this.aiProvider = aiProvider;
  }

  /**
   * Check if AI provider is available
   * @returns {boolean} True if AI provider is configured and available
   */
  isAIAvailable() {
    return this.aiProvider && this.aiProvider.isAvailable();
  }
}
