// CIGNO Chat Context Manager
class CignoChatContextManager {
  constructor() {
    this.baseUrl = '/api/chat'; // Use local API endpoints
    this.contexts = new Map(); // projectId -> ChatContext
    this.currentProjectId = null;
  }

  // Switch to project context
  async switchToProject(projectId, projectData) {
    if (!this.contexts.has(projectId)) {
      // Create thread ID for this project
      const threadId = `project_${projectId}_${Date.now()}`;
      this.contexts.set(projectId, {
        projectId,
        projectName: projectData.name,
        chatId: threadId,
        currentItem: null,
        lastUpdated: new Date().toISOString()
      });
    }
    
    this.currentProjectId = projectId;
    return this.contexts.get(this.currentProjectId);
  }

  // Update current item context
  updateCurrentItem(itemType, itemData) {
    if (!this.currentProjectId) return;
    
    const context = this.contexts.get(this.currentProjectId);
    context.currentItem = {
      type: itemType,
      id: itemData.id,
      title: itemData.title,
      metadata: itemData.metadata || {}
    };
    context.lastUpdated = new Date().toISOString();
  }

  // Send context to chat
  async sendContextToChat(context, item, itemType) {
    const contextAttachment = {
      type: "context",
      title: `${itemType.charAt(0).toUpperCase() + itemType.slice(1)} Context`,
      description: `Current ${itemType} information`,
      body: {
        projectId: context.projectId,
        projectName: context.projectName,
        currentItem: {
          type: itemType,
          id: item.id,
          title: item.title,
          metadata: item.metadata || {}
        },
        timestamp: new Date().toISOString()
      }
    };

    try {
      const { requestId } = await this.sendMessage(
        `Context updated: Now viewing ${itemType} "${item.title}" in project "${context.projectName}"`,
        context.chatId,
        [contextAttachment]
      );
      
      // Wait for context message to be processed
      await this.pollForResponse(requestId);
    } catch (error) {
      console.error('Failed to send context to chat:', error);
    }
  }

  // Send message with context
  async sendMessage(message, threadId, attachments = []) {
    console.log('Sending message:', { message, threadId });
    
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        threadId,
        userId: 'cigno-user'
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('sendMessage result:', result);
    
    return {
      requestId: threadId,
      success: result.ok || result.success
    };
  }

  // This method is no longer needed since we generate thread IDs locally
  async startNewChat() {
    return `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Poll for response - since local API responds immediately, we just get the conversation
  async pollForResponse(threadId) {
    const response = await fetch(`${this.baseUrl}?threadId=${threadId}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const result = await response.json();
    console.log('pollForResponse result:', result);
    
    // Check both result.ok and result.success for compatibility
    if ((result.ok || result.success) && result.data && result.data.messages && result.data.messages.length > 0) {
      const lastMessage = result.data.messages[result.data.messages.length - 1];
      console.log('Last message:', lastMessage);
      return {
        status: 'complete',
        response: lastMessage.content,
        html: lastMessage.html,
        followUpQuestions: lastMessage.followUpQuestions || [],
        footnotes: lastMessage.footnotes || {}
      };
    }
    
    console.error('No valid response found in result:', result);
    throw new Error('No response received');
  }

  // Get current context
  getCurrentContext() {
    return this.currentProjectId ? this.contexts.get(this.currentProjectId) : null;
  }

  // Save individual message to database
  async saveMessage(threadId, message) {
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          threadId,
          projectId: this.extractProjectIdFromThread(threadId) || 'unknown',
          userId: 'cigno-user',
          role: message.role,
          content: message.content,
          type: 'text'
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      console.log(`💾 Saved ${message.role} message to database`);
      return result.success;
    } catch (error) {
      console.error('Failed to save message to database:', error);
      return false;
    }
  }

  // Extract project ID from thread ID
  extractProjectIdFromThread(threadId) {
    const match = threadId.match(/^project_([^_]+)_/);
    return match ? match[1] : null;
  }

  // Get chat history
  async getChatHistory(threadId) {
    try {
      const response = await fetch(`${this.baseUrl}?threadId=${threadId}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.messages) {
          // Convert API format to component format
          return data.data.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString()
          }));
        }
      }
      return [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }
}

export default CignoChatContextManager;
