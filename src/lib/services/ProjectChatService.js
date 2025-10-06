/**
 * Project-Specific Chat Service
 * Manages chat conversations per project with persistent context
 */
import { v4 as uuidv4 } from 'uuid';

export default class ProjectChatService {
  constructor(aiProvider = null) {
    this.aiProvider = aiProvider;
    this.projectConversations = new Map(); // contextId -> conversation
    this.userProjects = new Map(); // userId -> Set of projectIds
    this.currentUserSession = null; // Current user session
  }

  /**
   * Generate user ID (UUID for now, will be replaced with Auth0)
   * @returns {string} User ID
   */
  generateUserId() {
    return uuidv4();
  }

  /**
   * Create context ID for user-project combination
   * @param {string} userId - User identifier
   * @param {string} projectId - Project identifier
   * @returns {string} Context ID
   */
  createContextId(userId, projectId) {
    return `${userId}-${projectId}`;
  }

  /**
   * Set current user session
   * @param {string} userId - User identifier
   */
  setCurrentUser(userId) {
    this.currentUserSession = userId;
    if (!this.userProjects.has(userId)) {
      this.userProjects.set(userId, new Set());
    }
  }

  /**
   * Switch to project context and load/create conversation
   * @param {string} userId - User identifier
   * @param {string} projectId - Project identifier
   * @param {Object} projectData - Project metadata
   * @returns {Object} Chat context with conversation
   */
  async switchToProjectContext(userId, projectId, projectData = {}) {
    try {
      const contextId = this.createContextId(userId, projectId);
      
      // Set current user if not set
      if (!this.currentUserSession) {
        this.setCurrentUser(userId);
      }

      // Add project to user's projects
      this.userProjects.get(userId)?.add(projectId);

      // Get or create conversation for this context
      let conversation = this.projectConversations.get(contextId);
      
      if (!conversation) {
        conversation = this.createProjectConversation(contextId, projectId, projectData);
        this.projectConversations.set(contextId, conversation);
        
        // Send initial project context to AI
        await this.initializeProjectContext(conversation, projectData);
      } else {
        // Update project data if changed
        conversation.projectData = { ...conversation.projectData, ...projectData };
        conversation.lastActivity = new Date().toISOString();
      }

      return {
        contextId,
        conversation,
        projectId,
        userId,
        projectData: conversation.projectData
      };

    } catch (error) {
      console.error('Error switching to project context:', error);
      throw new Error(`Failed to switch to project context: ${error.message}`);
    }
  }

  /**
   * Create new project conversation
   * @param {string} contextId - Context identifier
   * @param {string} projectId - Project identifier
   * @param {Object} projectData - Project metadata
   * @returns {Object} New conversation object
   */
  createProjectConversation(contextId, projectId, projectData) {
    const conversation = {
      contextId,
      projectId,
      projectData,
      messages: [],
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      metadata: {
        title: `Project: ${projectData.name || 'Unnamed Project'}`,
        messageCount: 0,
        type: 'project',
        tags: ['project-chat', projectId]
      }
    };

    return conversation;
  }

  /**
   * Initialize project context with AI
   * @param {Object} conversation - Conversation object
   * @param {Object} projectData - Project data
   */
  async initializeProjectContext(conversation, projectData) {
    const contextMessage = this.createProjectContextMessage(projectData);
    
    // Add system context message (not shown to user)
    const systemMsg = {
      id: this.generateMessageId(),
      role: 'system',
      content: contextMessage,
      timestamp: new Date().toISOString(),
      type: 'context-initialization',
      hidden: true // Don't show in chat UI
    };
    
    conversation.messages.push(systemMsg);

    // Add welcome message for the project
    const welcomeMsg = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: `Hello! I'm your AI assistant for the project "${projectData.name || 'Current Project'}". I'm here to help you with project-related questions, analysis, and guidance. What would you like to know about this project?`,
      timestamp: new Date().toISOString(),
      type: 'welcome'
    };
    
    conversation.messages.push(welcomeMsg);
    conversation.metadata.messageCount = conversation.messages.length;
  }

  /**
   * Create project context message for AI
   * @param {Object} projectData - Project data
   * @returns {string} Context message
   */
  createProjectContextMessage(projectData) {
    const context = `
PROJECT CONTEXT INFORMATION:
==========================

Project Name: ${projectData.name || 'Unknown'}
Project ID: ${projectData.id || 'Unknown'}
Description: ${projectData.description || 'No description available'}
Status: ${projectData.status || 'Unknown'}
Start Date: ${projectData.start_date || 'Not set'}
End Date: ${projectData.end_date || 'Not set'}
Budget: ${projectData.budget_amount ? `${projectData.budget_amount} ${projectData.budget_currency || 'USD'}` : 'Not set'}
Client: ${projectData.client_name || 'Unknown'}
Industry: ${projectData.client_industry || 'Unknown'}

PROJECT DELIVERABLES:
${projectData.deliverables && projectData.deliverables.length > 0 
  ? projectData.deliverables.map(d => `- ${d.name || d.title}: ${d.description || 'No description'}`).join('\n')
  : '- No deliverables defined yet'
}

ASSISTANT INSTRUCTIONS:
- You are an AI assistant helping with this specific project
- Provide contextual advice and insights based on the project information above
- Help with project planning, analysis, risk assessment, and deliverable creation
- When asked about "this project" or "the project", refer to the information above
- Maintain awareness of the project context throughout the conversation
- If the user switches projects, you will receive new context information

Current timestamp: ${new Date().toISOString()}
`;

    return context;
  }

  /**
   * Send message in project context
   * @param {string} contextId - Context identifier
   * @param {string} userMessage - User's message
   * @returns {Promise<Object>} Response with assistant message
   */
  async sendProjectMessage(contextId, userMessage) {
    try {
      const conversation = this.projectConversations.get(contextId);
      if (!conversation) {
        throw new Error('Project conversation not found');
      }

      // Add user message
      const userMsg = {
        id: this.generateMessageId(),
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(userMsg);

      // Generate AI response with project context
      let assistantMessage;
      if (this.aiProvider && this.aiProvider.isAvailable()) {
        try {
          // Filter out hidden system messages for AI (but keep context)
          const messagesForAI = conversation.messages.filter(m => !m.hidden);
          assistantMessage = await this.generateAIResponse(messagesForAI, conversation.projectData);
        } catch (error) {
          console.log('AI provider failed, using contextual mock response:', error.message);
          assistantMessage = this.generateContextualMockResponse(userMessage, conversation.projectData);
        }
      } else {
        assistantMessage = this.generateContextualMockResponse(userMessage, conversation.projectData);
      }

      // Add assistant message
      const assistantMsg = {
        id: this.generateMessageId(),
        role: 'assistant',
        content: assistantMessage,
        timestamp: new Date().toISOString()
      };
      
      conversation.messages.push(assistantMsg);
      conversation.lastActivity = new Date().toISOString();
      conversation.metadata.messageCount = conversation.messages.length;

      return {
        contextId,
        userMessage: userMsg,
        assistantMessage: assistantMsg,
        conversation: this.getConversationSummary(conversation)
      };

    } catch (error) {
      console.error('Error sending project message:', error);
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }

  /**
   * Generate AI response with project context
   * @param {Array} messages - Conversation messages
   * @param {Object} projectData - Project context data
   * @returns {Promise<string>} AI response
   */
  async generateAIResponse(messages, projectData) {
    try {
      // For Vave AI integration, we can include project context in the system message
      const contextualMessages = [
        {
          role: 'system',
          content: `You are an AI assistant for the project "${projectData.name}". Keep your responses contextual to this project and its details.`
        },
        ...messages.filter(m => m.role !== 'system' || m.type === 'context-initialization')
      ];

      const response = await this.aiProvider.generate(contextualMessages);
      return response;
    } catch (error) {
      console.error('AI response generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate contextual mock response
   * @param {string} userMessage - User's message
   * @param {Object} projectData - Project context
   * @returns {string} Contextual mock response
   */
  generateContextualMockResponse(userMessage, projectData) {
    const lowerMessage = userMessage.toLowerCase();
    const projectName = projectData.name || 'this project';

    if (lowerMessage.includes('status') || lowerMessage.includes('progress')) {
      return `Based on the current information for "${projectName}":

**Project Status**: ${projectData.status || 'Status not defined'}
**Timeline**: ${projectData.start_date || 'TBD'} to ${projectData.end_date || 'TBD'}
**Budget**: ${projectData.budget_amount ? `${projectData.budget_amount} ${projectData.budget_currency || 'USD'}` : 'Not specified'}

${projectData.deliverables && projectData.deliverables.length > 0 
  ? `**Deliverables** (${projectData.deliverables.length}): ${projectData.deliverables.map(d => d.name || d.title).join(', ')}`
  : '**Deliverables**: None defined yet'
}

What specific aspect of the project would you like to explore further?`;
    }

    if (lowerMessage.includes('deliverable') || lowerMessage.includes('deadline')) {
      return `For "${projectName}", here's what I can tell you about deliverables:

${projectData.deliverables && projectData.deliverables.length > 0 
  ? projectData.deliverables.map((d, i) => 
      `${i + 1}. **${d.name || d.title}**
   - Type: ${d.type || 'Not specified'}
   - Status: ${d.status || 'Unknown'}
   - Due: ${d.due_date || 'Not set'}`
    ).join('\n\n')
  : 'No deliverables have been defined for this project yet. Would you like help creating some?'
}

How can I assist you with the deliverables planning?`;
    }

    if (lowerMessage.includes('budget') || lowerMessage.includes('cost')) {
      return `Regarding the budget for "${projectName}":

**Budget Information**:
- Amount: ${projectData.budget_amount ? `${projectData.budget_amount} ${projectData.budget_currency || 'USD'}` : 'Not specified'}
- Type: ${projectData.budget_type || 'Not specified'}
- Client: ${projectData.client_name || 'Not specified'}

${projectData.budget_amount 
  ? 'I can help you analyze budget allocation, track expenses, or plan resource distribution.'
  : 'Would you like help setting up a budget framework for this project?'
}`;
    }

    if (lowerMessage.includes('team') || lowerMessage.includes('resource')) {
      return `For team and resources on "${projectName}":

**Project Team**:
- Internal Owner: ${projectData.internal_owner || 'Not assigned'}
- Client Contact: ${projectData.client_owner || 'Not specified'}
${projectData.team_members && projectData.team_members.length > 0 
  ? `- Team Members: ${projectData.team_members.map(m => m.name || m).join(', ')}`
  : '- Additional team members: Not specified'
}

**Industry Context**: ${projectData.client_industry || 'Not specified'}

How can I help you with team planning or resource allocation?`;
    }

    return `I'm here to help with "${projectName}". Based on the project information I have:

**Quick Overview**:
- Status: ${projectData.status || 'Not set'}
- Client: ${projectData.client_name || 'Not specified'}
- Timeline: ${projectData.start_date && projectData.end_date 
  ? `${projectData.start_date} to ${projectData.end_date}`
  : 'Not fully defined'
}

I can assist you with:
• Project planning and strategy
• Deliverable creation and management  
• Timeline and milestone planning
• Budget and resource analysis
• Risk assessment and mitigation
• Client communication and reporting

What specific aspect of "${projectName}" would you like to work on?`;
  }

  /**
   * Get conversation for context
   * @param {string} contextId - Context identifier
   * @returns {Object|null} Conversation object
   */
  getProjectConversation(contextId) {
    return this.projectConversations.get(contextId) || null;
  }

  /**
   * Get visible messages for UI (excluding hidden system messages)
   * @param {string} contextId - Context identifier
   * @returns {Array} Visible messages
   */
  getVisibleMessages(contextId) {
    const conversation = this.projectConversations.get(contextId);
    if (!conversation) return [];
    
    return conversation.messages.filter(msg => !msg.hidden);
  }

  /**
   * Get all projects for a user
   * @param {string} userId - User identifier
   * @returns {Array} List of project contexts
   */
  getUserProjectContexts(userId) {
    const userProjects = this.userProjects.get(userId) || new Set();
    const contexts = [];
    
    for (const projectId of userProjects) {
      const contextId = this.createContextId(userId, projectId);
      const conversation = this.projectConversations.get(contextId);
      if (conversation) {
        contexts.push({
          contextId,
          projectId,
          projectData: conversation.projectData,
          lastActivity: conversation.lastActivity,
          messageCount: conversation.metadata.messageCount
        });
      }
    }
    
    return contexts.sort((a, b) => new Date(b.lastActivity) - new Date(a.lastActivity));
  }

  /**
   * Clear project conversation
   * @param {string} contextId - Context identifier
   * @returns {boolean} Success status
   */
  clearProjectConversation(contextId) {
    return this.projectConversations.delete(contextId);
  }

  /**
   * Generate unique message ID
   * @returns {string} Message ID
   */
  generateMessageId() {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation summary
   * @param {Object} conversation - Full conversation
   * @returns {Object} Summary
   */
  getConversationSummary(conversation) {
    return {
      contextId: conversation.contextId,
      projectId: conversation.projectId,
      projectName: conversation.projectData.name,
      messageCount: conversation.metadata.messageCount,
      lastActivity: conversation.lastActivity,
      createdAt: conversation.createdAt
    };
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
   * @returns {boolean} Availability status
   */
  isAIAvailable() {
    return this.aiProvider && this.aiProvider.isAvailable();
  }

  /**
   * Get service statistics
   * @returns {Object} Service stats
   */
  getStats() {
    const allConversations = Array.from(this.projectConversations.values());
    const totalMessages = allConversations.reduce((sum, conv) => sum + conv.metadata.messageCount, 0);
    
    return {
      totalProjects: this.projectConversations.size,
      totalUsers: this.userProjects.size,
      totalMessages,
      averageMessagesPerProject: allConversations.length > 0 ? totalMessages / allConversations.length : 0,
      activeProjects: allConversations.filter(c => {
        const daysSinceActivity = (Date.now() - new Date(c.lastActivity)) / (1000 * 60 * 60 * 24);
        return daysSinceActivity <= 7;
      }).length
    };
  }
}