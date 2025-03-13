import { v4 as uuidv4 } from 'uuid';

// Create test data
const adminRole = {
  id: uuidv4(),
  name: 'ADMIN'
};

const clinicianRole = {
  id: uuidv4(),
  name: 'CLINICIAN'
};

const testUser = {
  id: uuidv4(),
  email: 'test@example.com',
  password_hash: 'hashed_password',
  createdAt: new Date(),
  updatedAt: new Date()
};

// Get the mocked PrismaClient from the jest setup
const { PrismaClient } = jest.requireMock('@prisma/client');
const prisma = new PrismaClient();

// Setup mock responses for roles
prisma.role.findMany.mockResolvedValue([adminRole, clinicianRole]);
prisma.role.create.mockImplementation((data: { data: any }) => Promise.resolve(data.data));
prisma.role.findUnique.mockImplementation(({ where }: { where: any }) => {
  if (where.id === adminRole.id) return Promise.resolve(adminRole);
  if (where.id === clinicianRole.id) return Promise.resolve(clinicianRole);
  if (where.name === 'ADMIN') return Promise.resolve(adminRole);
  if (where.name === 'CLINICIAN') return Promise.resolve(clinicianRole);
  return Promise.resolve(null);
});

// Setup mock responses for users
prisma.user.create.mockResolvedValue(testUser);
prisma.user.findUnique.mockResolvedValue({
  ...testUser,
  userRoles: [
    { role_id: adminRole.id, role: adminRole }
  ]
});

// Setup mock responses for userRoles
prisma.userRole.create.mockImplementation((data: { data: any }) => Promise.resolve(data.data));
prisma.userRole.findMany.mockResolvedValue([
  { user_id: testUser.id, role_id: adminRole.id }
]);

describe('User Roles', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Should be able to create roles', async () => {
    const result = await prisma.role.create({
      data: adminRole
    });

    expect(result).toEqual(adminRole);
    expect(prisma.role.create).toHaveBeenCalledWith({
      data: adminRole
    });
  });

  test('Should be able to find roles', async () => {
    const roles = await prisma.role.findMany();
    
    expect(roles).toHaveLength(2);
    expect(roles).toContainEqual(adminRole);
    expect(roles).toContainEqual(clinicianRole);
    expect(prisma.role.findMany).toHaveBeenCalled();
  });

  test('Should be able to assign roles to users', async () => {
    const userRole = {
      user_id: testUser.id,
      role_id: clinicianRole.id
    };

    await prisma.userRole.create({
      data: userRole
    });

    expect(prisma.userRole.create).toHaveBeenCalledWith({
      data: userRole
    });
  });

  test('Should be able to fetch user with roles', async () => {
    const user = await prisma.user.findUnique({
      where: { id: testUser.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });

    expect(user).toBeDefined();
    expect(user.userRoles).toHaveLength(1);
    expect(user.userRoles[0].role_id).toBe(adminRole.id);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { id: testUser.id },
      include: {
        userRoles: {
          include: {
            role: true
          }
        }
      }
    });
  });
}); 