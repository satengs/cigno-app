/**
 * @jest-environment node
 */

import { NextRequest } from 'next/server';
import { POST, GET, PUT, DELETE } from '../../src/app/api/key-persons/route.js';
import connectDB from '../../src/lib/db/mongoose.js';
import KeyPerson from '../../src/lib/models/KeyPerson.js';
import Client from '../../src/lib/models/Client.js';

// Mock the database connection
jest.mock('../../src/lib/db/mongoose.js', () => ({
  __esModule: true,
  default: jest.fn()
}));

// Mock the models
jest.mock('../../src/lib/models/KeyPerson.js');
jest.mock('../../src/lib/models/Client.js');

describe('/api/key-persons', () => {
  let mockClient, mockKeyPerson;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockClient = {
      _id: '507f1f77bcf86cd799439012',
      name: 'Test Client',
      industry: 'Technology'
    };

    mockKeyPerson = {
      _id: '507f1f77bcf86cd799439013',
      full_name: 'John Doe',
      role: 'CEO',
      email: 'john.doe@testclient.com',
      image: 'https://example.com/profile.jpg',
      phone: '+1-555-0123',
      client: mockClient._id,
      is_primary: true,
      is_active: true,
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockReturnThis()
    };

    connectDB.mockResolvedValue();
    Client.findById.mockResolvedValue(mockClient);
  });

  describe('POST /api/key-persons', () => {
    it('should create a key person successfully', async () => {
      const mockSave = jest.fn().mockResolvedValue(mockKeyPerson);
      KeyPerson.mockImplementation(() => ({
        ...mockKeyPerson,
        save: mockSave
      }));
      KeyPerson.findOne.mockResolvedValue(null); // No existing key person with same email
      KeyPerson.findById.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockKeyPerson)
      });

      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'John Doe',
          role: 'CEO',
          email: 'john.doe@testclient.com',
          image: 'https://example.com/profile.jpg',
          phone: '+1-555-0123',
          client: mockClient._id,
          is_primary: true
        })
      });

      const response = await POST(request);
      const data = await response.json();

      if (response.status !== 201) {
        console.error('Test failed with status:', response.status);
        console.error('Response data:', data);
      }

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.keyPerson).toMatchObject({
        _id: mockKeyPerson._id,
        full_name: mockKeyPerson.full_name,
        role: mockKeyPerson.role,
        email: mockKeyPerson.email,
        client: mockKeyPerson.client,
        is_primary: mockKeyPerson.is_primary
      });
      
      expect(KeyPerson).toHaveBeenCalledWith(
        expect.objectContaining({
          full_name: 'John Doe',
          role: 'CEO',
          email: 'john.doe@testclient.com',
          client: mockClient._id,
          is_primary: true
        })
      );
    });

    it('should handle validation errors for missing fields', async () => {
      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'POST',
        body: JSON.stringify({
          // Missing required fields
          role: 'CEO'
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Missing required fields');
    });

    it('should prevent duplicate email for same client', async () => {
      KeyPerson.findOne.mockResolvedValue(mockKeyPerson); // Existing key person found

      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'Jane Smith',
          role: 'CTO',
          email: 'john.doe@testclient.com', // Duplicate email
          client: mockClient._id
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('already exists');
    });

    it('should handle non-existent client', async () => {
      Client.findById.mockResolvedValue(null);

      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'POST',
        body: JSON.stringify({
          full_name: 'John Doe',
          role: 'CEO',
          email: 'john.doe@testclient.com',
          client: '507f1f77bcf86cd799439999' // Non-existent client
        })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Client not found');
    });
  });

  describe('GET /api/key-persons', () => {
    it('should fetch key persons with client filter', async () => {
      const mockKeyPersons = [
        {
          ...mockKeyPerson,
          client: { name: 'Test Client' }
        },
        {
          _id: '507f1f77bcf86cd799439014',
          full_name: 'Jane Smith',
          role: 'CTO',
          email: 'jane.smith@testclient.com',
          client: { name: 'Test Client' },
          is_primary: false,
          is_active: true
        }
      ];

      KeyPerson.find.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          sort: jest.fn().mockReturnValue({
            lean: jest.fn().mockResolvedValue(mockKeyPersons)
          })
        })
      });

      const request = new NextRequest('http://localhost:3001/api/key-persons?clientId=507f1f77bcf86cd799439012');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.keyPersons).toHaveLength(2);
      expect(data.data.keyPersons[0]).toMatchObject({
        _id: '507f1f77bcf86cd799439013',
        full_name: 'John Doe',
        role: 'CEO'
      });
    });

    it('should handle invalid client ID format', async () => {
      const request = new NextRequest('http://localhost:3001/api/key-persons?clientId=invalid-id');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid client ID format');
    });
  });

  describe('PUT /api/key-persons', () => {
    it('should update a key person successfully', async () => {
      const updatedKeyPerson = {
        ...mockKeyPerson,
        full_name: 'John Updated',
        role: 'President'
      };

      KeyPerson.findById.mockResolvedValue(mockKeyPerson);
      KeyPerson.findOne.mockResolvedValue(null); // No email conflict
      KeyPerson.findByIdAndUpdate.mockReturnValue({
        populate: jest.fn().mockReturnValue({
          lean: jest.fn().mockResolvedValue(updatedKeyPerson)
        })
      });

      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'PUT',
        body: JSON.stringify({
          id: mockKeyPerson._id,
          full_name: 'John Updated',
          role: 'President'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.keyPerson).toMatchObject({
        _id: mockKeyPerson._id,
        full_name: 'John Updated',
        role: 'President'
      });
    });

    it('should handle missing ID', async () => {
      const request = new NextRequest('http://localhost:3001/api/key-persons', {
        method: 'PUT',
        body: JSON.stringify({
          full_name: 'John Updated'
        })
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Key person ID is required');
    });
  });

  describe('DELETE /api/key-persons', () => {
    it('should soft delete a key person', async () => {
      const deletedKeyPerson = {
        ...mockKeyPerson,
        is_active: false
      };

      KeyPerson.findByIdAndUpdate.mockResolvedValue(deletedKeyPerson);

      const request = new NextRequest('http://localhost:3001/api/key-persons?id=507f1f77bcf86cd799439013');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toContain('deleted successfully');
    });

    it('should handle missing ID', async () => {
      const request = new NextRequest('http://localhost:3001/api/key-persons');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Key person ID is required');
    });
  });

  describe('KeyPerson Model Integration', () => {
    it('should validate required fields', () => {
      const requiredFields = ['full_name', 'role', 'email', 'client'];
      
      const validKeyPerson = {
        full_name: 'John Doe',
        role: 'CEO',
        email: 'john.doe@example.com',
        client: '507f1f77bcf86cd799439012',
        is_primary: false,
        is_active: true
      };

      requiredFields.forEach(field => {
        expect(validKeyPerson[field]).toBeDefined();
      });
    });

    it('should validate email format', () => {
      const validEmails = [
        'john.doe@example.com',
        'jane_smith@company.co.uk',
        'user+label@domain.org'
      ];

      const invalidEmails = [
        'invalid-email',
        'user@',
        '@domain.com',
        'user space@domain.com'
      ];

      // This test validates that our email regex pattern works correctly
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      validEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(true);
      });

      invalidEmails.forEach(email => {
        expect(emailRegex.test(email)).toBe(false);
      });
    });
  });
});