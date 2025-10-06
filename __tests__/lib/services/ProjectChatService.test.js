/**
 * @jest-environment node
 */

import ProjectChatService from '../../../src/lib/services/ProjectChatService.js';

// Mock uuid
jest.mock('uuid', () => ({
  v4: jest.fn(() => 'mocked-uuid-123')
}));

describe('ProjectChatService', () => {
  let service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProjectChatService();
  });

  describe('constructor and initialization', () => {
    it('should initialize with default values', () => {
      expect(service.projectConversations).toBeInstanceOf(Map);
      expect(service.userProjects).toBeInstanceOf(Map);
      expect(service.currentUserSession).toBe(null);
    });

    it('should accept AI provider in constructor', () => {
      const mockAI = { isAvailable: () => true };
      const serviceWithAI = new ProjectChatService(mockAI);
      expect(serviceWithAI.aiProvider).toBe(mockAI);
    });
  });

  describe('generateUserId', () => {
    it('should generate user ID using UUID', () => {
      const userId = service.generateUserId();
      expect(userId).toBe('mocked-uuid-123');
    });
  });

  describe('createContextId', () => {
    it('should create context ID from user and project IDs', () => {
      const contextId = service.createContextId('user-123', 'project-456');
      expect(contextId).toBe('user-123-project-456');
    });
  });

  describe('setCurrentUser', () => {
    it('should set current user session', () => {
      service.setCurrentUser('user-123');
      expect(service.currentUserSession).toBe('user-123');
      expect(service.userProjects.has('user-123')).toBe(true);
    });

    it('should not overwrite existing user projects', () => {
      service.userProjects.set('user-123', new Set(['existing-project']));
      service.setCurrentUser('user-123');
      expect(service.userProjects.get('user-123').has('existing-project')).toBe(true);
    });
  });

  describe('switchToProjectContext', () => {
    it('should create new conversation for new context', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test description'
      };

      const result = await service.switchToProjectContext('user-123', 'project-456', projectData);

      expect(result.contextId).toBe('user-123-project-456');
      expect(result.projectId).toBe('project-456');
      expect(result.userId).toBe('user-123');
      expect(result.conversation).toBeDefined();
      expect(service.projectConversations.has('user-123-project-456')).toBe(true);
    });

    it('should return existing conversation if context exists', async () => {
      const projectData = { name: 'Test Project' };
      
      // Create initial context
      await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      // Switch to same context again
      const result = await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      expect(result.contextId).toBe('user-123-project-456');
      expect(service.projectConversations.size).toBe(1);
    });
  });

  describe('createProjectConversation', () => {
    it('should create conversation with correct structure', () => {
      const projectData = { name: 'Test Project' };
      const conversation = service.createProjectConversation('ctx-123', 'project-456', projectData);

      expect(conversation).toMatchObject({
        contextId: 'ctx-123',
        projectId: 'project-456',
        projectData: projectData,
        messages: [],
        metadata: {
          title: 'Project: Test Project',
          messageCount: 0,
          type: 'project',
          tags: ['project-chat', 'project-456']
        }
      });
      expect(conversation.createdAt).toBeDefined();
      expect(conversation.lastActivity).toBeDefined();
    });
  });

  describe('sendProjectMessage', () => {
    it('should send message and generate response', async () => {
      const projectData = { name: 'Test Project' };
      const context = await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      const result = await service.sendProjectMessage(context.contextId, 'Hello!');

      expect(result.contextId).toBe(context.contextId);
      expect(result.userMessage.content).toBe('Hello!');
      expect(result.assistantMessage.content).toBeDefined();
      expect(result.conversation).toBeDefined();
    });

    it('should throw error for non-existent conversation', async () => {
      await expect(service.sendProjectMessage('non-existent', 'Hello!'))
        .rejects.toThrow('Project conversation not found');
    });
  });

  describe('generateContextualMockResponse', () => {
    it('should generate status response for status queries', () => {
      const projectData = {
        name: 'Test Project',
        status: 'active',
        start_date: '2025-01-01',
        end_date: '2025-12-31'
      };

      const response = service.generateContextualMockResponse('What is the status?', projectData);

      expect(response).toContain('Project Status');
      expect(response).toContain('active');
      expect(response).toContain('2025-01-01');
    });

    it('should generate deliverable response for deliverable queries', () => {
      const projectData = {
        name: 'Test Project',
        deliverables: [
          { name: 'Report 1', type: 'Report', status: 'draft' }
        ]
      };

      const response = service.generateContextualMockResponse('Tell me about deliverables', projectData);

      expect(response).toContain('deliverables');
      expect(response).toContain('Report 1');
      expect(response).toContain('Report');
    });

    it('should generate general response for other queries', () => {
      const projectData = { name: 'Test Project', status: 'active' };

      const response = service.generateContextualMockResponse('General question', projectData);

      expect(response).toContain('Test Project');
      expect(response).toContain('I can assist you with');
    });
  });

  describe('getProjectConversation', () => {
    it('should return conversation for valid context ID', async () => {
      const projectData = { name: 'Test Project' };
      const context = await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      const conversation = service.getProjectConversation(context.contextId);
      
      expect(conversation).toBeDefined();
      expect(conversation.contextId).toBe(context.contextId);
    });

    it('should return null for invalid context ID', () => {
      const conversation = service.getProjectConversation('non-existent');
      expect(conversation).toBe(null);
    });
  });

  describe('getVisibleMessages', () => {
    it('should return only visible messages', async () => {
      const projectData = { name: 'Test Project' };
      const context = await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      const messages = service.getVisibleMessages(context.contextId);
      
      // Should filter out hidden system messages but include welcome message
      expect(messages.length).toBeGreaterThan(0);
      expect(messages.every(msg => !msg.hidden)).toBe(true);
    });

    it('should return empty array for non-existent context', () => {
      const messages = service.getVisibleMessages('non-existent');
      expect(messages).toEqual([]);
    });
  });

  describe('clearProjectConversation', () => {
    it('should delete conversation successfully', async () => {
      const projectData = { name: 'Test Project' };
      const context = await service.switchToProjectContext('user-123', 'project-456', projectData);
      
      const deleted = service.clearProjectConversation(context.contextId);
      
      expect(deleted).toBe(true);
      expect(service.projectConversations.has(context.contextId)).toBe(false);
    });

    it('should return false for non-existent conversation', () => {
      const deleted = service.clearProjectConversation('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('generateMessageId', () => {
    it('should generate unique message IDs', () => {
      const id1 = service.generateMessageId();
      const id2 = service.generateMessageId();
      
      expect(id1).toMatch(/^msg_\d+_\w+$/);
      expect(id2).toMatch(/^msg_\d+_\w+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      // Create a few conversations
      await service.switchToProjectContext('user-1', 'project-1', { name: 'Project 1' });
      await service.switchToProjectContext('user-2', 'project-2', { name: 'Project 2' });
      
      const stats = service.getStats();
      
      expect(stats.totalProjects).toBe(2);
      expect(stats.totalUsers).toBe(2);
      expect(stats.totalMessages).toBeGreaterThan(0);
      expect(stats.averageMessagesPerProject).toBeGreaterThan(0);
    });
  });

  describe('AI integration', () => {
    it('should check AI availability', () => {
      expect(service.isAIAvailable()).toBe(false);
      
      const mockAI = { isAvailable: () => true };
      service.setAIProvider(mockAI);
      
      expect(service.isAIAvailable()).toBe(true);
    });

    it('should set AI provider', () => {
      const mockAI = { isAvailable: () => true };
      service.setAIProvider(mockAI);
      
      expect(service.aiProvider).toBe(mockAI);
    });
  });
});