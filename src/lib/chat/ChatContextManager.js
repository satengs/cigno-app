/**
 * Chat Context Manager
 * Handles project-specific chat isolation and context management
 */

// Dynamic imports for server-only modules
async function getServerModules() {
  if (typeof window !== 'undefined') {
    // Return null on client side
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

class ChatContextManager {
  constructor() {
    // Storage for chat contexts per project
    this.chatContexts = new Map();
    this.currentContext = null;
  }

  /**
   * Create or get chat context for a project
   * @param {Object} project - Project object containing id and name
   * @param {string} userId - Current user ID
   * @returns {Object} Chat context for the project
   */
  getOrCreateChatContext(project, userId = 'cigno-user') {
    if (!project || !project.id) {
      console.warn('ChatContextManager: Invalid project provided');
      return null;
    }

    const contextKey = `${userId}_${project.id}`;
    
    // Check if context already exists
    if (this.chatContexts.has(contextKey)) {
      const existingContext = this.chatContexts.get(contextKey);
      console.log(`🔄 Loading existing chat context for project: ${project.name}`);
      return existingContext;
    }

    // Create new chat context
    const newContext = {
      userId: contextKey,
      clientId: "cigno-app",
      projectId: project.id,
      projectName: project.name,
      chatId: `chat_${project.id}_${Date.now()}`,
      messages: [{
        id: `welcome_${Date.now()}`,
        type: 'assistant',
        role: 'assistant',
        content: `Hello! I'm here to help you with the "${project.name}" project. What would you like to work on today?`,
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString(),
      lastAccessedAt: new Date().toISOString()
    };

    this.chatContexts.set(contextKey, newContext);
    console.log(`✨ Created new chat context for project: ${project.name}`);
    
    // Load existing messages from database asynchronously
    this.loadMessagesForNewContext(newContext).catch(error => {
      console.error('Failed to load messages from database:', error);
    });
    
    return newContext;
  }

  /**
   * Load messages from database for a newly created context
   * @param {Object} context - Chat context object
   * @returns {Promise<void>}
   */
  async loadMessagesForNewContext(context) {
    try {
      const { ChatMessage, connectDB } = await getServerModules();
      
      if (!ChatMessage || !connectDB) {
        console.log('Client side - skipping database operations');
        return;
      }

      await connectDB();

      const dbMessages = await ChatMessage.getProjectMessages(
        context.projectId,
        context.userId,
        50 // Load last 50 messages for context
      );

      if (dbMessages.length > 0) {
        // Convert database messages to context format
        const contextMessages = dbMessages.map(msg => ({
          id: msg.messageId,
          type: msg.role,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        })).reverse(); // Reverse to get chronological order

        // Replace welcome message with database messages if they exist
        context.messages = contextMessages;
        console.log(`📂 Loaded ${contextMessages.length} messages from database for project: ${context.projectName}`);
      } else {
        // Save the welcome message to database
        const welcomeMessage = context.messages[0];
        await this.saveChatMessageToDatabase(welcomeMessage, { provider: 'system' });
      }

    } catch (error) {
      console.error('ChatContextManager: Failed to load messages for new context:', error);
    }
  }

  /**
   * Switch to a specific project's chat context
   * @param {Object} project - Project object
   * @param {string} userId - Current user ID
   * @returns {Object} Chat context
   */
  switchToProject(project, userId = 'cigno-user') {
    const context = this.getOrCreateChatContext(project, userId);
    
    if (context) {
      // Update last accessed time
      context.lastAccessedAt = new Date().toISOString();
      this.currentContext = context;
      console.log(`🔀 Switched to chat context for project: ${project.name}`);
    }

    return context;
  }

  /**
   * Get current active chat context
   * @returns {Object|null} Current chat context
   */
  getCurrentContext() {
    return this.currentContext;
  }

  /**
   * Add message to current project's chat
   * @param {Object} message - Message object
   * @param {Object} aiMetadata - Optional AI response metadata
   * @returns {boolean} Success status
   */
  addMessageToCurrentChat(message, aiMetadata = {}) {
    if (!this.currentContext) {
      console.warn('ChatContextManager: No active chat context');
      return false;
    }

    const messageWithTimestamp = {
      ...message,
      timestamp: new Date().toISOString()
    };

    this.currentContext.messages.push(messageWithTimestamp);
    this.currentContext.lastAccessedAt = new Date().toISOString();
    
    // Save to database asynchronously
    this.saveChatMessageToDatabase(messageWithTimestamp, aiMetadata).catch(error => {
      console.error('Failed to save chat message to database:', error);
    });
    
    console.log(`💬 Added message to ${this.currentContext.projectName} chat:`, message.content?.substring(0, 50) + '...');
    return true;
  }

  /**
   * Save chat message to database
   * @param {Object} message - Message object
   * @param {Object} aiMetadata - AI response metadata
   * @returns {Promise<boolean>} Success status
   */
  async saveChatMessageToDatabase(message, aiMetadata = {}) {
    try {
      const { ChatMessage, connectDB } = await getServerModules();
      
      if (!ChatMessage || !connectDB) {
        console.log('Client side - skipping database save');
        return true; // Return true to avoid error handling on client
      }

      if (!this.currentContext) {
        console.warn('ChatContextManager: No active context for database save');
        return false;
      }

      await connectDB();

      const messageData = {
        messageId: message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        threadId: this.currentContext.chatId,
        projectId: this.currentContext.projectId,
        userId: this.currentContext.userId,
        role: message.role || message.type,
        content: message.content,
        type: message.type || 'text',
        aiProvider: aiMetadata.provider || null,
        responseTime: aiMetadata.responseTime || null,
        contextData: {
          projectName: this.currentContext.projectName,
          deliverableId: aiMetadata.deliverableId || null,
          storylineId: aiMetadata.storylineId || null,
          sessionId: aiMetadata.sessionId || null
        },
        timestamp: new Date(message.timestamp)
      };

      await ChatMessage.createMessage(messageData);
      console.log(`💾 Saved chat message to database for project: ${this.currentContext.projectName}`);
      return true;

    } catch (error) {
      console.error('ChatContextManager: Database save failed:', error);
      return false;
    }
  }

  /**
   * Load chat messages from database for current project
   * @param {number} limit - Number of messages to load
   * @returns {Promise<Array>} Array of messages
   */
  async loadMessagesFromDatabase(limit = 100) {
    try {
      const { ChatMessage, connectDB } = await getServerModules();
      
      if (!ChatMessage || !connectDB) {
        console.log('Client side - skipping database load');
        return [];
      }

      if (!this.currentContext) {
        console.warn('ChatContextManager: No active context for database load');
        return [];
      }

      await connectDB();

      const messages = await ChatMessage.getProjectMessages(
        this.currentContext.projectId,
        this.currentContext.userId,
        limit
      );

      console.log(`📂 Loaded ${messages.length} messages from database for project: ${this.currentContext.projectName}`);
      return messages.reverse(); // Reverse to get chronological order

    } catch (error) {
      console.error('ChatContextManager: Database load failed:', error);
      return [];
    }
  }

  /**
   * Sync current context with database messages
   * @returns {Promise<boolean>} Success status
   */
  async syncWithDatabase() {
    try {
      if (!this.currentContext) {
        return false;
      }

      const dbMessages = await this.loadMessagesFromDatabase();
      
      if (dbMessages.length > 0) {
        // Convert database messages to context format
        const contextMessages = dbMessages.map(msg => ({
          id: msg.messageId,
          type: msg.role,
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp
        }));

        // Merge with existing messages, avoiding duplicates
        const existingIds = new Set(this.currentContext.messages.map(m => m.id));
        const newMessages = contextMessages.filter(m => !existingIds.has(m.id));
        
        if (newMessages.length > 0) {
          this.currentContext.messages = [...this.currentContext.messages, ...newMessages]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
          console.log(`🔄 Synced ${newMessages.length} new messages from database`);
        }
      }

      return true;

    } catch (error) {
      console.error('ChatContextManager: Database sync failed:', error);
      return false;
    }
  }

  /**
   * Get messages for current project
   * @returns {Array} Array of messages
   */
  getCurrentMessages() {
    return this.currentContext?.messages || [];
  }

  /**
   * Update messages for current project
   * @param {Array} messages - New messages array
   * @returns {boolean} Success status
   */
  updateCurrentMessages(messages) {
    if (!this.currentContext) {
      console.warn('ChatContextManager: No active chat context');
      return false;
    }

    this.currentContext.messages = messages;
    this.currentContext.lastAccessedAt = new Date().toISOString();
    return true;
  }

  /**
   * Clear chat history for current project
   * @returns {boolean} Success status
   */
  clearCurrentChat() {
    if (!this.currentContext) {
      return false;
    }

    this.currentContext.messages = [{
      id: `welcome_${Date.now()}`,
      type: 'assistant',
      role: 'assistant',
      content: `Hello! I'm here to help you with the "${this.currentContext.projectName}" project. What would you like to work on today?`,
      timestamp: new Date().toISOString()
    }];

    console.log(`🗑️ Cleared chat for project: ${this.currentContext.projectName}`);
    return true;
  }

  /**
   * Remove chat context for a specific project
   * @param {string} projectId - Project ID
   * @param {string} userId - User ID
   * @returns {boolean} Success status
   */
  removeProjectContext(projectId, userId = 'cigno-user') {
    if (!projectId) {
      console.warn('ChatContextManager: Project ID is required');
      return false;
    }

    const contextKey = `${userId}_${projectId}`;
    const removed = this.chatContexts.delete(contextKey);
    
    if (removed) {
      console.log(`🗑️ Removed chat context for project: ${projectId}`);
      
      // Clear current context if it was the removed project
      if (this.currentContext && this.currentContext.projectId === projectId) {
        this.currentContext = null;
        console.log('🔄 Cleared current context as it was for the deleted project');
      }
      
      // Save updated contexts to localStorage
      if (typeof window !== 'undefined') {
        this.saveToStorage();
      }
      
      return true;
    } else {
      console.log(`ℹ️ No chat context found for project: ${projectId}`);
      return false;
    }
  }

  /**
   * Get all project chat contexts (for debugging)
   * @returns {Array} Array of context info
   */
  getAllContexts() {
    const contexts = [];
    for (const [key, context] of this.chatContexts.entries()) {
      contexts.push({
        key,
        projectId: context.projectId,
        projectName: context.projectName,
        messageCount: context.messages.length,
        createdAt: context.createdAt,
        lastAccessedAt: context.lastAccessedAt
      });
    }
    return contexts;
  }

  /**
   * Persist chat contexts to localStorage
   * @returns {boolean} Success status
   */
  saveToStorage() {
    try {
      const contextsData = {};
      for (const [key, context] of this.chatContexts.entries()) {
        contextsData[key] = context;
      }
      
      localStorage.setItem('cigno_chat_contexts', JSON.stringify(contextsData));
      console.log('💾 Chat contexts saved to localStorage');
      return true;
    } catch (error) {
      console.error('❌ Failed to save chat contexts:', error);
      return false;
    }
  }

  /**
   * Load chat contexts from localStorage
   * @returns {boolean} Success status
   */
  loadFromStorage() {
    try {
      const stored = localStorage.getItem('cigno_chat_contexts');
      if (stored) {
        const contextsData = JSON.parse(stored);
        this.chatContexts.clear();
        
        for (const [key, context] of Object.entries(contextsData)) {
          this.chatContexts.set(key, context);
        }
        
        console.log(`📂 Loaded ${this.chatContexts.size} chat contexts from localStorage`);
        return true;
      }
    } catch (error) {
      console.error('❌ Failed to load chat contexts:', error);
    }
    return false;
  }
}

// Create singleton instance
const chatContextManager = new ChatContextManager();

// Load existing contexts on initialization
if (typeof window !== 'undefined') {
  chatContextManager.loadFromStorage();
  
  // Save to storage periodically
  setInterval(() => {
    chatContextManager.saveToStorage();
  }, 30000); // Save every 30 seconds
  
  // Save before page unload
  window.addEventListener('beforeunload', () => {
    chatContextManager.saveToStorage();
  });
}

export default chatContextManager;