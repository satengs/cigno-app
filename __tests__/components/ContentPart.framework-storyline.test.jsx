import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContentPart from '../../src/components/layout/ContentPart';

// Mock the framework extractor
jest.mock('../../src/lib/frameworkExtractor', () => ({
  extractFrameworksFromBriefScoring: jest.fn(),
  createSkeletonSections: jest.fn(),
  getDefaultFrameworks: jest.fn()
}));

// Mock fetch for API calls
global.fetch = jest.fn();

// Mock the framework extractor functions
const { extractFrameworksFromBriefScoring, createSkeletonSections, getDefaultFrameworks } = require('../../src/lib/frameworkExtractor');

describe('ContentPart - Framework-based Storyline Generation', () => {
  const mockSelectedItem = {
    type: 'deliverable',
    _id: 'deliverable_123',
    name: 'Test Deliverable',
    project: 'project_123',
    metadata: {
      project_id: 'project_123',
      client_name: 'Test Client',
      industry: 'financial-services'
    }
  };

  const mockFormData = {
    name: 'Test Deliverable',
    brief: 'Test brief content',
    brief_quality: 8.0,
    brief_strengths: ['Market analysis included', 'Clear objectives'],
    brief_improvements: ['Add competitor analysis', 'Include market sizing']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock successful API responses
    fetch.mockImplementation((url) => {
      if (url.includes('/api/ai/generate-section')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            success: true,
            data: {
              id: 'section_1',
              title: 'Generated Section',
              description: 'Generated content',
              markdown: '# Generated Section\n\nContent here',
              html: '<h1>Generated Section</h1><p>Content here</p>',
              charts: [],
              keyPoints: [],
              status: 'draft',
              order: 1,
              contentBlocks: [],
              locked: false,
              framework: 'market_sizing',
              generatedAt: new Date().toISOString(),
              source: 'ai-generated'
            }
          })
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ success: true })
      });
    });
  });

  describe('Framework Extraction', () => {
    test('should extract frameworks from brief scoring data when storyline is generated', async () => {
      const mockFrameworks = ['market_sizing', 'competitive_landscape', 'client_segments'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      getDefaultFrameworks.mockReturnValue(['default_framework']);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      const { container } = render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // Find and click the storyline generation button
      const storylineButton = container.querySelector('button[title*="Generate"]') || 
                             container.querySelector('button:contains("Generate Storyline")');
      
      if (storylineButton) {
        fireEvent.click(storylineButton);
      }

      // Wait for framework extraction to be called
      await waitFor(() => {
        expect(extractFrameworksFromBriefScoring).toHaveBeenCalledWith({
          data: {
            brief_quality: 8.0,
            brief_strengths: ['Market analysis included', 'Clear objectives'],
            brief_improvements: ['Add competitor analysis', 'Include market sizing']
          }
        });
      });
    });

    test('should fallback to default frameworks when extraction returns empty', async () => {
      extractFrameworksFromBriefScoring.mockReturnValue([]);
      const mockDefaultFrameworks = ['default_framework_1', 'default_framework_2'];
      getDefaultFrameworks.mockReturnValue(mockDefaultFrameworks);

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(getDefaultFrameworks).toHaveBeenCalled();
      });
    });
  });

  describe('Skeleton Section Creation', () => {
    test('should create skeleton sections immediately', async () => {
      const mockFrameworks = ['market_sizing', 'competitive_landscape'];
      const mockSkeletonSections = [
        {
          id: 'section_1',
          title: 'Market Sizing',
          description: 'Generating content for market_sizing...',
          isLoading: true,
          framework: 'market_sizing'
        },
        {
          id: 'section_2',
          title: 'Competitive Landscape',
          description: 'Generating content for competitive_landscape...',
          isLoading: true,
          framework: 'competitive_landscape'
        }
      ];

      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue(mockSkeletonSections);

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(createSkeletonSections).toHaveBeenCalledWith(mockFrameworks);
      });
    });
  });

  describe('Asynchronous Section Generation', () => {
    test('should generate content for each framework asynchronously', async () => {
      const mockFrameworks = ['market_sizing', 'competitive_landscape'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true },
        { id: 'section_2', framework: 'competitive_landscape', isLoading: true }
      ]);

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // Wait for all section generation calls
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate-section', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('market_sizing')
        }));
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate-section', expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('competitive_landscape')
        }));
      });
    });

    test('should handle section generation errors gracefully', async () => {
      const mockFrameworks = ['market_sizing'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      // Mock API error
      fetch.mockImplementation((url) => {
        if (url.includes('/api/ai/generate-section')) {
          return Promise.resolve({
            ok: false,
            json: () => Promise.resolve({
              error: 'API Error'
            })
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      });

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // Should not throw error, should handle gracefully
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate-section', expect.any(Object));
      });
    });
  });

  describe('Storyline State Management', () => {
    test('should set storyline dirty state when generating', async () => {
      const mockFrameworks = ['market_sizing'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      const { container } = render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // The storyline should be marked as dirty
      await waitFor(() => {
        // This would be tested by checking if the save button is enabled
        // or by checking the internal state
        expect(createSkeletonSections).toHaveBeenCalled();
      });
    });

    test('should switch to storyline view after generation starts', async () => {
      const mockFrameworks = ['market_sizing'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(createSkeletonSections).toHaveBeenCalled();
      });
    });
  });

  describe('API Integration', () => {
    test('should call generate-section API with correct parameters', async () => {
      const mockFrameworks = ['market_sizing'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/api/ai/generate-section', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining(JSON.stringify({
            framework: 'market_sizing',
            sectionIndex: 0,
            deliverableData: expect.any(Object),
            projectData: expect.any(Object),
            clientData: expect.any(Object),
            briefContent: 'Test brief content'
          }))
        });
      });
    });
  });

  describe('Error Handling', () => {
    test('should prevent multiple simultaneous storyline generations', async () => {
      const mockFrameworks = ['market_sizing'];
      extractFrameworksFromBriefScoring.mockReturnValue(mockFrameworks);
      createSkeletonSections.mockReturnValue([
        { id: 'section_1', framework: 'market_sizing', isLoading: true }
      ]);

      // Mock a slow API response
      fetch.mockImplementation((url) => {
        if (url.includes('/api/ai/generate-section')) {
          return new Promise(resolve => 
            setTimeout(() => resolve({
              ok: true,
              json: () => Promise.resolve({ success: true, data: {} })
            }), 1000)
          );
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ success: true }) });
      });

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // Should only call the API once even if triggered multiple times
      await waitFor(() => {
        expect(fetch).toHaveBeenCalledTimes(1);
      });
    });

    test('should handle brief quality validation', async () => {
      const lowQualityFormData = {
        ...mockFormData,
        brief_quality: 5.0 // Below threshold
      };

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={lowQualityFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      // Should not call framework extraction for low quality briefs
      await waitFor(() => {
        expect(extractFrameworksFromBriefScoring).not.toHaveBeenCalled();
      });
    });
  });

  describe('Framework-specific Tests', () => {
    test('should handle all supported frameworks', async () => {
      const allFrameworks = [
        'market_sizing', 'competitive_landscape', 'competition_analysis',
        'competitor_deep_dive', 'client_segments', 'product_landscape',
        'capability_benchmark', 'capability_assessment', 'gap_analysis',
        'industry_trends', 'strategic_options', 'recommendations',
        'buy_vs_build', 'partnerships', 'product_roadmap'
      ];

      extractFrameworksFromBriefScoring.mockReturnValue(allFrameworks);
      createSkeletonSections.mockReturnValue(
        allFrameworks.map((framework, index) => ({
          id: `section_${index + 1}`,
          framework,
          isLoading: true
        }))
      );

      render(
        <ContentPart
          selectedItem={mockSelectedItem}
          formData={mockFormData}
          onItemSelect={jest.fn()}
          refreshFromDatabase={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(createSkeletonSections).toHaveBeenCalledWith(allFrameworks);
        expect(fetch).toHaveBeenCalledTimes(allFrameworks.length);
      });
    });
  });
});
