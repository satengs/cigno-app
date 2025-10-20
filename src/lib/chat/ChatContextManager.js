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
   * @param {Object} clientData - Optional client data
   * @returns {Object} Chat context for the project
   */
  getOrCreateChatContext(project, userId = 'cigno-user', clientData = null) {
    if (!project || !project.id) {
      console.warn('ChatContextManager: Invalid project provided');
      return null;
    }

    const contextKey = `${userId}_${project.id}`;
    console.log(`🔑 Context key: ${contextKey} for project: ${project.name || project.title} (ID: ${project.id})`);
    
    // Check if context already exists
    if (this.chatContexts.has(contextKey)) {
      const existingContext = this.chatContexts.get(contextKey);
      console.log(`🔄 Loading existing chat context for project: ${project.name || project.title}`);
      console.log(`📊 Existing context has ${existingContext.messages?.length || 0} messages`);
      return existingContext;
    }

    // Extract client information from project or provided clientData
    const clientInfo = clientData || project.client_name || project.metadata?.client_name || 'Unknown Client';
    const projectName = project.name || project.title || 'Unknown Project';
    
    // Create comprehensive welcome message
    const welcomeMessage = `Hello! I'm here to help you with the "${projectName}" project. What would you like to work on today?`;

    // Create new chat context
    const newContext = {
      userId: contextKey,
      clientId: "cigno-app",
      projectId: project.id,
      projectName: projectName,
      clientData: clientData,
      projectData: project,
      chatId: `chat_${project.id}_${Date.now()}`,
      messages: [{
        id: `welcome_${Date.now()}`,
        type: 'assistant',
        role: 'assistant',
        content: welcomeMessage,
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
          timestamp: new Date(msg.timestamp).getTime() // Convert to timestamp for UI
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
   * Switch to a specific project's chat context (with revalidation)
   * @param {Object} project - Project object
   * @param {string} userId - Current user ID
   * @param {Object} clientData - Optional client data
   * @returns {Object} Chat context
   */
  switchToProject(project, userId = 'cigno-user', clientData = null) {
    // Normalize project data - handle both project and deliverable items
    let projectData = project;
    
    // If this is a deliverable, use its parent project for chat context
    if (project.type === 'deliverable') {
      // Use the getProjectId helper to ensure consistent project ID extraction
      const projectId = this.getProjectId(project);
      projectData = {
        id: projectId,
        name: project.projectName || project.title || 'Current Project',
        type: 'project',
        // Preserve deliverable info for context
        currentDeliverable: {
          id: project.id,
          name: project.name || project.title,
          type: project.type
        }
      };
      console.log(`🔀 Deliverable detected, using parent project context: ${projectData.name} (Project ID: ${projectData.id})`);
    } else {
      console.log(`🔀 Project detected, using project context: ${project.name || project.title} (Project ID: ${project.id})`);
    }
    
    const context = this.getOrCreateChatContext(projectData, userId, clientData);
    
    if (context) {
      // Update last accessed time
      context.lastAccessedAt = new Date().toISOString();
      this.currentContext = context;
      console.log(`🔀 Switched to chat context for project: ${projectData.name || projectData.title}`);
      console.log(`📊 Context has ${context.messages?.length || 0} messages`);
      
      // Log current deliverable if applicable
      if (projectData.currentDeliverable) {
        console.log(`📄 Current deliverable: ${projectData.currentDeliverable.name} (ID: ${projectData.currentDeliverable.id})`);
      }
      
      // Sync with database to ensure latest messages (async)
      this.syncWithDatabase().catch(error => {
        console.error('Failed to sync context with database:', error);
      });
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
   * Debug method to list all current contexts
   */
  listAllContexts() {
    console.log(`📋 All chat contexts (${this.chatContexts.size}):`);
    for (const [key, context] of this.chatContexts.entries()) {
      console.log(`  - ${key}: ${context.projectName} (${context.messages?.length || 0} messages)`);
    }
  }

  /**
   * Check if two items share the same project context
   * @param {Object} item1 - First item (project or deliverable)
   * @param {Object} item2 - Second item (project or deliverable)
   * @param {string} userId - User ID
   * @returns {boolean} True if they share the same project context
   */
  shareSameProjectContext(item1, item2, userId = 'cigno-user') {
    if (!item1 || !item2) return false;
    
    // Get project IDs for both items using the helper method
    const projectId1 = this.getProjectId(item1);
    const projectId2 = this.getProjectId(item2);
    
    return projectId1 === projectId2;
  }

  /**
   * Get the project ID for any item (project or deliverable)
   * @param {Object} item - Project or deliverable item
   * @returns {string} Project ID
   */
  getProjectId(item) {
    if (!item) return null;
    
    console.log(`🔍 getProjectId for item:`, {
      type: item.type,
      id: item.id,
      projectId: item.projectId,
      project: item.project,
      name: item.name || item.title
    });
    
    if (item.type === 'deliverable') {
      // For deliverables, use the project field first, then projectId - DO NOT fall back to deliverable ID
      const projectId = item.project || item.projectId;
      if (!projectId) {
        console.error(`❌ Deliverable ${item.name} has no project reference! This will break context consistency.`);
        return null;
      }
      console.log(`📄 Deliverable project ID: ${projectId} (from project: ${item.project}, projectId: ${item.projectId})`);
      return projectId;
    } else {
      // For projects, use the id directly
      console.log(`📁 Project ID: ${item.id}`);
      return item.id;
    }
  }

  /**
   * Ensure context consistency when switching between project and deliverable
   * @param {Object} newItem - New item being switched to
   * @param {string} userId - User ID
   * @returns {Object|null} Updated chat context
   */
  ensureContextConsistency(newItem, userId = 'cigno-user') {
    if (!newItem) return null;
    
    // Get the project ID for the new item
    const newProjectId = this.getProjectId(newItem);
    
    // If we have a current context, check if we need to switch
    if (this.currentContext) {
      const currentProjectId = this.currentContext.projectId;
      
      console.log(`🔍 Context check: Current=${currentProjectId}, New=${newProjectId}, NewType=${newItem.type}`);
      console.log(`🔍 New item details:`, {
        id: newItem.id,
        projectId: newItem.projectId,
        name: newItem.name || newItem.title,
        type: newItem.type
      });
      
      // If same project context, just update the current deliverable info
      if (currentProjectId === newProjectId) {
        console.log(`🔄 Same project context detected, updating deliverable info`);
        
        if (newItem.type === 'deliverable') {
          this.currentContext.currentDeliverable = {
            id: newItem.id,
            name: newItem.name || newItem.title,
            type: newItem.type
          };
          console.log(`📄 Updated current deliverable: ${this.currentContext.currentDeliverable.name}`);
        } else {
          this.currentContext.currentDeliverable = null;
          console.log(`📁 Cleared current deliverable (now in project view)`);
        }
        
        // Update last accessed time
        this.currentContext.lastAccessedAt = new Date().toISOString();
        
        return this.currentContext;
      } else {
        console.log(`🔄 Different project context detected, switching to new project`);
      }
    } else {
      console.log(`🔄 No current context, creating new context`);
    }
    
    // Different project context or no current context, switch normally
    return this.switchToProject(newItem, userId);
  }

  /**
   * Add message to current project's chat (with deduplication)
   * @param {Object} message - Message object
   * @param {Object} aiMetadata - Optional AI response metadata
   * @returns {boolean} Success status
   */
  addMessageToCurrentChat(message, aiMetadata = {}) {
    if (!this.currentContext) {
      console.warn('ChatContextManager: No active chat context');
      return false;
    }

    // Check for duplicate messages
    const messageId = message.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const existingMessage = this.currentContext.messages.find(m => m.id === messageId);
    
    if (existingMessage) {
      console.log(`⚠️ Duplicate message detected, skipping: ${messageId}`);
      return false;
    }

    const messageWithTimestamp = {
      ...message,
      id: messageId,
      timestamp: message.timestamp || new Date().getTime() // Use provided timestamp or current time
    };

    this.currentContext.messages.push(messageWithTimestamp);
    this.currentContext.lastAccessedAt = new Date().toISOString();
    
    console.log(`💬 Added message to ${this.currentContext.projectName} chat:`, {
      messageId: messageWithTimestamp.id,
      content: message.content?.substring(0, 50) + '...',
      totalMessages: this.currentContext.messages.length,
      timestamp: messageWithTimestamp.timestamp
    });
    
    // Save to database asynchronously
    this.saveChatMessageToDatabase(messageWithTimestamp, aiMetadata).catch(error => {
      console.error('Failed to save chat message to database:', error);
    });
    
    // Save to localStorage as backup
    this.saveToStorage();
    
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
      
      // Convert database messages to UI format
      const uiMessages = messages.map(msg => ({
        id: msg.messageId,
        type: msg.role,
        role: msg.role,
        content: msg.content,
        timestamp: new Date(msg.timestamp).getTime() // Convert to timestamp for UI
      })).reverse(); // Reverse to get chronological order
      
      return uiMessages;

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
          timestamp: new Date(msg.timestamp).getTime() // Convert to timestamp for UI
        }));

        // Merge with existing messages, avoiding duplicates by message ID and content
        const existingIds = new Set(this.currentContext.messages.map(m => m.id));
        const existingContent = new Set(this.currentContext.messages.map(m => `${m.role}:${m.content}:${m.timestamp}`));
        
        const newMessages = contextMessages.filter(m => 
          !existingIds.has(m.id) && 
          !existingContent.has(`${m.role}:${m.content}:${m.timestamp}`)
        );
        
        if (newMessages.length > 0) {
          this.currentContext.messages = [...this.currentContext.messages, ...newMessages]
            .sort((a, b) => a.timestamp - b.timestamp);
          console.log(`🔄 Synced ${newMessages.length} new messages from database (${contextMessages.length} total checked)`);
        } else {
          console.log(`✅ No new messages to sync (${contextMessages.length} messages already present)`);
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

    // Create new welcome message
    const welcomeMessage = `Hello! I'm here to help you with the "${this.currentContext.projectName}" project. What would you like to work on today?`;

    this.currentContext.messages = [{
      id: `welcome_${Date.now()}`,
      type: 'assistant',
      role: 'assistant',
      content: welcomeMessage,
      timestamp: new Date().toISOString()
    }];

    console.log(`🗑️ Cleared chat for project: ${this.currentContext.projectName}`);
    return true;
  }

  /**
   * Clear ALL chat history for all projects
   * @returns {boolean} Success status
   */
  clearAllChatHistory() {
    try {
      this.chatContexts.clear();
      this.currentContext = null;
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('cigno_chat_contexts');
      }
      
      console.log('🗑️ Cleared ALL chat history for all projects');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear all chat history:', error);
      return false;
    }
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