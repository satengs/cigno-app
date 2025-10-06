/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { GET, PATCH, DELETE } from '../../../src/app/api/deliverables/[id]/route.js';
import connectDB from '../../../src/lib/db/mongoose.js';
import Deliverable from '../../../src/lib/models/Deliverable.js';
import mongoose from 'mongoose';

// Mock the database connection
jest.mock('../../../src/lib/db/mongoose.js', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the models
jest.mock('../../../src/lib/models/Deliverable.js');
jest.mock('mongoose');

describe('/api/deliverables/[id]', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectDB.mockResolvedValue();
    mongoose.Types.ObjectId.isValid.mockReturnValue(true);
  });

  describe('GET /api/deliverables/[id]', () => {
    it('should fetch a deliverable by ID', async () => {
      const mockDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Test Deliverable',
        type: 'Report',
        status: 'draft',
        project_id: {
          name: 'Test Project',
          client_id: 'Test Client'
        },
        assigned_team: [
          { first_name: 'John', last_name: 'Doe' }
        ]
      };

      Deliverable.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(mockDeliverable)
        })
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013');
      const response = await GET(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockDeliverable);
      expect(Deliverable.findById).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
    });

    it('should return 400 for invalid ObjectId', async () => {
      mongoose.Types.ObjectId.isValid.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3001/api/deliverables/invalid-id');
      const response = await GET(request, { params: { id: 'invalid-id' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid deliverable ID');
    });

    it('should return 404 for non-existent deliverable', async () => {
      Deliverable.findById.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockResolvedValue(null)
        })
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013');
      const response = await GET(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Deliverable not found');
    });
  });

  describe('PATCH /api/deliverables/[id]', () => {
    it('should update a deliverable', async () => {
      const updatedDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Updated Deliverable',
        type: 'Report',
        status: 'completed',
        updated_at: new Date()
      };

      Deliverable.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockResolvedValue(updatedDeliverable)
      });

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013', {
        method: 'PATCH',
        body: JSON.stringify({
          name: 'Updated Deliverable',
          status: 'completed'
        })
      });

      const response = await PATCH(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(updatedDeliverable);
      expect(Deliverable.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439013',
        expect.objectContaining({
          name: 'Updated Deliverable',
          status: 'completed',
          updated_at: expect.any(Date)
        }),
        { new: true, runValidators: true }
      );
    });

    it('should handle validation errors', async () => {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.errors = {
        status: { message: 'Invalid status value' }
      };

      Deliverable.findByIdAndUpdate.mockRejectedValue(validationError);

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013', {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'invalid-status'
        })
      });

      const response = await PATCH(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toEqual(validationError.errors);
    });
  });

  describe('DELETE /api/deliverables/[id]', () => {
    it('should delete a deliverable', async () => {
      const deletedDeliverable = {
        _id: '507f1f77bcf86cd799439013',
        name: 'Deleted Deliverable'
      };

      Deliverable.findByIdAndDelete.mockResolvedValue(deletedDeliverable);

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013');
      const response = await DELETE(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Deliverable deleted successfully');
      expect(Deliverable.findByIdAndDelete).toHaveBeenCalledWith('507f1f77bcf86cd799439013');
    });

    it('should return 404 for non-existent deliverable', async () => {
      Deliverable.findByIdAndDelete.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3001/api/deliverables/507f1f77bcf86cd799439013');
      const response = await DELETE(request, { params: { id: '507f1f77bcf86cd799439013' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Deliverable not found');
    });
  });
});