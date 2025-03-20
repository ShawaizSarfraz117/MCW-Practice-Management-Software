import { NextRequest, NextResponse } from 'next/server';
import { GET, POST, PUT, DELETE } from '../../../../app/api/backoffice/clinician/route';
import { v4 as uuid } from 'uuid';
import { PrismaClient } from '@prisma/client';

// Create a unique Prisma client instance for testing
const prisma = new PrismaClient();

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
  // Store test data
  let testUserId: string;
  let testClinicianId: string;
  
  // Set up test data before all tests
  beforeAll(async () => {
    // Create a test user
    const testUser = await prisma.user.create({
      data: {
        email: `test.user.${uuid()}@example.com`,
        password_hash: 'testing-password-hash'
      }
    });
    
    testUserId = testUser.id;
    console.log(`Created test user with ID: ${testUserId}`);
  });
  
  // Clean up test data after all tests
  afterAll(async () => {
    // Clean up the test user and associated records
    try {
      // First delete any clinician records associated with the user
      await prisma.clinician.deleteMany({
        where: { user_id: testUserId }
      });
      
      // Then delete the user
      await prisma.user.delete({
        where: { id: testUserId }
      });
      
      console.log(`Cleaned up test user with ID: ${testUserId}`);
    } catch (err) {
      console.error('Error cleaning up test data:', err);
    }
    
    // Disconnect Prisma
    await prisma.$disconnect();
  });
  
  describe('POST - Create', () => {
    test('POST: should insert a new clinician into the database', async () => {
      // Create test data
      const newClinicianData = {
        user_id: testUserId,
        first_name: 'New',
        last_name: 'Clinician',
        address: '123 Test Street',
        percentage_split: 50,
        is_active: true
      };
      
      // Create request and call the API
      const request = createRequestWithBody('POST', newClinicianData);
      const response = await POST(request);
      const responseData = await getResponseData(response);
      
      // Save the ID for later tests
      testClinicianId = responseData.id;
      
      // Verify response
      expect(response.status).toBe(201);
      expect(responseData).toHaveProperty('id');
      expect(responseData.first_name).toEqual(newClinicianData.first_name);
      expect(responseData.last_name).toEqual(newClinicianData.last_name);
      
      // Verify database record
      const dbClinician = await prisma.clinician.findUnique({
        where: { id: testClinicianId }
      });
      
      expect(dbClinician).not.toBeNull();
      expect(dbClinician?.first_name).toEqual(newClinicianData.first_name);
      expect(dbClinician?.last_name).toEqual(newClinicianData.last_name);
      
      console.log('POST test passed');
    });
    
    test('POST: should return 400 when trying to create a clinician with existing user_id', async () => {
      // Try to create another clinician with the same user_id
      const duplicateClinicianData = {
        user_id: testUserId,
        first_name: 'Duplicate',
        last_name: 'User',
        address: '456 Test Road',
        percentage_split: 60,
        is_active: true
      };
      
      // Create request and call the API
      const request = createRequestWithBody('POST', duplicateClinicianData);
      const response = await POST(request);
      const responseData = await getResponseData(response);
      
      // Verify response
      expect(response.status).toBe(400);
      expect(responseData).toHaveProperty('error');
      expect(responseData.error).toContain('already exists');
      
      console.log('POST duplicate test passed');
    });
  });
  
  describe('GET - Retrieve', () => {
    test('GET: should return all clinicians', async () => {
      // Create request and call the API
      const request = createGetRequest();
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(200);
      expect(Array.isArray(responseData)).toBeTruthy();
      expect(responseData.length).toBeGreaterThan(0);
      
      // Our test clinician should be in the results
      const foundClinician = responseData.find((c: any) => c.id === testClinicianId);
      expect(foundClinician).toBeDefined();
      
      console.log('GET ALL test passed');
    });
    
    test('GET: should return a specific clinician when ID is provided', async () => {
      // Create request and call the API
      const request = createGetRequest(testClinicianId);
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(200);
      expect(responseData.id).toEqual(testClinicianId);
      expect(responseData).toHaveProperty('User');
      expect(responseData).toHaveProperty('ClinicianLocation');
      expect(responseData).toHaveProperty('ClinicianServices');
      
      console.log('GET by ID test passed');
    });
    
    test('GET: should return 404 when clinician not found', async () => {
      // Generate a non-existent ID
      const nonExistentId = uuid();
      
      // Create request and call the API
      const request = createGetRequest(nonExistentId);
      const response = await GET(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Clinician not found' });
      
      console.log('GET 404 test passed');
    });
  });
  
  describe('PUT - Update', () => {
    test('PUT: should update an existing clinician', async () => {
      // Update data
      const updateData = {
        id: testClinicianId,
        first_name: 'Updated',
        last_name: 'Name',
        address: 'New Address',
        percentage_split: 60,
        is_active: true
      };
      
      // Create request and call the API
      const request = createRequestWithBody('PUT', updateData);
      const response = await PUT(request);
      const responseData = await getResponseData(response);
      
      // Verify response
      expect(response.status).toBe(200);
      expect(responseData.first_name).toEqual(updateData.first_name);
      expect(responseData.last_name).toEqual(updateData.last_name);
      
      // Verify database was updated
      const dbClinician = await prisma.clinician.findUnique({
        where: { id: testClinicianId }
      });
      
      expect(dbClinician?.first_name).toEqual(updateData.first_name);
      expect(dbClinician?.last_name).toEqual(updateData.last_name);
      
      console.log('PUT test passed');
    });
    
    test('PUT: should return 404 when clinician not found', async () => {
      // Generate a non-existent ID
      const nonExistentId = uuid();
      
      // Update data with non-existent ID
      const updateData = {
        id: nonExistentId,
        first_name: 'Not',
        last_name: 'Found',
        address: 'Address',
        percentage_split: 50,
        is_active: true
      };
      
      // Create request and call the API
      const request = createRequestWithBody('PUT', updateData);
      const response = await PUT(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Clinician not found' });
      
      console.log('PUT 404 test passed');
    });
  });
  
  describe('DELETE - Deactivate', () => {
    test('DELETE: should deactivate an existing clinician', async () => {
      // Create request and call API
      const request = createDeleteRequest(testClinicianId);
      const response = await DELETE(request);
      const responseData = await getResponseData(response);
      
      // Verify response
      expect(response.status).toBe(200);
      expect(responseData).toHaveProperty('message');
      expect(responseData.message).toContain('deactivated successfully');
      expect(responseData.clinician.is_active).toBe(false);
      
      // Verify database was updated
      const dbClinician = await prisma.clinician.findUnique({
        where: { id: testClinicianId }
      });
      
      expect(dbClinician?.is_active).toBe(false);
      
      console.log('DELETE test passed');
    });
    
    test('DELETE: should return 404 when clinician not found', async () => {
      // Generate a non-existent ID
      const nonExistentId = uuid();
      
      // Create request and call API
      const request = createDeleteRequest(nonExistentId);
      const response = await DELETE(request);
      const responseData = await getResponseData(response);
      
      // Verify
      expect(response.status).toBe(404);
      expect(responseData).toEqual({ error: 'Clinician not found' });
      
      console.log('DELETE 404 test passed');
    });
  });
}); 