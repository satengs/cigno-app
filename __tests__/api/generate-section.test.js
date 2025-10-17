const { POST } = require('../../src/app/api/ai/generate-section/route');

// Mock the agent caller - create a simple mock since the module doesn't exist yet
const callAgent = jest.fn();

describe('/api/ai/generate-section', () => {
  const mockRequest = (body) => ({
    json: () => Promise.resolve(body)
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/generate-section', () => {
    test('should generate section content successfully', async () => {
      const requestBody = {
        framework: 'market_sizing',
        sectionIndex: 0,
        deliverableData: {
          id: 'deliverable_123',
          name: 'Test Deliverable',
          brief: 'Test brief content'
        },
        projectData: {
          id: 'project_123',
          name: 'Test Project',
          client_name: 'Test Client',
          industry: 'financial-services'
        },
        clientData: {
          name: 'Test Client',
          industry: 'financial-services'
        },
        briefContent: 'Test brief content'
      };

      const mockAgentResponse = {
        success: true,
        output: {
          id: 'section_1',
          title: 'Market Sizing Analysis',
          description: 'Comprehensive market sizing analysis',
          markdown: '# Market Sizing Analysis\n\nContent here',
          html: '<h1>Market Sizing Analysis</h1><p>Content here</p>',
          charts: [],
          keyPoints: ['Key point 1', 'Key point 2'],
          status: 'draft',
          order: 1,
          contentBlocks: [],
          locked: false,
          framework: 'market_sizing',
          generatedAt: new Date().toISOString(),
          source: 'ai-generated'
        }
      };

      callAgent.mockResolvedValue(mockAgentResponse);

      const response = await POST(mockRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.data).toEqual(mockAgentResponse.output);
      expect(callAgent).toHaveBeenCalledWith(
        expect.any(String), // agentId
        {
          framework: 'market_sizing',
          sectionIndex: 0,
          deliverableData: requestBody.deliverableData,
          projectData: requestBody.projectData,
          clientData: requestBody.clientData,
          briefContent: 'Test brief content'
        }
      );
    });

    test('should return 400 error when framework is missing', async () => {
      const requestBody = {
        sectionIndex: 0,
        deliverableData: {},
        projectData: {},
        clientData: {},
        briefContent: 'Test brief'
      };

      const response = await POST(mockRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Framework is required');
    });

    test('should handle agent call failures', async () => {
      const requestBody = {
        framework: 'market_sizing',
        sectionIndex: 0,
        deliverableData: {},
        projectData: {},
        clientData: {},
        briefContent: 'Test brief'
      };

      callAgent.mockResolvedValue({
        success: false,
        error: 'Agent call failed'
      });

      const response = await POST(mockRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Agent call failed');
    });

    test('should handle agent call exceptions', async () => {
      const requestBody = {
        framework: 'market_sizing',
        sectionIndex: 0,
        deliverableData: {},
        projectData: {},
        clientData: {},
        briefContent: 'Test brief'
      };

      callAgent.mockRejectedValue(new Error('Network error'));

      const response = await POST(mockRequest(requestBody));
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Network error');
    });

    test('should map different frameworks to correct agent IDs', async () => {
      const frameworks = [
        'market_sizing',
        'competitive_landscape',
        'competition_analysis',
        'competitor_deep_dive',
        'client_segments',
        'product_landscape',
        'capability_benchmark',
        'capability_assessment',
        'gap_analysis',
        'industry_trends',
        'strategic_options',
        'recommendations',
        'buy_vs_build',
        'partnerships',
        'product_roadmap'
      ];

      callAgent.mockResolvedValue({
        success: true,
        output: { id: 'section_1', title: 'Test Section' }
      });

      for (const framework of frameworks) {
        const requestBody = {
          framework,
          sectionIndex: 0,
          deliverableData: {},
          projectData: {},
          clientData: {},
          briefContent: 'Test brief'
        };

        await POST(mockRequest(requestBody));
        
        expect(callAgent).toHaveBeenCalledWith(
          expect.any(String), // Should be a valid agent ID
          expect.objectContaining({
            framework,
            sectionIndex: 0
          })
        );
      }
    });

    test('should handle environment variable agent ID mapping', async () => {
      // Set environment variables
      process.env.AGENT_ID_MARKET_SIZING = 'market_sizing_agent_123';
      process.env.AGENT_ID_DEFAULT_SECTION_GENERATION = 'default_agent_456';

      const requestBody = {
        framework: 'market_sizing',
        sectionIndex: 0,
        deliverableData: {},
        projectData: {},
        clientData: {},
        briefContent: 'Test brief'
      };

      callAgent.mockResolvedValue({
        success: true,
        output: { id: 'section_1', title: 'Test Section' }
      });

      await POST(mockRequest(requestBody));

      expect(callAgent).toHaveBeenCalledWith(
        'market_sizing_agent_123',
        expect.any(Object)
      );

      // Clean up
      delete process.env.AGENT_ID_MARKET_SIZING;
      delete process.env.AGENT_ID_DEFAULT_SECTION_GENERATION;
    });

    test('should fallback to default agent ID for unknown frameworks', async () => {
      process.env.AGENT_ID_DEFAULT_SECTION_GENERATION = 'default_agent_789';

      const requestBody = {
        framework: 'unknown_framework',
        sectionIndex: 0,
        deliverableData: {},
        projectData: {},
        clientData: {},
        briefContent: 'Test brief'
      };

      callAgent.mockResolvedValue({
        success: true,
        output: { id: 'section_1', title: 'Test Section' }
      });

      await POST(mockRequest(requestBody));

      expect(callAgent).toHaveBeenCalledWith(
        'default_agent_789',
        expect.any(Object)
      );

      // Clean up
      delete process.env.AGENT_ID_DEFAULT_SECTION_GENERATION;
    });

    test('should handle malformed request body', async () => {
      const malformedRequest = {
        json: () => Promise.reject(new Error('Invalid JSON'))
      };

      const response = await POST(malformedRequest);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.error).toBe('Invalid JSON');
    });
  });
});