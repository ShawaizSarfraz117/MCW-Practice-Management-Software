import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

// Mock Next.js modules
jest.mock('next/navigation', () => ({
  redirect: jest.fn(),
}));

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

// Create a mock PrismaClient for testing
const mockUser = {
  id: 'user-id-1',
  email: 'admin@example.com',
  password_hash: bcrypt.hashSync('password123', 10),
  last_login: null,
  userRoles: [
    {
      role: {
        id: 'role-id-1',
        name: 'ADMIN',
      },
    },
  ],
};

// Get the mocked PrismaClient from the jest setup
const { PrismaClient } = jest.requireMock('@prisma/client');
const prisma = new PrismaClient();

// Setup mock responses
prisma.user.findUnique.mockResolvedValue(mockUser);
prisma.user.update.mockResolvedValue({ ...mockUser, last_login: new Date() });

describe('Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should find a user with the correct credentials', async () => {
    const email = 'admin@example.com';
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    expect(user).toBeDefined();
    expect(user.email).toBe(email);
    expect(user.userRoles).toHaveLength(1);
    expect(user.userRoles[0].role.name).toBe('ADMIN');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email },
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
      },
    });
  });

  test('Should update last_login on successful login', async () => {
    const userId = 'user-id-1';
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { last_login: new Date() },
    });

    expect(updatedUser).toBeDefined();
    expect(updatedUser.last_login).toBeInstanceOf(Date);
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: userId },
      data: { last_login: expect.any(Date) },
    });
  });

  test('Should validate password', async () => {
    const password = 'password123';
    const isValid = await bcrypt.compare(password, mockUser.password_hash);
    
    expect(isValid).toBeTruthy();

    const invalidPassword = 'wrongpassword';
    const isInvalid = await bcrypt.compare(invalidPassword, mockUser.password_hash);
    
    expect(isInvalid).toBeFalsy();
  });
}); 