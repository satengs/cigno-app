/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '../../src/app/api/deliverables/route.js';
import connectDB from '../../src/lib/db/mongoose.js';
import Deliverable from '../../src/lib/models/Deliverable.js';
import User from '../../src/lib/models/User.js';
import Project from '../../src/lib/models/Project.js';

// Mock the database connection
jest.mock('../../src/lib/db/mongoose.js', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the models
jest.mock('../../src/lib/models/Deliverable.js');
jest.mock('../../src/lib/models/User.js');
jest.mock('../../src/lib/models/Project.js');

describe('/api/deliverables', () => {
  let mockUser, mockProject;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUser = {
      _id: '507f1f77bcf86cd799439011',
      name: 'Test User',
      email: 'test@example.com'
    };

    mockProject = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Test Project',
      client: 'Test Client'
    };

    connectDB.mockResolvedValue();
    User.findOne.mockResolvedValue(mockUser);
  });

  describe('POST /api/deliverables', () => {
    it('should create a deliverable with correct enum mapping', async () => {
      const mockDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Test Deliverable',
        type: 'Report',
        status: 'draft',
        priority: 'medium',
        brief: 'Test brief',
        project: mockProject._id,
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      Deliverable.mockImplementation(() => mockDeliverable);
      Deliverable.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(mockDeliverable)
              })
            })
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Deliverable',
          type: 'Technical Report', // Legacy format
          status: 'Planning', // Legacy format
          priority: 'High', // Legacy format
          description: 'Test brief',
          project: mockProject._id,
          due_date: '2025-01-15'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.deliverable).toEqual(mockDeliverable);
      
      // Verify the constructor was called with mapped values
      expect(Deliverable).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Deliverable',
          type: 'Report', // Mapped from 'Technical Report'
          status: 'draft', // Mapped from 'Planning'
          priority: 'high', // Mapped from 'High'
          brief: 'Test brief'
        })
      );
    });

    it('should handle validation errors gracefully', async () => {
      const request = new NextRequest('http://localhost:3001/api/deliverables', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          type: 'Report'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should handle database errors', async () => {
      const mockDeliverable = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Deliverable.mockImplementation(() => mockDeliverable);

      const request = new NextRequest('http://localhost:3001/api/deliverables', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Deliverable',
          type: 'Report',
          project: mockProject._id
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create deliverable');
    });
  });

  describe('GET /api/deliverables', () => {
    it('should fetch deliverables with filters', async () => {
      const mockDeliverables = [
        {
          _id: '507f1f77bcf86cd799439013',
          name: 'Test Deliverable 1',
          type: 'Report',
          status: 'draft'
        },
        {
          _id: '507f1f77bcf86cd799439014',
          name: 'Test Deliverable 2',
          type: 'Presentation',
          status: 'completed'
        }
      ];

      Deliverable.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                sort: jest.fn().mockReturnValue({
                  skip: jest.fn().mockReturnValue({
                    limit: jest.fn().mockReturnValue({
                      lean: jest.fn().mockResolvedValue(mockDeliverables)
                    })
                  })
                })
              })
            })
          })
        })
      });

      Deliverable.countDocuments.mockResolvedValue(2);

      const request = new NextRequest('http://localhost:3001/api/deliverables?projectId=507f1f77bcf86cd799439012&status=draft&page=1&limit=10');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deliverables).toEqual(mockDeliverables);
      expect(data.data.pagination.total).toBe(2);
    });
  });

  describe('PUT /api/deliverables', () => {
    it('should update a deliverable', async () => {
      const updatedDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Updated Deliverable',
        type: 'Report',
        status: 'completed'
      };

      Deliverable.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(updatedDeliverable)
              })
            })
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables', {
        method: 'PUT',
        body: JSON.stringify({
          id: '507f1f77bcf86cd799439013',
          name: 'Updated Deliverable',
          status: 'completed'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.deliverable).toEqual(updatedDeliverable);
    });

    it('should return 404 for non-existent deliverable', async () => {
      Deliverable.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                lean: jest.fn().mockResolvedValue(null)
              })
            })
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables', {
        method: 'PUT',
        body: JSON.stringify({
          id: '507f1f77bcf86cd799439999',
          name: 'Updated Deliverable'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Deliverable not found');
    });
  });

  describe('DELETE /api/deliverables', () => {
    it('should delete a deliverable and associated menu items', async () => {
      const deletedDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Deleted Deliverable'
      };

      // Mock MenuItemModel
      const MockMenuItemModel = {
        deleteMany: jest.fn().mockResolvedValue({ deletedCount: 2 })
      };
      
      // We need to mock the MenuItemModel import
      jest.doMock('../../src/lib/models/MenuItemModel.js', () => MockMenuItemModel);

      Deliverable.findByIdAndDelete.mockResolvedValue(deletedDeliverable);

      const request = new NextRequest('http://localhost:3001/api/deliverables?id=507f1f77bcf86cd799439013');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('should validate ObjectId format', async () => {
      const request = new NextRequest('http://localhost:3001/api/deliverables?id=invalid-id');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid ID format');
    });
  });

  describe('Type and Status Mapping', () => {
    it('should correctly map all type values', async () => {
      const typeTests = [
        { input: 'Technical Report', expected: 'Report' },
        { input: 'Strategy Presentation', expected: 'Presentation' },
        { input: 'Market Analysis', expected: 'Analysis' },
        { input: 'Implementation Roadmap', expected: 'Strategy' },
        { input: 'presentation', expected: 'Presentation' },
        { input: 'report', expected: 'Report' }
      ];

      for (const test of typeTests) {
        const mockDeliverable = {
          save: jest.fn().mockResolvedValue(true)
        };
        Deliverable.mockImplementation(() => mockDeliverable);
        Deliverable.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockDeliverable)
                })
              })
            })
          })
        });

        const request = new NextRequest('http://localhost:3001/api/deliverables', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Deliverable',
            type: test.input,
            project: mockProject._id
          })
        });

        await POST(request);

        expect(Deliverable).toHaveBeenCalledWith(
          expect.objectContaining({
            type: test.expected
          })
        );
      }
    });

    it('should correctly map all status values', async () => {
      const statusTests = [
        { input: 'Planning', expected: 'draft' },
        { input: 'In Progress', expected: 'in_progress' },
        { input: 'In Review', expected: 'in_review' },
        { input: 'Completed', expected: 'completed' },
        { input: 'draft', expected: 'draft' },
        { input: 'completed', expected: 'completed' }
      ];

      for (const test of statusTests) {
        const mockDeliverable = {
          save: jest.fn().mockResolvedValue(true)
        };
        Deliverable.mockImplementation(() => mockDeliverable);
        Deliverable.findById.mockReturnValue({
          populate: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  lean: jest.fn().mockResolvedValue(mockDeliverable)
                })
              })
            })
          })
        });

        const request = new NextRequest('http://localhost:3001/api/deliverables', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Deliverable',
            type: 'Report',
            status: test.input,
            project: mockProject._id
          })
        });

        await POST(request);

        expect(Deliverable).toHaveBeenCalledWith(
          expect.objectContaining({
            status: test.expected
          })
        );
      }
    });
  });
});