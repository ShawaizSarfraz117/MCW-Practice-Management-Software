import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { z } from "zod";

const practiceInformationPayload = z.object({
  practiceName: z.string().nonempty().max(100).nullable(),
  practiceEmail: z.string().nonempty().max(100).nullable(),
  timeZone: z.string().nonempty().max(100).nullable(),
  practiceLogo: z.string().nonempty().max(1000).nullable(),
  phoneNumbers: z
    .array(z.object({ number: z.string(), type: z.string() }))
    .nullable(),
  teleHealth: z.boolean().optional().nullable(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    // Validate request body
    const validationResult = practiceInformationPayload.safeParse(data);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }

    // Check if practice information exists
    const existingPracticeInformation =
      await prisma.practiceInformation.findFirst({
        where: {
          user_id: session.user.id,
        },
      });

    if (existingPracticeInformation) {
      // Update existing practice information
      const updatedPracticeInformation =
        await prisma.practiceInformation.updateMany({
          where: { user_id: session.user.id },
          data: {
            practice_name: validationResult.data.practiceName ?? undefined,
            practice_email: validationResult.data.practiceEmail ?? undefined,
            time_zone: validationResult.data.timeZone ?? undefined,
            practice_logo: validationResult.data.practiceLogo ?? undefined,
            phone_numbers: JSON.stringify(validationResult.data.phoneNumbers),
            tele_health: validationResult.data.teleHealth ?? false,
          },
        });

      return NextResponse.json(updatedPracticeInformation);
    } else {
      // Insert new practice information
      const newPracticeInformation = await prisma.practiceInformation.create({
        data: {
          user_id: session.user.id,
          practice_name: validationResult.data.practiceName ?? "",
          practice_email: validationResult.data.practiceEmail ?? "",
          time_zone: validationResult.data.timeZone ?? "",
          practice_logo: validationResult.data.practiceLogo ?? "",
          phone_numbers: JSON.stringify(validationResult.data.phoneNumbers),
          tele_health: validationResult.data.teleHealth ?? false,
        },
      });
      return NextResponse.json(newPracticeInformation);
    }
  } catch (error) {
    console.error("Error updating practice information:", error);
    return NextResponse.json(
      { error: "Failed to update practice information" },
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

    const practiceInformation = await prisma.practiceInformation.findFirst({
      where: {
        user_id: session.user.id,
      },
    });

    if (!practiceInformation) {
      return NextResponse.json(
        { error: "Practice information not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ...practiceInformation,
      phone_numbers: JSON.parse(practiceInformation.phone_numbers),
    });
  } catch (error) {
    console.error("Error fetching practice information:", error);
    return NextResponse.json(
      { error: "Failed to fetch practice information" },
      { status: 500 },
    );
  }
}
