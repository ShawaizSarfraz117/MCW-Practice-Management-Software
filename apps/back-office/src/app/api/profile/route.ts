import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

const profileUpdatePayload = z.object({
  firstName: z.string().min(1).max(100).optional().nullable(),
  lastName: z.string().min(1).max(100).optional().nullable(),
  dateOfBirth: z.string().date().optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  profilePhoto: z.string().max(500).optional().nullable(),
});

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body
    const validationResult = profileUpdatePayload.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }

    // Update user profile and clinician info in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update user profile
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: {
          date_of_birth: validationResult.data.dateOfBirth
            ? (() => {
                try {
                  const date = new Date(validationResult.data.dateOfBirth!);
                  return isNaN(date.getTime()) ? null : date;
                } catch (e) {
                  console.error("Invalid date format:", e);
                  return null;
                }
              })()
            : null,
          phone: validationResult.data.phone,
          profile_photo: validationResult.data.profilePhoto,
        },
      });

      // Update clinician names if firstName or lastName provided
      if (
        validationResult.data.firstName !== undefined ||
        validationResult.data.lastName !== undefined
      ) {
        const clinician = await tx.clinician.findUnique({
          where: { user_id: session.user.id },
        });

        if (clinician) {
          await tx.clinician.update({
            where: { id: clinician.id },
            data: {
              ...(validationResult.data.firstName !== undefined && {
                first_name: validationResult.data.firstName || "",
              }),
              ...(validationResult.data.lastName !== undefined && {
                last_name: validationResult.data.lastName || "",
              }),
            },
          });
        }
      }

      return updatedUser;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const session = await getBackOfficeSession();

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
        date_of_birth: true,
        phone: true,
        profile_photo: true,
        Clinician: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Flatten the response to include first_name and last_name at the top level
    const response = {
      ...user,
      first_name: user.Clinician?.first_name || null,
      last_name: user.Clinician?.last_name || null,
      Clinician: undefined, // Remove the nested Clinician object
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
