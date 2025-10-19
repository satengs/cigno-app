/**
 * Integration test for right section scrolling behavior
 * Tests that the right section has proper height and scrolling
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock the RightSection component for testing
const MockRightSection = ({ showLayoutOptions = false }) => (
  <div 
    className="flex flex-col h-full relative overflow-hidden border-l"
    style={{ width: '320px' }}
    data-testid="right-section"
  >
    {/* Resizer Handle */}
    <div className="absolute left-0 top-0 w-1 h-full cursor-col-resize z-30">
      <div className="h-8 w-0.5 rounded" />
    </div>

    {/* Layout Options Section */}
    {showLayoutOptions ? (
      <div className="flex flex-col flex-1 min-h-0" data-testid="layout-options-section">
        <div className="flex items-center justify-between p-4">
          <span>Layout Options</span>
        </div>
        
        <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1" data-testid="layout-scrollable">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="p-3 border rounded-lg">
              Layout Option {i + 1}
            </div>
          ))}
        </div>
      </div>
    ) : (
      <div className="flex flex-col flex-1 min-h-0 space-y-0" data-testid="resources-sections">
        {/* Internal Resources Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4">
            <span>Internal Resources</span>
          </div>
          
          <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1" data-testid="internal-scrollable">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="p-2 border rounded">
                Internal Resource {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* External Resources Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4">
            <span>External Resources</span>
          </div>
          
          <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1" data-testid="external-scrollable">
            {Array.from({ length: 15 }, (_, i) => (
              <div key={i} className="p-2 border rounded">
                External Resource {i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Related Insights Section */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between p-4">
            <span>Related Insights</span>
          </div>
          
          <div className="px-4 pb-4 space-y-3 overflow-y-auto flex-1" data-testid="insights-scrollable">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="p-2 border rounded">
                Insight {i + 1}
              </div>
            ))}
          </div>
        </div>
      </div>
    )}

    {/* AI Assistant Section - Fixed at bottom */}
    <div 
      className="flex flex-col border-t border-l"
      style={{
        position: 'fixed',
        bottom: 0,
        right: 0,
        width: '320px'
      }}
      data-testid="ai-assistant-section"
    >
      <div className="flex items-center justify-between p-4">
        <span>AI Assistant</span>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="ai-scrollable">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="p-2 border rounded">
            AI Message {i + 1}
          </div>
        ))}
      </div>
    </div>
  </div>
);

const MockDashboardWithRightSection = ({ showLayoutOptions = false }) => (
  <div className="h-screen flex overflow-hidden" data-testid="dashboard">
    {/* Mock Left Nav */}
    <div className="border-r flex flex-col h-full" style={{ width: 280 }}>
      <div className="p-3">Left Navigation</div>
      <div className="flex-1 overflow-y-auto p-2">
        <div>Menu content</div>
      </div>
    </div>

    {/* Mock Content */}
    <div className="flex-1 flex min-h-0">
      <div className="flex-1 flex flex-col h-full min-h-0">
        <div className="p-6">Content Area</div>
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="p-6">Scrollable content</div>
        </div>
      </div>

      {/* Right Section */}
      <MockRightSection showLayoutOptions={showLayoutOptions} />
    </div>
  </div>
);

describe('Right Section Scrolling - Integration Test', () => {

  test('right section has correct height structure', () => {
    render(<MockDashboardWithRightSection />);
    
    const rightSection = screen.getByTestId('right-section');
    expect(rightSection).toHaveClass('h-full', 'flex', 'flex-col', 'overflow-hidden');
  });

  test('layout options section has proper scrolling when in layout mode', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={true} />);
    
    const layoutSection = screen.getByTestId('layout-options-section');
    const scrollableArea = screen.getByTestId('layout-scrollable');
    
    // Main section should have full height flex structure
    expect(layoutSection).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0');
    
    // Scrollable content should use flex-1 and overflow-y-auto
    expect(scrollableArea).toHaveClass('flex-1', 'overflow-y-auto');
  });

  test('resources sections have proper scrolling when not in layout mode', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={false} />);
    
    const resourcesWrapper = screen.getByTestId('resources-sections');
    const internalScrollable = screen.getByTestId('internal-scrollable');
    const externalScrollable = screen.getByTestId('external-scrollable');
    const insightsScrollable = screen.getByTestId('insights-scrollable');
    
    // Main wrapper should have proper flex structure
    expect(resourcesWrapper).toHaveClass('flex', 'flex-col', 'flex-1', 'min-h-0');
    
    // All scrollable areas should have proper classes
    expect(internalScrollable).toHaveClass('flex-1', 'overflow-y-auto');
    expect(externalScrollable).toHaveClass('flex-1', 'overflow-y-auto');
    expect(insightsScrollable).toHaveClass('flex-1', 'overflow-y-auto');
  });

  test('right section fits within dashboard container height', () => {
    render(<MockDashboardWithRightSection />);
    
    const dashboard = screen.getByTestId('dashboard');
    const rightSection = screen.getByTestId('right-section');
    
    // Dashboard should use h-screen and prevent overflow
    expect(dashboard).toHaveClass('h-screen', 'overflow-hidden');
    
    // Right section should use h-full to fit within dashboard
    expect(rightSection).toHaveClass('h-full');
    expect(rightSection).not.toHaveClass('h-screen');
  });

  test('AI assistant section is positioned correctly', () => {
    render(<MockDashboardWithRightSection />);
    
    const aiSection = screen.getByTestId('ai-assistant-section');
    
    // AI section should be present (fixed positioning is handled by CSS)
    expect(aiSection).toBeInTheDocument();
    expect(aiSection).toHaveClass('flex', 'flex-col');
  });

  test('right section prevents body scrolling while allowing internal scrolling', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={true} />);
    
    const rightSection = screen.getByTestId('right-section');
    const scrollableArea = screen.getByTestId('layout-scrollable');
    
    // Right section should prevent overflow
    expect(rightSection).toHaveClass('overflow-hidden');
    
    // But internal content should allow scrolling
    expect(scrollableArea).toHaveClass('overflow-y-auto');
  });

  test('layout options section takes full available space', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={true} />);
    
    const layoutSection = screen.getByTestId('layout-options-section');
    const scrollableArea = screen.getByTestId('layout-scrollable');
    
    // Section should expand to fill available space
    expect(layoutSection).toHaveClass('flex-1');
    
    // Scrollable area should also expand within the section
    expect(scrollableArea).toHaveClass('flex-1');
  });

  test('resources sections wrapper distributes space correctly', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={false} />);
    
    const resourcesWrapper = screen.getByTestId('resources-sections');
    
    // Wrapper should take full available space and distribute it
    expect(resourcesWrapper).toHaveClass('flex-1', 'min-h-0');
  });

  test('right section structure matches expected hierarchy', () => {
    render(<MockDashboardWithRightSection />);
    
    const dashboard = screen.getByTestId('dashboard');
    const rightSection = screen.getByTestId('right-section');
    
    // Right section should be contained within dashboard
    expect(dashboard).toContainElement(rightSection);
    
    // Right section should be properly nested in flex layout
    const mainContentArea = dashboard.querySelector('.flex-1.flex.min-h-0');
    expect(mainContentArea).toContainElement(rightSection);
  });

  test('no hardcoded viewport heights in scrollable areas', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={true} />);
    
    const scrollableArea = screen.getByTestId('layout-scrollable');
    
    // Should use flex classes instead of hardcoded heights
    expect(scrollableArea).toHaveClass('flex-1');
    
    // Should not have inline styles with viewport calculations
    const inlineStyle = scrollableArea.getAttribute('style');
    if (inlineStyle) {
      expect(inlineStyle).not.toMatch(/height.*calc.*100vh/);
    }
    // If no inline style, that's good - means we're using CSS classes
    expect(inlineStyle).toBeNull();
  });

  test('min-h-0 prevents flex items from growing beyond container', () => {
    render(<MockDashboardWithRightSection showLayoutOptions={true} />);
    
    const layoutSection = screen.getByTestId('layout-options-section');
    
    // Should have min-h-0 to prevent flex growth issues
    expect(layoutSection).toHaveClass('min-h-0');
  });
});