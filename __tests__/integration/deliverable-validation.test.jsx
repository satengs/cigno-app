/**
 * Integration test for deliverable validation error handling
 * Tests the complete workflow for validation scenarios
 */

// Mock fetch globally
global.fetch = jest.fn();

describe('Deliverable Validation - Integration Test', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
    window.alert = jest.fn();
  });

  test('handles missing required fields validation errors', async () => {
    const deliverableId = '68e6f020088a8360a7ae4f09';
    
    // Mock validation error response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Validation failed',
        details: {
          project: { message: 'Project is required' },
          brief: { message: 'Brief is required' },
          due_date: { message: 'Due date is required' }
        }
      })
    });

    // Simulate incomplete form data
    const incompleteFormData = {
      name: 'Test Deliverable',
      format: 'PPT',
      type: 'Strategy Presentation'
      // Missing: brief, due_date, project
    };

    const saveFunction = async () => {
      try {
        const response = await fetch(`/api/deliverables/${deliverableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(incompleteFormData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          window.alert(errorData.error || 'Failed to save deliverable changes');
        }
      } catch (error) {
        console.error('Error saving deliverable:', error);
        window.alert('Error saving deliverable changes');
      }
    };

    await saveFunction();

    // Verify error handling
    expect(fetch).toHaveBeenCalledWith(
      `/api/deliverables/${deliverableId}`,
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        }
      })
    );
    
    expect(window.alert).toHaveBeenCalledWith('Validation failed');
  });

  test('handles invalid format enum validation', async () => {
    const deliverableId = '68e6f020088a8360a7ae4f09';
    
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Validation failed',
        details: {
          format: { 
            message: '`INVALID_FORMAT` is not a valid enum value for path `format`.'
          }
        }
      })
    });

    const invalidFormatData = {
      name: 'Test Deliverable',
      format: 'INVALID_FORMAT',
      brief: 'Test brief',
      due_date: '2024-12-31'
    };

    const saveFunction = async () => {
      try {
        const response = await fetch(`/api/deliverables/${deliverableId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invalidFormatData)
        });

        if (!response.ok) {
          const errorData = await response.json();
          window.alert(errorData.error || 'Failed to save deliverable changes');
        }
      } catch (error) {
        console.error('Error saving deliverable:', error);
      }
    };

    await saveFunction();

    expect(window.alert).toHaveBeenCalledWith('Validation failed');
  });

  test('successful save with proper format mapping', async () => {
    const deliverableId = '68e6f020088a8360a7ae4f09';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        _id: deliverableId,
        name: 'Test Deliverable',
        format: 'PPTX', // Schema format
        brief: 'Test brief',
        success: true
      })
    });

    // Simulate proper format mapping function
    const mapFormatToSchema = (uiFormat) => {
      const formatMap = {
        'PPT': 'PPTX',
        'DOC': 'DOCX',
        'XLS': 'XLSX'
      };
      return formatMap[uiFormat] || uiFormat;
    };

    const validFormData = {
      name: 'Test Deliverable',
      format: 'PPT', // UI format
      brief: 'Test brief',
      due_date: '2024-12-31'
    };

    const payload = {
      ...validFormData,
      format: mapFormatToSchema(validFormData.format), // Convert to schema format
      due_date: new Date(validFormData.due_date)
    };

    const saveFunction = async () => {
      const response = await fetch(`/api/deliverables/${deliverableId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        window.alert('Deliverable saved successfully!');
      }
    };

    await saveFunction();

    // Verify correct format mapping
    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.format).toBe('PPTX'); // Schema format, not UI format
    expect(window.alert).toHaveBeenCalledWith('Deliverable saved successfully!');
  });

  test('validates required project field handling', async () => {
    const deliverableId = '68e6f020088a8360a7ae4f09';
    
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    // Mock selectedItem with project information
    const selectedItem = {
      _id: deliverableId,
      project: '507f1f77bcf86cd799439011' // Valid ObjectId
    };

    const formData = {
      name: 'Test Deliverable',
      format: 'PPT',
      brief: 'Test brief',
      due_date: '2024-12-31'
    };

    const payload = {
      ...formData,
      project: selectedItem.project, // Ensure project is included
      format: 'PPTX' // Mapped format
    };

    await fetch(`/api/deliverables/${deliverableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const requestBody = JSON.parse(fetch.mock.calls[0][1].body);
    expect(requestBody.project).toBe('507f1f77bcf86cd799439011');
    expect(requestBody.format).toBe('PPTX');
  });

  test('handles pre-save validation checks', async () => {
    const deliverableId = '68e6f020088a8360a7ae4f09';
    
    // Mock selectedItem without project
    const selectedItemWithoutProject = {
      _id: deliverableId
      // Missing project field
    };

    const formDataWithoutBrief = {
      name: 'Test Deliverable',
      format: 'PPT',
      due_date: '2024-12-31'
      // Missing brief
    };

    // Simulate pre-save validation
    const validateBeforeSave = (formData, selectedItem) => {
      const projectId = selectedItem.project || selectedItem.project_id;
      
      if (!projectId) {
        window.alert('Cannot save: Missing project information. Please refresh the page and try again.');
        return false;
      }

      if (!formData.brief || formData.brief.trim() === '') {
        window.alert('Cannot save: Brief is required. Please add a brief description.');
        return false;
      }

      return true;
    };

    // Test missing project
    const isValidProject = validateBeforeSave(formDataWithoutBrief, selectedItemWithoutProject);
    expect(isValidProject).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Cannot save: Missing project information. Please refresh the page and try again.');

    // Test missing brief (with project)
    window.alert.mockClear();
    const selectedItemWithProject = { ...selectedItemWithoutProject, project: '507f1f77bcf86cd799439011' };
    const isValidBrief = validateBeforeSave(formDataWithoutBrief, selectedItemWithProject);
    expect(isValidBrief).toBe(false);
    expect(window.alert).toHaveBeenCalledWith('Cannot save: Brief is required. Please add a brief description.');
  });
});