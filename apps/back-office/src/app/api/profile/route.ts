import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getServerSession } from "next-auth";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";
import { z } from "zod";

const profileUpdatePayload = z.object({
  dateOfBirth: z.string().date().optional().nullable(),
  phone: z.string().min(10).max(20).optional().nullable(),
  profilePhoto: z.string().max(500).optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(backofficeAuthOptions);
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
    // Update profile
    const updatedProfile = await prisma.profileDetails.upsert({
      where: { user_id: session.user.id },
      update: {
        date_of_birth: validationResult.data.dateOfBirth
          ? new Date(validationResult.data.dateOfBirth)
          : null,
        phone: validationResult.data.phone,
        profile_photo: validationResult.data.profilePhoto,
      },
      create: {
        user_id: session.user.id,
        date_of_birth: validationResult.data.dateOfBirth
          ? new Date(validationResult.data.dateOfBirth)
          : null,
        phone: validationResult.data.phone,
        profile_photo: validationResult.data.profilePhoto,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updatedProfile);
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
    const session = await getServerSession(backofficeAuthOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await prisma.user.findUnique({
      where: {
        id: session.user.id,
      },
      select: {
        email: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const profile = await prisma.profileDetails.findUnique({
      where: {
        user_id: session.user.id,
      },
    });

    return NextResponse.json(profile || {});
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 },
    );
  }
}
