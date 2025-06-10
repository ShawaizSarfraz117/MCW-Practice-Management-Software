/* eslint-disable no-restricted-imports */
// API routes are allowed to import from @mcw/database
import { NextRequest, NextResponse } from "next/server";
import { prisma, Prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { withErrorHandling } from "@mcw/utils";
import { z } from "zod";
import { hash } from "bcryptjs";
import { ROLE_NAME_MAP } from "@mcw/types";

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

export const GET = withErrorHandling(async (request: NextRequest) => {
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
    // Map frontend role name to database role name
    const mappedRole = ROLE_NAME_MAP[role] || role;
    where.UserRole = {
      some: {
        Role: {
          name: mappedRole,
        },
      },
    };
  }

  // Fetch users with comprehensive data including services and licenses
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
      Clinician: {
        include: {
          ClinicianServices: {
            include: {
              PracticeService: true,
            },
          },
          License: {
            select: {
              id: true,
              license_type: true,
              license_number: true,
              expiration_date: true,
              state: true,
            },
          },
        },
      },
      clinicalInfos: {
        select: {
          id: true,
          speciality: true,
          taxonomy_code: true,
          NPI_number: true,
        },
      },
    },
    orderBy: {
      email: "asc",
    },
  });

  // Count total users for pagination
  const total = await prisma.user.count({ where });

  logger.info(
    { search, role, page, pageSize, total },
    "Team members fetched successfully",
  );

  return NextResponse.json({
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
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

  // Log the received data
  logger.info({ roleCategories, roles }, "Creating team member with roles");

  // Check if roles exist in the database
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

  // Determine if user has any clinician role
  const hasClinicianRole = roles.some((role) => role.startsWith("CLINICIAN."));

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
          License: {
            select: {
              id: true,
              license_type: true,
              license_number: true,
              expiration_date: true,
              state: true,
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

  logger.info(
    { userId: createdUser.id, email: createdUser.email },
    "Team member created successfully",
  );

  return NextResponse.json(createdUser, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
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
    specialty,
    npiNumber,
    license,
    services,
  } = validationResult.data;

  // Check if user exists with all related data
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: {
      UserRole: {
        include: {
          Role: true,
        },
      },
      Clinician: {
        include: {
          License: true,
          ClinicianServices: true,
        },
      },
      clinicalInfos: true,
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

  // Check if roles exist in the database
  let roleRecords: Array<{
    id: string;
    name: string;
    description: string | null;
  }> = [];
  if (roles && roles.length > 0) {
    roleRecords = await prisma.role.findMany({
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
  }

  // Determine if user has/will have any clinician role
  const hasClinicianRole = roles
    ? roles.some((role) => role.startsWith("CLINICIAN."))
    : existingUser.UserRole.some((ur) => ur.Role.name.startsWith("CLINICIAN."));

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
    if (roles && roles.length > 0) {
      // Remove existing roles
      await tx.userRole.deleteMany({
        where: { user_id: id },
      });

      // Add new roles
      await tx.userRole.createMany({
        data: roleRecords.map((role) => ({
          user_id: id,
          role_id: role.id,
        })),
      });
    }

    // Handle clinician-related updates
    if (hasClinicianRole) {
      // Update or create clinician record
      const existingClinician = existingUser.Clinician;

      let clinicianId;
      if (existingClinician) {
        // Update existing clinician
        if (firstName || lastName) {
          await tx.clinician.update({
            where: { id: existingClinician.id },
            data: {
              ...(firstName && { first_name: firstName }),
              ...(lastName && { last_name: lastName }),
            },
          });
        }
        clinicianId = existingClinician.id;
      } else {
        // Create new clinician if doesn't exist
        const newClinician = await tx.clinician.create({
          data: {
            user_id: id,
            first_name: firstName || "",
            last_name: lastName || "",
            address: "",
            percentage_split: 100,
          },
        });
        clinicianId = newClinician.id;
      }

      // Update clinical info if provided
      if (specialty !== undefined || npiNumber !== undefined) {
        const existingClinicalInfo = existingUser.clinicalInfos?.[0];

        if (existingClinicalInfo) {
          await tx.clinicalInfo.update({
            where: { id: existingClinicalInfo.id },
            data: {
              ...(specialty !== undefined && { speciality: specialty }),
              ...(npiNumber !== undefined && {
                NPI_number: npiNumber ? parseFloat(npiNumber) : 0,
              }),
            },
          });
        } else {
          await tx.clinicalInfo.create({
            data: {
              user_id: id,
              speciality: specialty || "",
              taxonomy_code: "",
              NPI_number: npiNumber ? parseFloat(npiNumber) : 0,
            },
          });
        }
      }

      // Update license if provided
      if (license) {
        const existingLicense = existingClinician?.License?.[0];

        if (existingLicense) {
          await tx.license.update({
            where: { id: existingLicense.id },
            data: {
              license_type: license.type,
              license_number: license.number,
              expiration_date: new Date(license.expirationDate),
              state: license.state,
            },
          });
        } else if (
          license.type &&
          license.number &&
          license.expirationDate &&
          license.state
        ) {
          await tx.license.create({
            data: {
              clinician_id: clinicianId,
              license_type: license.type,
              license_number: license.number,
              expiration_date: new Date(license.expirationDate),
              state: license.state,
            },
          });
        }
      }

      // Update services if provided
      if (services !== undefined) {
        // Remove existing services
        await tx.clinicianServices.deleteMany({
          where: { clinician_id: clinicianId },
        });

        // Add new services if any
        if (services.length > 0) {
          const serviceRecords = await tx.practiceService.findMany({
            where: { id: { in: services } },
          });

          if (serviceRecords.length > 0) {
            await tx.clinicianServices.createMany({
              data: serviceRecords.map((service) => ({
                clinician_id: clinicianId,
                service_id: service.id,
                is_active: true,
              })),
            });
          }
        }
      }
    }
  });

  // Fetch updated user with all related data
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
      Clinician: {
        include: {
          ClinicianServices: {
            include: {
              PracticeService: true,
            },
          },
          License: {
            select: {
              id: true,
              license_type: true,
              license_number: true,
              expiration_date: true,
              state: true,
            },
          },
        },
      },
      clinicalInfos: {
        select: {
          id: true,
          speciality: true,
          taxonomy_code: true,
          NPI_number: true,
        },
      },
    },
  });

  logger.info(
    { userId: id, email: updatedUser?.email },
    "Team member updated successfully",
  );

  return NextResponse.json(updatedUser);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "User ID is required" }, { status: 400 });
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

  logger.info(
    { userId: id, email: existingUser.email },
    "Team member soft deleted successfully",
  );

  return NextResponse.json({ success: true });
});

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
