import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import DeliverableDetailsView from '../../src/components/layout/deliverable/DeliverableDetailsView';

// Mock data
const mockFormData = {
  name: 'Test Deliverable',
  type: 'Strategy Presentation',
  format: 'PPT',
  due_date: '2024-12-31',
  document_length: 25,
  brief: 'Test brief content',
  audience: ['Board of Directors', 'Technical Teams'],
  brief_quality: 8.5,
  strengths: 'Well defined requirements',
  improvements: 'Add more details'
};

const mockProps = {
  formData: mockFormData,
  newAudience: '',
  formatDueDateForDisplay: (date) => date,
  onInputChange: jest.fn(),
  onRemoveAudience: jest.fn(),
  onAddAudience: jest.fn(),
  onImproveBrief: jest.fn(),
  onGenerateStoryline: jest.fn(),
  isGeneratingStoryline: false,
  onNewAudienceChange: jest.fn(),
  onNewAudienceKeyDown: jest.fn(),
  onSave: jest.fn()
};

describe('DeliverableDetailsView', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders all form fields correctly', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    // Check name field
    expect(screen.getByDisplayValue('Test Deliverable')).toBeInTheDocument();
    
    // Check format buttons
    expect(screen.getByText('PPT')).toBeInTheDocument();
    expect(screen.getByText('DOC')).toBeInTheDocument();
    expect(screen.getByText('XLS')).toBeInTheDocument();
    
    // Check save button
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('format selection calls onInputChange with correct parameters', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const docButton = screen.getByText('DOC');
    fireEvent.click(docButton);
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('format', 'DOC');
  });

  test('shows selected format with correct styling', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const pptButton = screen.getByText('PPT');
    
    // PPT should be selected (active styling)
    expect(pptButton).toHaveClass('border-gray-900', 'bg-gray-900', 'text-white');
  });

  test('name input calls onInputChange when changed', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const nameInput = screen.getByDisplayValue('Test Deliverable');
    fireEvent.change(nameInput, { target: { value: 'Updated Deliverable' } });
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('name', 'Updated Deliverable');
  });

  test('save button calls onSave when clicked', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(mockProps.onSave).toHaveBeenCalledTimes(1);
  });

  test('document length slider updates correctly', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const slider = screen.getByDisplayValue('25');
    fireEvent.change(slider, { target: { value: '50' } });
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('document_length', 50);
  });

  test('audience management works correctly', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    // Check existing audience members are displayed
    expect(screen.getByText('Board of Directors')).toBeInTheDocument();
    expect(screen.getByText('Technical Teams')).toBeInTheDocument();
    
    // Find remove buttons by aria-label
    const removeButtons = screen.getAllByLabelText(/Remove .*/);
    expect(removeButtons).toHaveLength(2); // One for each audience member
    
    // Click remove button for first audience member
    fireEvent.click(removeButtons[0]);
    expect(mockProps.onRemoveAudience).toHaveBeenCalledWith('Board of Directors');
  });

  test('brief textarea updates correctly', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const briefTextarea = screen.getByDisplayValue('Test brief content');
    fireEvent.change(briefTextarea, { target: { value: 'Updated brief content' } });
    
    expect(mockProps.onInputChange).toHaveBeenCalledWith('brief', 'Updated brief content');
  });

  test('generate storyline button works', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    const generateButton = screen.getByText('Generate Storyline');
    fireEvent.click(generateButton);
    
    expect(mockProps.onGenerateStoryline).toHaveBeenCalledTimes(1);
  });

  test('shows loading state when generating storyline', () => {
    const propsWithLoading = { ...mockProps, isGeneratingStoryline: true };
    render(<DeliverableDetailsView {...propsWithLoading} />);
    
    expect(screen.getByText('Generating Storyline...')).toBeInTheDocument();
  });
});

describe('Format Selection Integration', () => {
  test('format persistence workflow', async () => {
    const onSave = jest.fn();
    const onInputChange = jest.fn();
    
    const props = {
      ...mockProps,
      onSave,
      onInputChange
    };
    
    render(<DeliverableDetailsView {...props} />);
    
    // 1. Change format
    const docButton = screen.getByText('DOC');
    fireEvent.click(docButton);
    
    expect(onInputChange).toHaveBeenCalledWith('format', 'DOC');
    
    // 2. Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);
    
    expect(onSave).toHaveBeenCalledTimes(1);
  });
});