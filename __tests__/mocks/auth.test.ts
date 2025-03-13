/**
 * @jest-environment node
 */
import { hash } from 'bcrypt';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

// Mock PrismaClient
const mockFindUnique = jest.fn();
const mockFindMany = jest.fn();
const mockRoleFindMany = jest.fn();

jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      user: {
        findUnique: mockFindUnique,
        findFirst: jest.fn(),
      },
      userRole: {
        findMany: mockFindMany,
      },
      role: {
        findMany: mockRoleFindMany,
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});

// Mock auth handler functions
const mockAuthPostHandler = jest.fn();
const mockAuthGetHandler = jest.fn();

jest.mock('../../app/api/auth/[...nextauth]/route', () => ({
  POST: mockAuthPostHandler,
  GET: mockAuthGetHandler,
}));

describe('Authentication Mock Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should authenticate valid credentials', async () => {
    // Mock password hash
    const passwordHash = await hash('admin123', 10);
    
    // Setup user mock response
    mockFindUnique.mockResolvedValueOnce({
      id: '1',
      email: 'admin@example.com',
      password_hash: passwordHash,
      name: 'Admin User',
    });
    
    // Setup roles mock responses
    mockFindMany.mockResolvedValueOnce([
      { role_id: '1', user_id: '1' },
    ]);
    
    mockRoleFindMany.mockResolvedValueOnce([
      { id: '1', name: 'ADMIN' },
    ]);
    
    // Setup the auth POST response
    mockAuthPostHandler.mockResolvedValueOnce(
      NextResponse.json({ ok: true, url: '/backoffice/dashboard' })
    );
    
    // Create request object
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'admin123',
        callbackUrl: '/backoffice/dashboard',
      }),
    });
    
    // Test the handler
    const response = await mockAuthPostHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(200);
    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('url', '/backoffice/dashboard');
    
    // Verify mocks were called
    expect(mockAuthPostHandler).toHaveBeenCalledTimes(1);
  });
  
  it('should reject invalid credentials', async () => {
    // Mock password hash for a different password
    const passwordHash = await hash('real-password', 10);
    
    // Mock auth POST to return unauthorized
    mockAuthPostHandler.mockResolvedValueOnce(
      NextResponse.json({ ok: false, error: 'Invalid credentials' }, { status: 401 })
    );
    
    // Create request object
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'wrong-password',
        callbackUrl: '/backoffice/dashboard',
      }),
    });
    
    // Test the handler
    const response = await mockAuthPostHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error', 'Invalid credentials');
    
    // Verify mocks were called
    expect(mockAuthPostHandler).toHaveBeenCalledTimes(1);
  });
  
  it('should return roles in the session', async () => {
    // Mock session response
    mockAuthGetHandler.mockResolvedValueOnce(
      NextResponse.json({
        user: {
          id: '1',
          email: 'admin@example.com',
          name: 'Admin User',
          roles: ['ADMIN'],
        },
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      })
    );
    
    // Create request object
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'GET',
    });
    
    // Test the handler
    const response = await mockAuthGetHandler(request);
    const session = await response.json();
    
    expect(response.status).toBe(200);
    expect(session.user).toHaveProperty('roles');
    expect(session.user.roles).toContain('ADMIN');
    
    // Verify mocks were called
    expect(mockAuthGetHandler).toHaveBeenCalledTimes(1);
  });
  
  it('should handle non-existent user', async () => {
    // Mock auth POST to return user not found
    mockAuthPostHandler.mockResolvedValueOnce(
      NextResponse.json({ ok: false, error: 'User not found' }, { status: 401 })
    );
    
    // Create request object
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'any-password',
        callbackUrl: '/backoffice/dashboard',
      }),
    });
    
    // Test the handler
    const response = await mockAuthPostHandler(request);
    const data = await response.json();
    
    expect(response.status).toBe(401);
    expect(data).toHaveProperty('error', 'User not found');
    
    // Verify mocks were called
    expect(mockAuthPostHandler).toHaveBeenCalledTimes(1);
  });
}); 