import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";
import { z } from "zod";
import { hash } from "bcrypt";
import { Prisma } from "@prisma/client";

// Schema for creating a team member
const teamMemberSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  password: z.string().min(8).optional(),
  roleIds: z.array(z.string()),
  isClinician: z.boolean().default(false),
  clinicianInfo: z
    .object({
      address: z.string(),
      percentageSplit: z.number().min(0).max(100),
    })
    .optional(),
});

// Schema for updating a team member
const updateTeamMemberSchema = teamMemberSchema
  .omit({ password: true })
  .partial()
  .extend({
    id: z.string(),
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

    if (search) {
      where = {
        OR: [
          { email: { contains: search } },
          { Clinician: { first_name: { contains: search } } },
          { Clinician: { last_name: { contains: search } } },
        ],
      };
    }

    // Filter by role if specified
    if (role !== "all") {
      where.UserRole = {
        some: {
          Role: {
            name: role,
          },
        },
      };
    }

    // Fetch users with roles and clinician info
    const users = await prisma.user.findMany({
      where,
      skip,
      take: pageSize,
      include: {
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
      roleIds,
      isClinician,
      clinicianInfo,
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

    // Hash password
    const passwordHash = password
      ? await hash(password, 10)
      : await hash(generateRandomPassword(), 10);

    // Create user with roles in a transaction
    const user = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password_hash: passwordHash,
          UserRole: {
            create: roleIds.map((roleId) => ({
              role_id: roleId,
            })),
          },
        },
      });

      // Create clinician if needed
      if (isClinician && clinicianInfo) {
        await tx.clinician.create({
          data: {
            user_id: newUser.id,
            first_name: firstName,
            last_name: lastName,
            address: clinicianInfo.address,
            percentage_split: clinicianInfo.percentageSplit,
          },
        });
      }

      return newUser;
    });

    // Fetch the created user with roles and clinician info
    const createdUser = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
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
      roleIds,
      isClinician,
      clinicianInfo,
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
      if (roleIds) {
        // Remove existing roles
        await tx.userRole.deleteMany({
          where: { user_id: id },
        });

        // Add new roles
        await Promise.all(
          roleIds.map((roleId) =>
            tx.userRole.create({
              data: {
                user_id: id,
                role_id: roleId,
              },
            }),
          ),
        );
      }

      // Update or create clinician if needed
      if (isClinician && (firstName || lastName || clinicianInfo)) {
        if (existingUser.Clinician) {
          // Update existing clinician
          await tx.clinician.update({
            where: { id: existingUser.Clinician.id },
            data: {
              first_name: firstName || existingUser.Clinician.first_name,
              last_name: lastName || existingUser.Clinician.last_name,
              address: clinicianInfo?.address || existingUser.Clinician.address,
              percentage_split:
                clinicianInfo?.percentageSplit ||
                existingUser.Clinician.percentage_split,
            },
          });
        } else {
          // Create new clinician
          await tx.clinician.create({
            data: {
              user_id: id,
              first_name: firstName || "",
              last_name: lastName || "",
              address: clinicianInfo?.address || "",
              percentage_split: clinicianInfo?.percentageSplit || 0,
            },
          });
        }
      } else if (!isClinician && existingUser.Clinician) {
        // If isClinician is explicitly false and user was a clinician, mark as inactive
        await tx.clinician.update({
          where: { id: existingUser.Clinician.id },
          data: { is_active: false },
        });
      }
    });

    // Fetch the updated user
    const updatedUser = await prisma.user.findUnique({
      where: { id },
      include: {
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
      },
    });

    if (!updatedUser) {
      throw new Error("Failed to retrieve updated user");
    }

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
