/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST } from '../../../src/app/api/ai/improve-brief/route.js';

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/ai/improve-brief', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AI_API_BASE_URL = 'https://ai.vave.ch';
    process.env.AI_API_KEY = 'test-api-key';
    process.env.AI_BRIEF_AGENT_ID = 'test-agent-id';
  });

  afterEach(() => {
    delete process.env.AI_API_BASE_URL;
    delete process.env.AI_API_KEY;
    delete process.env.AI_BRIEF_AGENT_ID;
  });

  describe('POST /api/ai/improve-brief', () => {
    it('should improve brief via custom agent', async () => {
      const mockResponse = {
        improvedBrief: 'Enhanced brief content with comprehensive details...',
        qualityScore: 8.5,
        improvements: [
          'Added specific SMART objectives',
          'Clarified target audience demographics',
          'Enhanced strategic messaging framework'
        ],
        suggestions: [
          'Consider conducting user research interviews',
          'Develop personas for better audience targeting'
        ]
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(mockResponse)
      });

      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          deliverableId: '507f1f77bcf86cd799439013',
          currentBrief: 'Original brief content',
          deliverableData: {
            title: 'CBDC Implementation Strategy',
            type: 'presentation',
            audience: ['Board of Directors', 'Technical Teams']
          },
          projectData: {
            name: 'Digital Currency Project',
            client_name: 'Central Bank',
            industry: 'Financial Services'
          }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('custom-agent');
      expect(data.agentId).toBe('test-agent-id');
      expect(data.data).toEqual(mockResponse);

      // Verify the fetch call
      expect(fetch).toHaveBeenCalledWith(
        'https://ai.vave.ch/api/custom-agents/test-agent-id/chat',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          },
          body: expect.stringContaining('Improve the following deliverable brief')
        })
      );
    });

    it('should fallback to chat endpoint when custom agent fails', async () => {
      const chatResponse = {
        content: 'Improved brief from chat endpoint',
        metadata: { source: 'chat' }
      };

      // First call (custom agent) fails
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        statusText: 'Not Found'
      });

      // Second call (chat endpoint) succeeds
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue(chatResponse)
      });

      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          deliverableId: '507f1f77bcf86cd799439013',
          currentBrief: 'Original brief content',
          deliverableData: { title: 'Test Deliverable' },
          projectData: { name: 'Test Project' }
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.source).toBe('chat');
      expect(data.data).toEqual(chatResponse);

      // Verify both fetch calls were made
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(2,
        'https://ai.vave.ch/api/chat/send-streaming',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Key': 'test-api-key'
          }
        })
      );
    });

    it('should return 400 for missing deliverable ID', async () => {
      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          currentBrief: 'Brief content'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Deliverable ID is required');
    });

    it('should return 400 for missing brief content', async () => {
      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          deliverableId: '507f1f77bcf86cd799439013'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Current brief content is required');
    });

    it('should handle network errors', async () => {
      // Both custom agent and chat endpoint fail
      fetch.mockRejectedValue(new Error('Network error'));

      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          deliverableId: '507f1f77bcf86cd799439013',
          currentBrief: 'Original brief content'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to improve brief');
      expect(data.details).toBe('Network error');
    });

    it('should prepare correct context for AI request', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValue({ improved: true })
      });

      const request = new NextRequest('http://localhost:3001/api/ai/improve-brief', {
        method: 'POST',
        body: JSON.stringify({
          deliverableId: '507f1f77bcf86cd799439013',
          currentBrief: 'Original brief content',
          deliverableData: {
            title: 'CBDC Implementation Strategy',
            type: 'presentation',
            audience: ['Board of Directors', 'Technical Teams']
          },
          projectData: {
            name: 'Digital Currency Project',
            client_name: 'Central Bank',
            industry: 'Financial Services'
          }
        })
      });

      await POST(request);

      const fetchCall = fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);

      expect(requestBody.context).toEqual({
        deliverableId: '507f1f77bcf86cd799439013',
        deliverableName: 'CBDC Implementation Strategy',
        deliverableType: 'presentation',
        audience: ['Board of Directors', 'Technical Teams'],
        projectName: 'Digital Currency Project',
        clientName: 'Central Bank',
        industry: 'Financial Services',
        currentBrief: 'Original brief content',
        requestType: 'brief_improvement'
      });

      expect(requestBody.message).toContain('Improve the following deliverable brief');
      expect(requestBody.message).toContain('CBDC Implementation Strategy');
      expect(requestBody.message).toContain('Central Bank');
      expect(requestBody.message).toContain('Financial Services');
    });
  });
});