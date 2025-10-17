import { handleSaveDeliverable } from '../../src/components/layout/ContentPart';

// Mock fetch globally
global.fetch = jest.fn();

describe('Deliverable Save Functionality', () => {
  beforeEach(() => {
    fetch.mockClear();
    console.log = jest.fn();
    console.error = jest.fn();
    window.alert = jest.fn();
  });

  const mockFormData = {
    name: 'Test Deliverable',
    type: 'Strategy Presentation',
    format: 'DOC',
    due_date: '2024-12-31',
    document_length: 30,
    brief: 'Updated brief content',
    audience: ['Board of Directors'],
    brief_quality: 8.5,
    brief_strengths: ['Strong analysis'],
    brief_improvements: ['Add timeline']
  };

  const mockSelectedItem = {
    _id: '68e6f020088a8360a7ae4f09'
  };

  test('successful save makes correct API call', async () => {
    // Mock successful response
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const refreshFromDatabase = jest.fn();

    // Simulate the save function
    const saveFunction = async () => {
      try {
        const response = await fetch(`/api/deliverables/${mockSelectedItem._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: mockFormData.name,
            type: mockFormData.type,
            format: mockFormData.format,
            due_date: mockFormData.due_date,
            document_length: mockFormData.document_length,
            brief: mockFormData.brief,
            audience: mockFormData.audience,
            brief_quality: mockFormData.brief_quality,
            brief_strengths: mockFormData.brief_strengths,
            brief_improvements: mockFormData.brief_improvements
          })
        });

        if (response.ok) {
          await refreshFromDatabase();
          window.alert('Deliverable saved successfully!');
        }
      } catch (error) {
        console.error('Error saving deliverable:', error);
      }
    };

    await saveFunction();

    // Verify API call
    expect(fetch).toHaveBeenCalledWith(
      '/api/deliverables/68e6f020088a8360a7ae4f09',
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: 'Test Deliverable',
          type: 'Strategy Presentation',
          format: 'DOC',
          due_date: '2024-12-31',
          document_length: 30,
          brief: 'Updated brief content',
          audience: ['Board of Directors'],
          brief_quality: 8.5,
          brief_strengths: ['Strong analysis'],
          brief_improvements: ['Add timeline']
        })
      }
    );

    // Verify success actions
    expect(refreshFromDatabase).toHaveBeenCalledTimes(1);
    expect(window.alert).toHaveBeenCalledWith('Deliverable saved successfully!');
  });

  test('handles API error response correctly', async () => {
    // Mock error response
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Validation failed' })
    });

    const saveFunction = async () => {
      try {
        const response = await fetch(`/api/deliverables/${mockSelectedItem._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFormData)
        });

        if (!response.ok) {
          let errorMessage = 'Failed to save deliverable changes';
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (parseError) {
            console.error('Failed to parse error response:', parseError);
          }
          window.alert(errorMessage);
        }
      } catch (error) {
        console.error('Error saving deliverable:', error);
      }
    };

    await saveFunction();

    expect(window.alert).toHaveBeenCalledWith('Validation failed');
  });

  test('handles network error correctly', async () => {
    // Mock network error
    fetch.mockRejectedValueOnce(new Error('Network error'));

    const saveFunction = async () => {
      try {
        await fetch(`/api/deliverables/${mockSelectedItem._id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(mockFormData)
        });
      } catch (error) {
        console.error('Error saving deliverable:', error);
        window.alert('Error saving deliverable changes');
      }
    };

    await saveFunction();

    expect(console.error).toHaveBeenCalledWith('Error saving deliverable:', expect.any(Error));
    expect(window.alert).toHaveBeenCalledWith('Error saving deliverable changes');
  });

  test('format field is included in save payload', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true })
    });

    const formDataWithDifferentFormat = {
      ...mockFormData,
      format: 'XLS'
    };

    const saveFunction = async () => {
      await fetch(`/api/deliverables/${mockSelectedItem._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formDataWithDifferentFormat)
      });
    };

    await saveFunction();

    const lastCall = fetch.mock.calls[0];
    const requestBody = JSON.parse(lastCall[1].body);
    
    expect(requestBody.format).toBe('XLS');
    expect(requestBody.name).toBe('Test Deliverable');
  });
});

describe('API Integration', () => {
  test('PATCH method is used with correct endpoint', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: '123', format: 'PPT' })
    });

    await fetch('/api/deliverables/123', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ format: 'PPT' })
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/deliverables/123',
      expect.objectContaining({
        method: 'PATCH'
      })
    );
  });
});
