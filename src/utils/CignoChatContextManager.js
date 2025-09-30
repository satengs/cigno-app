// CIGNO Chat Context Manager
class CignoChatContextManager {
  constructor() {
    this.apiKey = 'd8888197b6edf249bfa0c8dd7ec1af7176d273529802c39ecdd79eb1324065c4';
    this.baseUrl = 'http://localhost:3000/api/chat';
    this.contexts = new Map(); // projectId -> ChatContext
    this.currentProjectId = null;
  }

  // Switch to project context
  async switchToProject(projectId, projectData) {
    if (!this.contexts.has(projectId)) {
      // Start new chat for this project
      const chatId = await this.startNewChat();
      this.contexts.set(projectId, {
        projectId,
        projectName: projectData.name,
        chatId,
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
  async sendMessage(message, chatId, attachments = []) {
    const response = await fetch(`${this.baseUrl}/send`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        message,
        userId: 'cigno-user', // Will be replaced with Auth0 user later
        chatId,
        attachments
      })
    });

    return await response.json();
  }

  // Start new chat
  async startNewChat() {
    const response = await fetch(`${this.baseUrl}/new`, {
      method: 'POST',
      headers: {
        'X-API-Key': this.apiKey,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    return data.chatId;
  }

  // Poll for response
  async pollForResponse(requestId) {
    while (true) {
      const response = await fetch(`${this.baseUrl}/status/${requestId}`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      const result = await response.json();
      
      if (result.status === 'complete') {
        return result;
      } else if (result.status === 'error') {
        throw new Error(result.message);
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  // Get current context
  getCurrentContext() {
    return this.currentProjectId ? this.contexts.get(this.currentProjectId) : null;
  }

  // Get chat history
  async getChatHistory(chatId) {
    try {
      const response = await fetch(`${this.baseUrl}/load/${chatId}?userId=cigno-user`, {
        headers: { 'X-API-Key': this.apiKey }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.messages || [];
      }
      return [];
    } catch (error) {
      console.error('Failed to load chat history:', error);
      return [];
    }
  }
}

export default CignoChatContextManager;
