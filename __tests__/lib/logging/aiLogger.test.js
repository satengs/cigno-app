import aiLogger from '../../../src/lib/logging/aiLogger.js';

describe('AILogger', () => {
  beforeEach(() => {
    aiLogger.clearLogs();
  });

  afterEach(() => {
    aiLogger.clearLogs();
  });

  describe('logAIRequest', () => {
    test('should log AI request with correct structure', () => {
      const requestData = {
        url: 'https://ai.vave.ch/api/custom-agents/test/execute',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        payload: { message: 'test message' },
        agentId: 'test-agent',
        requestType: 'test_request',
        projectId: 'test-project',
        userId: 'test-user'
      };

      const requestId = aiLogger.logAIRequest(requestData);

      expect(requestId).toBeDefined();
      expect(typeof requestId).toBe('string');
      expect(requestId).toMatch(/^ai_\d+_[a-z0-9]+$/);

      const logs = aiLogger.getLogs({ type: 'ai_request' });
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.type).toBe('ai_request');
      expect(log.level).toBe('info');
      expect(log.data.url).toBe(requestData.url);
      expect(log.data.agentId).toBe(requestData.agentId);
      expect(log.data.projectId).toBe(requestData.projectId);
    });

    test('should sanitize sensitive headers', () => {
      const requestData = {
        url: 'https://ai.vave.ch/api/test',
        headers: {
          'X-API-Key': 'secret-key',
          'Authorization': 'Bearer token123',
          'Content-Type': 'application/json'
        },
        payload: { message: 'test' }
      };

      aiLogger.logAIRequest(requestData);
      
      const logs = aiLogger.getLogs({ type: 'ai_request' });
      const log = logs[0];
      
      expect(log.data.headers['X-API-Key']).toBe('[REDACTED]');
      expect(log.data.headers['Authorization']).toBe('[REDACTED]');
      expect(log.data.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('logAIResponse', () => {
    test('should log successful AI response', () => {
      const requestId = 'test-request-id';
      const responseData = {
        status: 200,
        success: true,
        duration: 1500,
        responseSize: 1024,
        agentId: 'test-agent',
        source: 'custom-agent'
      };

      const responseId = aiLogger.logAIResponse(requestId, responseData);

      expect(responseId).toBeDefined();
      
      const logs = aiLogger.getLogs({ type: 'ai_response' });
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.type).toBe('ai_response');
      expect(log.level).toBe('info');
      expect(log.requestId).toBe(requestId);
      expect(log.data.success).toBe(true);
      expect(log.data.duration).toBe(1500);
    });

    test('should log failed AI response', () => {
      const requestId = 'test-request-id';
      const responseData = {
        status: 500,
        success: false,
        duration: 800,
        error: 'Internal server error',
        source: 'backend'
      };

      aiLogger.logAIResponse(requestId, responseData);
      
      const logs = aiLogger.getLogs({ type: 'ai_response' });
      const log = logs[0];
      
      expect(log.level).toBe('error');
      expect(log.data.success).toBe(false);
      expect(log.data.error).toBe('Internal server error');
    });
  });

  describe('logNarrative', () => {
    test('should log narrative event', () => {
      const narrativeData = {
        content: 'Analyzing your request...',
        type: 'discovery_success',
        phase: 'research',
        projectId: 'test-project',
        userId: 'test-user',
        source: 'ai_backend'
      };

      const narrativeId = aiLogger.logNarrative(narrativeData);

      expect(narrativeId).toBeDefined();
      
      const logs = aiLogger.getLogs({ type: 'narrative' });
      expect(logs).toHaveLength(1);
      
      const log = logs[0];
      expect(log.type).toBe('narrative');
      expect(log.level).toBe('info');
      expect(log.data.content).toBe(narrativeData.content);
      expect(log.data.narrativeType).toBe(narrativeData.type);
    });
  });

  describe('getLogs with filters', () => {
    beforeEach(() => {
      // Create test data
      aiLogger.logAIRequest({
        url: 'https://ai.vave.ch/api/test1',
        projectId: 'project-1',
        userId: 'user-1'
      });
      
      aiLogger.logAIRequest({
        url: 'https://ai.vave.ch/api/test2',
        projectId: 'project-2',
        userId: 'user-2'
      });
      
      aiLogger.logNarrative({
        content: 'Test narrative',
        projectId: 'project-1',
        userId: 'user-1'
      });
    });

    test('should filter by type', () => {
      const requestLogs = aiLogger.getLogs({ type: 'ai_request' });
      const narrativeLogs = aiLogger.getLogs({ type: 'narrative' });
      
      expect(requestLogs).toHaveLength(2);
      expect(narrativeLogs).toHaveLength(1);
    });

    test('should filter by projectId', () => {
      const project1Logs = aiLogger.getLogs({ projectId: 'project-1' });
      const project2Logs = aiLogger.getLogs({ projectId: 'project-2' });
      
      expect(project1Logs).toHaveLength(2);
      expect(project2Logs).toHaveLength(1);
    });

    test('should limit results', () => {
      const limitedLogs = aiLogger.getLogs({ limit: 2 });
      expect(limitedLogs).toHaveLength(2);
    });
  });

  describe('getStats', () => {
    test('should return correct statistics', () => {
      // Create test data
      aiLogger.logAIRequest({ url: 'test1' });
      aiLogger.logAIResponse('id1', { success: true, duration: 1000 });
      
      aiLogger.logAIRequest({ url: 'test2' });
      aiLogger.logAIResponse('id2', { success: false, duration: 500, error: 'Failed' });
      
      aiLogger.logNarrative({ content: 'Test narrative' });

      const stats = aiLogger.getStats();
      
      expect(stats.totalRequests).toBe(2);
      expect(stats.totalResponses).toBe(2);
      expect(stats.successfulResponses).toBe(1);
      expect(stats.failedResponses).toBe(1);
      expect(stats.successRate).toBe(50);
      expect(stats.totalNarratives).toBe(1);
      expect(stats.totalErrors).toBe(1);
      expect(stats.averageResponseTime).toBe(750);
    });
  });

  describe('sanitization', () => {
    test('should sanitize large payloads', () => {
      const largeMessage = 'x'.repeat(1000);
      const requestData = {
        url: 'test',
        payload: { message: largeMessage }
      };

      aiLogger.logAIRequest(requestData);
      
      const logs = aiLogger.getLogs();
      const log = logs[0];
      
      expect(log.data.payload.message).toContain('[TRUNCATED]');
      expect(log.data.payload.message.length).toBeLessThan(600);
    });

    test('should sanitize sensitive fields', () => {
      const requestData = {
        url: 'test',
        payload: {
          message: 'test',
          apiKey: 'secret123',
          password: 'password123',
          data: 'normal data'
        }
      };

      aiLogger.logAIRequest(requestData);
      
      const logs = aiLogger.getLogs();
      const log = logs[0];
      
      expect(log.data.payload.apiKey).toBe('[REDACTED]');
      expect(log.data.payload.password).toBe('[REDACTED]');
      expect(log.data.payload.data).toBe('normal data');
    });
  });
});