/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import UnifiedAddModal from '../../src/components/ui/UnifiedAddModal.jsx';

// Mock fetch
global.fetch = jest.fn();

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div>Close Icon</div>,
  Plus: () => <div>Plus Icon</div>,
  Users: () => <div>Users Icon</div>,
  FolderOpen: () => <div>FolderOpen Icon</div>,
  FileText: () => <div>FileText Icon</div>,
  Building: () => <div>Building Icon</div>,
  ChevronDown: () => <div>Chevron Down Icon</div>
}));

describe('UnifiedAddModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    onProjectCreated: jest.fn(),
    onClientCreated: jest.fn(),
    onDeliverableCreated: jest.fn(),
    selectedProjectId: '507f1f77bcf86cd799439012'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { 
          project: { _id: 'new-project-id' },
          client: { _id: 'new-client-id' },
          deliverable: { _id: 'new-deliverable-id' }
        }
      })
    });
  });

  it('should render modal with tab options', () => {
    render(<UnifiedAddModal {...mockProps} />);

    expect(screen.getByText('Add New')).toBeInTheDocument();
    expect(screen.getByText('Project')).toBeInTheDocument();
    expect(screen.getByText('Client')).toBeInTheDocument();
    expect(screen.getByText('Deliverable')).toBeInTheDocument();
  });

  it('should switch between tabs', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    const clientTab = screen.getByText('Client');
    await user.click(clientTab);

    expect(screen.getByText('Create New Client')).toBeInTheDocument();
  });

  it('should show deliverable tab when project is selected', () => {
    render(<UnifiedAddModal {...mockProps} />);

    const deliverableTab = screen.getByText('Deliverable');
    expect(deliverableTab).toBeInTheDocument();
    expect(deliverableTab).not.toBeDisabled();
  });

  it('should disable deliverable tab when no project selected', () => {
    const propsWithoutProject = {
      ...mockProps,
      selectedProjectId: null
    };

    render(<UnifiedAddModal {...propsWithoutProject} />);

    const deliverableTab = screen.getByText('Deliverable');
    expect(deliverableTab.closest('button')).toBeDisabled();
  });

  it('should handle project creation', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    // Fill project form
    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'New Test Project');

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/projects',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('New Test Project')
        })
      );
    });

    expect(mockProps.onProjectCreated).toHaveBeenCalled();
  });

  it('should handle client creation', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    // Switch to client tab
    const clientTab = screen.getByText('Client');
    await user.click(clientTab);

    // Fill client form
    const nameInput = screen.getByLabelText(/client name/i);
    await user.type(nameInput, 'New Test Client');

    const submitButton = screen.getByRole('button', { name: /create client/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/clients',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('New Test Client')
        })
      );
    });

    expect(mockProps.onClientCreated).toHaveBeenCalled();
  });

  it('should handle deliverable creation', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    // Switch to deliverable tab
    const deliverableTab = screen.getByText('Deliverable');
    await user.click(deliverableTab);

    // Fill deliverable form (basic fields)
    const nameInput = screen.getByLabelText(/deliverable name/i);
    await user.type(nameInput, 'New Test Deliverable');

    const submitButton = screen.getByRole('button', { name: /create deliverable/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/deliverables',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.stringContaining('New Test Deliverable')
        })
      );
    });

    expect(mockProps.onDeliverableCreated).toHaveBeenCalled();
  });

  it('should handle validation errors', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    // Try to submit without filling required fields
    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    expect(screen.getByText(/required/i)).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        error: 'Server error'
      })
    });

    render(<UnifiedAddModal {...mockProps} />);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // Modal should not close on error
    expect(mockProps.onClose).not.toHaveBeenCalled();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<UnifiedAddModal {...mockProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it('should not render when isOpen is false', () => {
    const propsNotOpen = {
      ...mockProps,
      isOpen: false
    };

    render(<UnifiedAddModal {...propsNotOpen} />);

    expect(screen.queryByText('Add New')).not.toBeInTheDocument();
  });

  it('should show loading states during submission', async () => {
    const user = userEvent.setup();
    
    // Mock slow API response
    fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      }), 100))
    );

    render(<UnifiedAddModal {...mockProps} />);

    const nameInput = screen.getByLabelText(/project name/i);
    await user.type(nameInput, 'Test Project');

    const submitButton = screen.getByRole('button', { name: /create project/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText(/creating/i)).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(mockProps.onProjectCreated).toHaveBeenCalled();
    });
  });
});