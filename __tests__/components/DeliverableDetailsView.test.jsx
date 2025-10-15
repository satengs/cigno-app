import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
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
  improvements: 'Add more details',
  brief_strengths: ['Well defined requirements'],
  brief_improvements: ['Add more details']
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

  test('renders key sections correctly', () => {
    render(<DeliverableDetailsView {...mockProps} />);
    
    expect(screen.getByDisplayValue('Test Deliverable')).toBeInTheDocument();
    expect(screen.getByText('Audience')).toBeInTheDocument();
    expect(screen.getByText('Recognized Strengths')).toBeInTheDocument();
    expect(screen.getByText('Suggested Improvements')).toBeInTheDocument();
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

  test('displays recognized strengths and improvements', () => {
    render(<DeliverableDetailsView {...mockProps} />);

    expect(screen.getByText('Recognized Strengths')).toBeInTheDocument();
    expect(screen.getByText('• Well defined requirements')).toBeInTheDocument();
    expect(screen.getByText('Suggested Improvements')).toBeInTheDocument();
    expect(screen.getByText('• Add more details')).toBeInTheDocument();
  });

  test('shows quality score indicator', () => {
    render(<DeliverableDetailsView {...mockProps} />);

    expect(screen.getByText('8.5 / 10')).toBeInTheDocument();
    expect(screen.getByText('Brief Quality Score')).toBeInTheDocument();
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
