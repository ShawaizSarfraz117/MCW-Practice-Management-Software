import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from './route';
import { v4 as uuid } from 'uuid';

// Mock the PrismaClient
jest.mock('@prisma/client', () => {
  const mockCreate = jest.fn();
  const mockFindUnique = jest.fn();
  const mockFindMany = jest.fn();
  const mockUpdate = jest.fn();
  
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      clinician: {
        findUnique: mockFindUnique,
        findMany: mockFindMany,
        create: mockCreate,
        update: mockUpdate
      },
      $connect: jest.fn(),
      $disconnect: jest.fn()
    }))
  };
});

// Get the mocked functions
const mockPrisma = new (require('@prisma/client').PrismaClient)();
const mockClinicianCreate = mockPrisma.clinician.create;
const mockClinicianFindUnique = mockPrisma.clinician.findUnique;
const mockClinicianFindMany = mockPrisma.clinician.findMany;
const mockClinicianUpdate = mockPrisma.clinician.update;

// Override the auth module to bypass authentication
jest.mock('@/lib/auth', () => ({
  auth: jest.fn().mockResolvedValue({ user: { id: 'test-user-id' } })
}));

// Helper to create GET request with optional ID
const createGetRequest = (id?: string): NextRequest => {
  const url = new URL('http://localhost:3000/api/backoffice/clinician');
  if (id) {
    url.searchParams.append('id', id);
  }
  
  return {
    method: 'GET',
    nextUrl: url
  } as unknown as NextRequest;
};

// Helper to create POST/PUT request with body
const createRequestWithBody = (method: string, body: any): NextRequest => {
  return {
    method,
    json: jest.fn().mockResolvedValue(body),
    nextUrl: new URL('http://localhost:3000/api/backoffice/clinician')
  } as unknown as NextRequest;
};

// Helper to create DELETE request with ID
const createDeleteRequest = (id: string): NextRequest => {
  const url = new URL('http://localhost:3000/api/backoffice/clinician');
  url.searchParams.append('id', id);
  
  return {
    method: 'DELETE',
    nextUrl: url
  } as unknown as NextRequest;
};

// Helper to extract response data
const getResponseData = async (response: NextResponse) => {
  // @ts-ignore - We know the structure of our mocked response
  return await response.json();
};

describe('Clinician API Tests', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    mockClinicianCreate.mockReset();
    mockClinicianFindUnique.mockReset();
    mockClinicianFindMany.mockReset();
    mockClinicianUpdate.mockReset();
  });
  
  describe('GET', () => {
    test('GET: should return all clinicians when no ID is provided', async () => {
      // Mock data
      const mockClinicians = [
        { id: uuid(), first_name: 'John', last_name: 'Doe', User: { email: 'john@example.com' } },
        { id: uuid(), first_name: 'Jane', last_name: 'Smith', User: { email: 'jane@example.com' } }
      ];
      
      // Setup mock
      mockClinicianFindMany.mockResolvedValue(mockClinicians);
      
      // Create request and call the API
      const request = createGetRequest();
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(mockClinicianFindMany).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockClinicians);
      console.log('GET ALL test passed');
    });
    
    test('GET: should return a specific clinician when ID is provided', async () => {
      // Mock data
      const clinicianId = uuid();
      const mockClinician = {
        id: clinicianId,
        first_name: 'John',
        last_name: 'Doe',
        User: { email: 'john@example.com' },
        ClinicianLocation: [],
        ClinicianServices: []
      };
      
      // Setup mock
      mockClinicianFindUnique.mockResolvedValue(mockClinician);
      
      // Create request and call the API
      const request = createGetRequest(clinicianId);
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(mockClinicianFindUnique).toHaveBeenCalledWith({
        where: { id: clinicianId },
        include: expect.any(Object)
      });
      expect(response.status).toBe(200);
      expect(responseData).toEqual(mockClinician);
      console.log('GET by ID test passed');
    });
    
    test('GET: should return 404 when clinician not found', async () => {
      // Setup mock
      mockClinicianFindUnique.mockResolvedValue(null);
      
      // Create request and call the API
      const request = createGetRequest('non-existent-id');
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Clinician not found' });
      console.log('GET 404 test passed');
    });
  });
  
  describe('POST', () => {
    test('POST: should insert a new clinician into the database', async () => {
      // Generate a unique ID
      const testUserId = uuid();
      const newId = uuid();
      
      // Create test data
      const newClinicianData = {
        user_id: testUserId,
        first_name: 'New',
        last_name: 'Clinician',
        address: '123 Test Street',
        percentage_split: 50,
        is_active: true
      };
      
      // Mock responses
      mockClinicianFindUnique.mockResolvedValue(null);
      const createdClinician = { id: newId, ...newClinicianData };
      mockClinicianCreate.mockResolvedValue(createdClinician);
      
      // Create request and call the API
      const request = createRequestWithBody('POST', newClinicianData);
      const response = await POST(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(201);
      expect(responseData).toEqual(createdClinician);
      expect(mockClinicianCreate).toHaveBeenCalledWith({
        data: expect.objectContaining(newClinicianData)
      });
      console.log('POST test passed');
    });
  });
  
  describe('PUT', () => {
    test('PUT: should update an existing clinician', async () => {
      // Generate data
      const clinicianId = uuid();
      const updateData = {
        id: clinicianId,
        first_name: 'Updated',
        last_name: 'Name',
        address: 'New Address',
        percentage_split: 60,
        is_active: true
      };
      
      // Setup mocks
      mockClinicianFindUnique.mockResolvedValue({ id: clinicianId });
      mockClinicianUpdate.mockResolvedValue(updateData);
      
      // Create request and call the API
      const request = createRequestWithBody('PUT', updateData);
      const response = await PUT(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(200);
      expect(responseData).toEqual(updateData);
      expect(mockClinicianUpdate).toHaveBeenCalledWith({
        where: { id: clinicianId },
        data: expect.objectContaining({
          first_name: 'Updated',
          last_name: 'Name',
          address: 'New Address',
          percentage_split: 60,
          is_active: true
        })
      });
      console.log('PUT test passed');
    });
  });
  
  describe('DELETE', () => {
    test('DELETE: should deactivate an existing clinician', async () => {
      // Generate data
      const clinicianId = uuid();
      const existingClinician = { id: clinicianId, is_active: true };
      const deactivatedClinician = { ...existingClinician, is_active: false };
      
      // Setup mocks
      mockClinicianFindUnique.mockResolvedValue(existingClinician);
      mockClinicianUpdate.mockResolvedValue(deactivatedClinician);
      
      // Create request and call API
      const request = createDeleteRequest(clinicianId);
      const response = await DELETE(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(200);
      expect(responseData).toEqual({
        message: 'Clinician deactivated successfully',
        clinician: deactivatedClinician
      });
      expect(mockClinicianUpdate).toHaveBeenCalledWith({
        where: { id: clinicianId },
        data: { is_active: false }
      });
      console.log('DELETE test passed');
    });
  });
}); 