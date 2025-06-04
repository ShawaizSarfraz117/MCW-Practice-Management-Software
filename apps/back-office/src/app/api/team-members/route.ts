import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { z } from "zod";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";

// Schema for creating a team member
const teamMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8).optional(),
  roles: z.array(z.string()), // Array of categories (temporarily used as roles)
  roleCategories: z
    .array(
      z.object({
        roleId: z.string(),
        category: z.string(),
        roleTitle: z.string(),
      }),
    )
    .optional(),
  clinicianLevel: z
    .enum(["Basic", "Billing", "Full client list", "Entire practice"])
    .optional(),
  specialty: z.string().optional(),
  npiNumber: z.string().optional(),
  license: z
    .object({
      type: z.string(),
      number: z.string(),
      expirationDate: z.string(),
      state: z.string(),
    })
    .optional(),
  services: z.array(z.string()).optional(), // Array of service IDs
});

// Schema for updating a team member
const updateTeamMemberSchema = z.object({
  id: z.string(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  roles: z.array(z.string()).optional(),
  roleCategories: z
    .array(
      z.object({
        roleId: z.string(),
        category: z.string(),
        roleTitle: z.string(),
      }),
    )
    .optional(),
  clinicianLevel: z
    .enum(["Basic", "Billing", "Full client list", "Entire practice"])
    .optional(),
  specialty: z.string().optional(),
  npiNumber: z.string().optional(),
  license: z
    .object({
      type: z.string(),
      number: z.string(),
      expirationDate: z.string(),
      state: z.string(),
    })
    .optional(),
  services: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
    const skip = (page - 1) * pageSize;

    // Build where clause
    let where: Prisma.UserWhereInput = {};

    if (search && search !== "undefined") {
      where = {
        OR: [
          { email: { contains: search } },
          { Clinician: { first_name: { contains: search } } },
          { Clinician: { last_name: { contains: search } } },
        ],
      };
    }

    // Filter by role if specified
    if (role && role !== "all" && role !== "undefined") {
      // Convert role to uppercase to match database convention
      const normalizedRole = role.toUpperCase();
      where.UserRole = {
        some: {
          Role: {
            name: normalizedRole,
          },
        },
      };
    }

    // Fetch users with roles and clinician info, excluding sensitive fields
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      select: {
        id: true,
        email: true,
        last_login: true,
        date_of_birth: true,
        phone: true,
        profile_photo: true,
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
      },
      orderBy: {
        email: "asc",
      },
    });

    // Count total users for pagination
    const total = await prisma.user.count({ where });

    return NextResponse.json({
      data: users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to fetch team members");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = teamMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 422 },
      );
    }

    const {
      email,
      firstName,
      lastName,
      password,
      roles,
      roleCategories,
      specialty,
      npiNumber,
      license,
      services,
    } = validationResult.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 },
      );
    }

    // Log the received data for debugging
    console.log("Received roleCategories:", roleCategories);
    console.log("Received mapped roles:", roles);

    // Check if roles exist and get their IDs (roles should be ADMIN and/or CLINICIAN)
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles } },
    });

    if (roleRecords.length !== roles.length) {
      const foundRoleNames = roleRecords.map((role) => role.name);
      const missingRoles = roles.filter(
        (roleName) => !foundRoleNames.includes(roleName),
      );
      return NextResponse.json(
        { error: "One or more roles not found", missingRoles },
        { status: 404 },
      );
    }

    // Determine if user has clinician role
    const hasClinicianRole = roles.includes("CLINICIAN");

    // Hash password
    const passwordHash = password
      ? await hash(password, 10)
      : await hash(generateRandomPassword(), 10);

    // Create user with all related data in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          UserRole: {
            create: roleRecords.map((role) => ({
              role_id: role.id,
            })),
          },
        },
      });

      let clinician = null;
      let clinicalInfo = null;

      // Create clinician if user has clinician role
      if (hasClinicianRole) {
        const clinicianData = await tx.clinician.create({
          data: {
            user_id: newUser.id,
            first_name: firstName,
            last_name: lastName,
            address: "", // Default empty address - can be updated later
            percentage_split: 100, // Default 100% - can be updated later
          },
        });
        clinician = clinicianData;

        // Create clinical info if specialty or NPI provided
        if (specialty || npiNumber) {
          const clinicalInfoData = await tx.clinicalInfo.create({
            data: {
              user_id: newUser.id,
              speciality: specialty || "",
              taxonomy_code: "", // Default empty - can be updated later
              NPI_number: npiNumber ? parseFloat(npiNumber) : 0,
            },
          });
          clinicalInfo = clinicalInfoData;

          // Create license if provided
          if (
            license &&
            license.type &&
            license.number &&
            license.expirationDate &&
            license.state
          ) {
            await tx.license.create({
              data: {
                clinician_id: clinicianData.id,
                license_type: license.type,
                license_number: license.number,
                expiration_date: new Date(license.expirationDate),
                state: license.state,
              },
            });
          }
        }

        // Assign services if provided
        if (services && services.length > 0) {
          // Verify services exist
          const serviceRecords = await tx.practiceService.findMany({
            where: { id: { in: services } },
          });

          if (serviceRecords.length > 0) {
            await tx.clinicianServices.createMany({
              data: serviceRecords.map((service) => ({
                clinician_id: clinicianData.id,
                service_id: service.id,
                is_active: true,
              })),
            });
          }
        }
      }

      return { newUser, clinician, clinicalInfo };
    });

    // Fetch the created user with all related data, excluding password_hash
    const createdUser = await prisma.user.findUnique({
      where: { id: result.newUser.id },
      select: {
        id: true,
        email: true,
        last_login: true,
        date_of_birth: true,
        phone: true,
        profile_photo: true,
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: {
          include: {
            ClinicianServices: {
              include: {
                PracticeService: true,
              },
            },
          },
        },
        clinicalInfos: true,
      },
    });

    if (!createdUser) {
      throw new Error("Failed to retrieve created user");
    }

    return NextResponse.json(createdUser, { status: 201 });
  } catch (error) {
    logger.error({ error }, "Failed to create team member");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validationResult = updateTeamMemberSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validationResult.error.format() },
        { status: 422 },
      );
    }

    const {
      id,
      email,
      firstName,
      lastName,
      roles,
      specialty: _specialty,
      npiNumber: _npiNumber,
      license: _license,
      services: _services,
    } = validationResult.data;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        UserRole: true,
        Clinician: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // If email is changing, make sure it doesn't conflict
    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email },
      });

      if (emailExists) {
        return NextResponse.json(
          { error: "Email already in use" },
          { status: 409 },
        );
      }
    }

    // Update user in a transaction
    await prisma.$transaction(async (tx) => {
      // Update user email if provided
      if (email) {
        await tx.user.update({
          where: { id },
          data: { email },
        });
      }

      // Update roles if provided
      if (roles) {
        // Get role records
        const roleRecords = await tx.role.findMany({
          where: { name: { in: roles } },
        });

        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { user_id: id },
        });

        // Add new roles
        await Promise.all(
          roleRecords.map((role) =>
            tx.userRole.create({
              data: {
                user_id: id,
                role_id: role.id,
              },
            }),
          ),
        );
      }

      // Handle clinician updates if needed
      const hasClinicianRole = roles
        ? roles.includes("Clinician") || roles.includes("Supervisor")
        : false;

      if (hasClinicianRole && (firstName || lastName)) {
        // Update clinician info if exists, create if doesn't
        const existingClinician = await tx.clinician.findUnique({
          where: { user_id: id },
        });

        if (existingClinician) {
          await tx.clinician.update({
            where: { user_id: id },
            data: {
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
            },
          });
        } else {
          await tx.clinician.create({
            data: {
              user_id: id,
              first_name: firstName || "",
              last_name: lastName || "",
              address: "",
              percentage_split: 100,
            },
          });
        }
      }
    });

    // Fetch updated user, excluding password_hash
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        last_login: true,
        date_of_birth: true,
        phone: true,
        profile_photo: true,
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    logger.error({ error }, "Failed to update team member");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id },
      include: {
        Clinician: true,
      },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Instead of hard deleting, we'll mark the user as inactive
    // and handle any related records
    await prisma.$transaction(async (tx) => {
      // If user is a clinician, mark clinician as inactive
      if (existingUser.Clinician) {
        await tx.clinician.update({
          where: { id: existingUser.Clinician.id },
          data: { is_active: false },
        });
      }

      // Update the user (e.g., append "DELETED" to email to prevent re-registration)
      await tx.user.update({
        where: { id },
        data: {
          email: `DELETED-${Date.now()}-${existingUser.email}`,
          password_hash: "DELETED", // Invalidate password
        },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error({ error }, "Failed to delete team member");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// Helper function to generate a random password
function generateRandomPassword() {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
  let password = "";
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
