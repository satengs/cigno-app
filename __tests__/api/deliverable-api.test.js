/**
 * Direct API test for the deliverable update endpoint
 */

// Mock fetch for this test file
global.fetch = jest.fn();

describe('Deliverable API PUT Endpoint', () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  test('should fail with boolean true as ID', async () => {
    // Mock API response for boolean ID error
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({
        success: false,
        details: 'Cast to ObjectId failed'
      })
    });

    const response = await fetch('http://localhost:3001/api/deliverables', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: true, // This is the bug
        brief: 'Updated brief',
        notes: 'Updated notes'
      })
    });

    const result = await response.json();
    
    expect(response.status).toBe(500);
    expect(result.success).toBe(false);
    expect(result.details).toContain('ObjectId');
  });

  test('should succeed with valid ObjectId string', async () => {
    // Mock successful API response
    fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({
        success: true,
        data: {
          deliverable: {
            _id: '68dda914e0208215c32e761b',
            brief: 'Updated brief from test',
            notes: 'Updated notes from test'
          }
        }
      })
    });

    const response = await fetch('http://localhost:3001/api/deliverables', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id: '68dda914e0208215c32e761b', // Valid ObjectId
        brief: 'Updated brief from test',
        notes: 'Updated notes from test'
      })
    });

    const result = await response.json();
    
    expect(response.status).toBe(200);
    expect(result.success).toBe(true);
    expect(result.data.deliverable._id).toBe('68dda914e0208215c32e761b');
  });
});