/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CreateDeliverableModal from '../../src/components/ui/CreateDeliverableModal.jsx';

// Mock fetch
global.fetch = jest.fn();

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  X: () => <div>Close Icon</div>,
  Calendar: () => <div>Calendar Icon</div>,
  Plus: () => <div>Plus Icon</div>,
  ChevronDown: () => <div>Chevron Down Icon</div>
}));

describe('CreateDeliverableModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
    onDeliverableCreated: jest.fn(),
    projectId: '507f1f77bcf86cd799439013'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        success: true,
        data: { deliverable: { _id: 'new-deliverable-id' } }
      })
    });
  });

  it('should render create modal with default values', () => {
    render(<CreateDeliverableModal {...defaultProps} />);

    expect(screen.getByText('Create New Deliverable')).toBeInTheDocument();
    expect(screen.getByDisplayValue('CBDC Implementation Strategy for Global Banking')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-02-15')).toBeInTheDocument();
    
    // Check that proper enum values are selected by default
    const typeSelect = screen.getByDisplayValue('Strategy Presentation');
    expect(typeSelect).toBeInTheDocument();
  });

  it('should render edit modal with existing data', () => {
    const editItem = {
      name: 'Existing Deliverable',
      type: 'Report',
      format: 'DOC',
      status: 'in_progress',
      priority: 'high',
      due_date: '2025-01-20',
      description: 'Existing description'
    };

    render(
      <CreateDeliverableModal 
        {...defaultProps} 
        editItem={editItem}
      />
    );

    expect(screen.getByText('Edit Deliverable')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Existing Deliverable')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2025-01-20')).toBeInTheDocument();
  });

  it('should handle form submission for new deliverable', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    // Fill out the form
    const nameInput = screen.getByDisplayValue('CBDC Implementation Strategy for Global Banking');
    await user.clear(nameInput);
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

    expect(defaultProps.onDeliverableCreated).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle form submission for editing deliverable', async () => {
    const user = userEvent.setup();
    const editItem = {
      _id: 'existing-id',
      name: 'Existing Deliverable',
      type: 'Report'
    };

    render(
      <CreateDeliverableModal 
        {...defaultProps} 
        editItem={editItem}
      />
    );

    const submitButton = screen.getByRole('button', { name: /update deliverable/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/deliverables/existing-id',
        expect.objectContaining({
          method: 'PUT'
        })
      );
    });
  });

  it('should validate required fields', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    // Clear the required name field
    const nameInput = screen.getByDisplayValue('CBDC Implementation Strategy for Global Banking');
    await user.clear(nameInput);

    const submitButton = screen.getByRole('button', { name: /create deliverable/i });
    await user.click(submitButton);

    expect(screen.getByText('Name is required')).toBeInTheDocument();
    expect(fetch).not.toHaveBeenCalled();
  });

  it('should handle API errors gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock fetch to return an error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        error: 'Server error'
      })
    });

    render(<CreateDeliverableModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /create deliverable/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    // The modal should not close on error
    expect(defaultProps.onClose).not.toHaveBeenCalled();
  });

  it('should toggle audience selection', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    // Initially, some audience options should be selected
    const boardDirectorsButton = screen.getByRole('button', { name: /board of directors/i });
    expect(boardDirectorsButton).toHaveClass('bg-blue-100');

    // Click to deselect
    await user.click(boardDirectorsButton);
    expect(boardDirectorsButton).toHaveClass('bg-white');

    // Click to select again
    await user.click(boardDirectorsButton);
    expect(boardDirectorsButton).toHaveClass('bg-blue-100');
  });

  it('should change deliverable type and format', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    // Change type
    const typeSelect = screen.getByLabelText(/type/i);
    await user.selectOptions(typeSelect, 'Report');
    expect(typeSelect.value).toBe('Report');

    // Change format
    const docButton = screen.getByRole('button', { name: 'DOC' });
    await user.click(docButton);
    expect(docButton).toHaveClass('bg-blue-100');
  });

  it('should handle close button click', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    const closeButton = screen.getByRole('button', { name: /close/i });
    await user.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should display proper data sources', () => {
    render(<CreateDeliverableModal {...defaultProps} />);

    expect(screen.getByText('📄 From: Project Brief')).toBeInTheDocument();
    expect(screen.getByText('📋 From: Client Requirements')).toBeInTheDocument();
    expect(screen.getByText('👥 From: Stakeholder Analysis')).toBeInTheDocument();
    expect(screen.getByText('📅 From: Project Timeline')).toBeInTheDocument();
  });

  it('should submit form with correct enum values', async () => {
    const user = userEvent.setup();
    
    render(<CreateDeliverableModal {...defaultProps} />);

    // Select specific options that should map to correct enum values
    const typeSelect = screen.getByLabelText(/type/i);
    await user.selectOptions(typeSelect, 'Report'); // Should map to 'Report'

    const statusSelect = screen.getByLabelText(/status/i);
    await user.selectOptions(statusSelect, 'in_progress'); // Should map to 'in_progress'

    const prioritySelect = screen.getByLabelText(/priority/i);
    await user.selectOptions(prioritySelect, 'high'); // Should map to 'high'

    const submitButton = screen.getByRole('button', { name: /create deliverable/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const fetchCall = fetch.mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1].body);

    expect(requestBody.type).toBe('Report');
    expect(requestBody.status).toBe('in_progress');
    expect(requestBody.priority).toBe('high');
  });

  it('should not render when isOpen is false', () => {
    render(<CreateDeliverableModal {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Create New Deliverable')).not.toBeInTheDocument();
  });

  it('should display loading state during submission', async () => {
    const user = userEvent.setup();
    
    // Mock fetch to simulate slow response
    fetch.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: () => Promise.resolve({ success: true, data: {} })
      }), 100))
    );

    render(<CreateDeliverableModal {...defaultProps} />);

    const submitButton = screen.getByRole('button', { name: /create deliverable/i });
    await user.click(submitButton);

    // Should show loading state
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(defaultProps.onClose).toHaveBeenCalled();
    });
  });
});