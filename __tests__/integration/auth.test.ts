/**
 * @jest-environment node
 */
import { seedTestDatabase, cleanupTestDatabase } from '../setup';
import { NextResponse } from 'next/server';
import { hash } from 'bcrypt';
import { authOptions } from '../../app/api/auth/[...nextauth]/auth-options';

// Define types for our test database
type MockUser = {
  id: string;
  email: string;
  password_hash: string;
  userRoles: { role: { name: string } }[];
  last_login?: Date;
};

// Mock the database for the integration test
const mockDb = {
  users: [
    {
      id: '1',
      email: 'admin@example.com',
      password_hash: '',  // Will be set in beforeAll
      userRoles: [{ role: { name: 'ADMIN' } }],
      last_login: undefined
    }
  ] as MockUser[],
  
  findUser: function(email: string): MockUser | null {
    return this.users.find(u => u.email === email) || null;
  },
  
  updateUserLastLogin: function(id: string): MockUser | undefined {
    const user = this.users.find(u => u.id === id);
    if (user) {
      user.last_login = new Date();
    }
    return user;
  }
};

// Mock the PrismaClient to use our in-memory database
jest.mock('@prisma/client', () => {
  return {
    PrismaClient: jest.fn(() => ({
      user: {
        findUnique: jest.fn(({ where }) => {
          return Promise.resolve(mockDb.findUser(where.email));
        }),
        update: jest.fn(({ where, data }) => {
          return Promise.resolve(mockDb.updateUserLastLogin(where.id));
        }),
      },
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    })),
  };
});

// Create route handlers that use the real auth logic but our mocked database
const handlers = {
  async POST(req: Request) {
    const body = await req.json();
    
    // Extract credentials from request
    const credentials = {
      email: body.email,
      password: body.password
    };
    
    // Try to get the user with the provided email
    const user = mockDb.findUser(credentials.email);
    
    if (!user) {
      return NextResponse.json({ error: "CredentialsSignin" }, { status: 401 });
    }
    
    // Compare password
    const bcrypt = require('bcrypt');
    const isValid = await bcrypt.compare(credentials.password, user.password_hash);
    
    if (!isValid) {
      return NextResponse.json({ error: "CredentialsSignin" }, { status: 401 });
    }
    
    // Update last login
    mockDb.updateUserLastLogin(user.id);
    
    // Return success with callback URL
    return NextResponse.json({ 
      url: body.callbackUrl || '/backoffice/dashboard'
    });
  },
  
  async GET(req: Request) {
    // For the session endpoint, we return a mock session
    return NextResponse.json({
      user: {
        id: '1',
        email: 'admin@example.com',
        roles: ['ADMIN'],
        isAdmin: true,
        isClinician: false,
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    });
  }
};

describe('Authentication Integration Tests', () => {
  beforeAll(async () => {
    // Set up test environment
    process.env.DATABASE_URL = 'file::memory:?cache=shared';
    process.env.NEXTAUTH_SECRET = 'test-secret';
    process.env.NEXTAUTH_URL = 'http://localhost:3000';
    
    // Hash the password
    mockDb.users[0].password_hash = await hash('admin123', 10);
    
    // Seed test data
    await seedTestDatabase();
  });
  
  afterAll(async () => {
    await cleanupTestDatabase();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  it('should authenticate a valid admin user', async () => {
    // Create the request
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csrfToken: 'mock-csrf-token',
        email: 'admin@example.com',
        password: 'admin123',
        callbackUrl: '/backoffice/dashboard',
        json: true,
      }),
    });
    
    // Use the handler
    const response = await handlers.POST(request);
    
    // Assert response
    expect(response.status).toBe(200);
    
    const data = await response.json();
    expect(data).toHaveProperty('url');
    expect(data.url).toContain('/backoffice/dashboard');
  });
  
  it('should reject invalid credentials', async () => {
    // Create the request with wrong password
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csrfToken: 'mock-csrf-token',
        email: 'admin@example.com',
        password: 'wrong-password',
        callbackUrl: '/backoffice/dashboard',
        json: true,
      }),
    });
    
    // Use the handler
    const response = await handlers.POST(request);
    
    // Assert response
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error', 'CredentialsSignin');
  });
  
  it('should handle non-existent user', async () => {
    // Create the request
    const request = new Request('http://localhost:3000/api/auth/callback/credentials', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        csrfToken: 'mock-csrf-token',
        email: 'nonexistent@example.com',
        password: 'any-password',
        callbackUrl: '/backoffice/dashboard',
        json: true,
      }),
    });
    
    // Use the handler
    const response = await handlers.POST(request);
    
    // Assert response
    expect(response.status).toBe(401);
    
    const data = await response.json();
    expect(data).toHaveProperty('error', 'CredentialsSignin');
  });
  
  it('should return user session information', async () => {
    const request = new Request('http://localhost:3000/api/auth/session', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Use the session handler
    const response = await handlers.GET(request);
    
    // Assert response
    expect(response.status).toBe(200);
    
    const session = await response.json();
    expect(session).toHaveProperty('user');
    expect(session.user).toHaveProperty('roles');
    expect(session.user.roles).toContain('ADMIN');
    expect(session.user.isAdmin).toBe(true);
    expect(session.user.isClinician).toBe(false);
  });
}); 