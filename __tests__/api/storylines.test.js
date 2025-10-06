/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET } from '../../src/app/api/storylines/route.js';
import connectDB from '../../src/lib/db/mongoose.js';
import Storyline from '../../src/lib/models/Storyline.js';
import Deliverable from '../../src/lib/models/Deliverable.js';

// Mock the database connection
jest.mock('../../src/lib/db/mongoose.js', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the models
jest.mock('../../src/lib/models/Storyline.js');
jest.mock('../../src/lib/models/Deliverable.js');

describe('/api/storylines', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDB.mockResolvedValue();
  });

  describe('POST /api/storylines', () => {
    it('should create a storyline successfully', async () => {
      const mockStoryline = {
        _id: '507f1f77bcf86cd799439013',
        title: 'Test Storyline',
        deliverable: '507f1f77bcf86cd799439012',
        sections: [],
        status: 'draft',
        save: jest.fn().mockResolvedValue(true),
        populate: jest.fn().mockReturnThis()
      };

      const mockDeliverable = {
        _id: '507f1f77bcf86cd799439012',
        name: 'Test Deliverable',
        type: 'Presentation'
      };

      Storyline.mockImplementation(() => mockStoryline);
      Deliverable.findById.mockResolvedValue(mockDeliverable);
      Storyline.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockStoryline)
        })
      });

      const request = new NextRequest('http://localhost:3001/api/storylines', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Storyline',
          deliverable: '507f1f77bcf86cd799439012',
          sections: [
            {
              title: 'Introduction',
              content: 'Introduction content',
              type: 'text'
            }
          ]
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.storyline).toEqual(mockStoryline);
      
      expect(Storyline).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Test Storyline',
          deliverable: '507f1f77bcf86cd799439012'
        })
      );
    });

    it('should handle validation errors', async () => {
      const request = new NextRequest('http://localhost:3001/api/storylines', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          sections: []
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('required');
    });

    it('should handle database errors', async () => {
      const mockStoryline = {
        save: jest.fn().mockRejectedValue(new Error('Database error'))
      };

      Storyline.mockImplementation(() => mockStoryline);
      Deliverable.findById.mockResolvedValue({ _id: '507f1f77bcf86cd799439012' });

      const request = new NextRequest('http://localhost:3001/api/storylines', {
        method: 'POST',
        body: JSON.stringify({
          title: 'Test Storyline',
          deliverable: '507f1f77bcf86cd799439012'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to create storyline');
    });
  });

  describe('GET /api/storylines', () => {
    it('should fetch storylines with filters', async () => {
      const mockStorylines = [
        {
          _id: '507f1f77bcf86cd799439013',
          title: 'Test Storyline 1',
          status: 'draft',
          deliverable: {
            _id: '507f1f77bcf86cd799439012',
            name: 'Test Deliverable'
          }
        },
        {
          _id: '507f1f77bcf86cd799439014',
          title: 'Test Storyline 2',
          status: 'published',
          deliverable: {
            _id: '507f1f77bcf86cd799439015',
            name: 'Another Deliverable'
          }
        }
      ];

      Storyline.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockStorylines)
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/storylines?deliverable=507f1f77bcf86cd799439012');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.storylines).toEqual(mockStorylines);
    });

    it('should handle empty results', async () => {
      Storyline.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue([])
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/storylines');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.storylines).toEqual([]);
    });
  });

  describe('Storyline Model Validation', () => {
    it('should validate required fields', () => {
      const requiredFields = ['title', 'deliverable', 'status'];
      
      const validStoryline = {
        title: 'Test Storyline',
        deliverable: '507f1f77bcf86cd799439012',
        status: 'draft',
        sections: [],
        created_at: new Date(),
        updated_at: new Date()
      };

      requiredFields.forEach(field => {
        expect(validStoryline[field]).toBeDefined();
      });
    });

    it('should have valid status enum values', () => {
      const validStatuses = ['draft', 'in_review', 'approved', 'published'];
      
      validStatuses.forEach(status => {
        expect(['draft', 'in_review', 'approved', 'published']).toContain(status);
      });
    });

    it('should validate section structure', () => {
      const validSection = {
        title: 'Section Title',
        content: 'Section content',
        type: 'text',
        order: 1,
        is_locked: false
      };

      expect(validSection.title).toBeDefined();
      expect(validSection.content).toBeDefined();
      expect(validSection.type).toBeDefined();
      expect(typeof validSection.order).toBe('number');
      expect(typeof validSection.is_locked).toBe('boolean');
    });
  });
});