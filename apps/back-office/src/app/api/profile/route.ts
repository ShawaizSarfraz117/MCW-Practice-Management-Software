import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

const profileUpdatePayload = z.object({
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

    // Update user profile directly
    const updatedUser = await prisma.user.update({
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

    return NextResponse.json(updatedUser);
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
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
