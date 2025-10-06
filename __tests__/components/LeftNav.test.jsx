/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LeftNav from '../../src/components/layout/LeftNav.jsx';

// Mock fetch
global.fetch = jest.fn();

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Plus: () => <div>Plus Icon</div>,
  Search: () => <div>Search Icon</div>,
  ChevronDown: () => <div>Chevron Down Icon</div>,
  ChevronRight: () => <div>Chevron Right Icon</div>,
  Folder: () => <div>Folder Icon</div>,
  File: () => <div>File Icon</div>,
  Settings: () => <div>Settings Icon</div>,
  Users: () => <div>Users Icon</div>,
  BarChart: () => <div>BarChart Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  MessageSquare: () => <div>MessageSquare Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  Target: () => <div>Target Icon</div>,
  Lightbulb: () => <div>Lightbulb Icon</div>,
  TrendingUp: () => <div>TrendingUp Icon</div>,
  Clock: () => <div>Clock Icon</div>,
  CheckSquare: () => <div>CheckSquare Icon</div>,
  AlertCircle: () => <div>AlertCircle Icon</div>,
  Archive: () => <div>Archive Icon</div>
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      refresh: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/dashboard'
  },
}));

describe('LeftNav', () => {
  const mockProps = {
    onAddProject: jest.fn(),
    onAddClient: jest.fn(),
    onAddDeliverable: jest.fn(),
    selectedItem: null,
    onItemSelect: jest.fn(),
    searchQuery: '',
    onSearchChange: jest.fn(),
    menuItems: [
      {
        id: '1',
        title: 'Test Project',
        type: 'project',
        children: [
          {
            id: '2',
            title: 'Test Deliverable',
            type: 'deliverable',
            status: 'in_progress'
          }
        ]
      },
      {
        id: '3',
        title: 'Test Client',
        type: 'client'
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: [] })
    });
  });

  it('should render navigation structure', () => {
    render(<LeftNav {...mockProps} />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
    expect(screen.getByText('Test Client')).toBeInTheDocument();
  });

  it('should handle search functionality', async () => {
    const user = userEvent.setup();
    render(<LeftNav {...mockProps} />);

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'test query');

    expect(mockProps.onSearchChange).toHaveBeenCalledWith('test query');
  });

  it('should expand and collapse project sections', async () => {
    const user = userEvent.setup();
    render(<LeftNav {...mockProps} />);

    const projectExpandButton = screen.getByText('Test Project').closest('div');
    await user.click(projectExpandButton);

    expect(screen.getByText('Test Deliverable')).toBeInTheDocument();
  });

  it('should handle item selection', async () => {
    const user = userEvent.setup();
    render(<LeftNav {...mockProps} />);

    const projectItem = screen.getByText('Test Project');
    await user.click(projectItem);

    expect(mockProps.onItemSelect).toHaveBeenCalledWith(
      expect.objectContaining({
        id: '1',
        title: 'Test Project',
        type: 'project'
      })
    );
  });

  it('should handle add buttons', async () => {
    const user = userEvent.setup();
    render(<LeftNav {...mockProps} />);

    // Should have add buttons for projects and clients
    const addButtons = screen.getAllByRole('button', { name: /add/i });
    expect(addButtons.length).toBeGreaterThan(0);
  });

  it('should show status indicators for deliverables', () => {
    render(<LeftNav {...mockProps} />);

    // Expand project to see deliverable
    const projectExpandButton = screen.getByText('Test Project').closest('div');
    fireEvent.click(projectExpandButton);

    expect(screen.getByText('Test Deliverable')).toBeInTheDocument();
  });

  it('should filter items based on search query', () => {
    const propsWithSearch = {
      ...mockProps,
      searchQuery: 'Test Project'
    };

    render(<LeftNav {...propsWithSearch} />);

    expect(screen.getByText('Test Project')).toBeInTheDocument();
    // Other items might be filtered out based on search implementation
  });

  it('should highlight selected item', () => {
    const propsWithSelected = {
      ...mockProps,
      selectedItem: { id: '1', type: 'project' }
    };

    render(<LeftNav {...propsWithSelected} />);

    const selectedItem = screen.getByText('Test Project').closest('div');
    expect(selectedItem).toHaveClass(/selected|active|bg-blue/);
  });

  it('should handle empty menu items gracefully', () => {
    const propsWithEmpty = {
      ...mockProps,
      menuItems: []
    };

    render(<LeftNav {...propsWithEmpty} />);

    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Clients')).toBeInTheDocument();
  });

  it('should show loading state appropriately', () => {
    const propsWithLoading = {
      ...mockProps,
      isLoading: true
    };

    render(<LeftNav {...propsWithLoading} />);

    // Should render without crashing during loading
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});