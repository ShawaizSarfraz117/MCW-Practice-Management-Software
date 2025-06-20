import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { withErrorHandling } from "@mcw/utils";
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

const phoneRegex = /^[- +()0-9]*$/;

export const dynamic = "force-dynamic";

export const PUT = withErrorHandling(async (request: NextRequest) => {
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

  // Backend phone number validation
  const phoneNumbers = validationResult.data.phoneNumbers || [];
  const invalidPhones = phoneNumbers?.filter(
    (p) => p.number && !phoneRegex.test(p.number),
  );
  if (invalidPhones.length > 0) {
    return NextResponse.json(
      {
        error: "Invalid phone number(s)",
        details: invalidPhones.map((p) => p.number),
      },
      { status: 422 },
    );
  }

  // Check if practice-wide information exists (without clinician_id)
  const existingPracticeInformation =
    await prisma.practiceInformation.findFirst({
      where: {
        clinician_id: null,
      },
    });

  if (existingPracticeInformation) {
    // Update existing practice information
    const updatedPracticeInformation = await prisma.practiceInformation.update({
      where: { id: existingPracticeInformation.id },
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
    // Insert new practice information (without clinician_id)
    const newPracticeInformation = await prisma.practiceInformation.create({
      data: {
        clinician_id: null,
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
});

export const GET = withErrorHandling(async () => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch practice-wide information (without clinician_id)
  const practiceInformation = await prisma.practiceInformation.findFirst({
    where: {
      clinician_id: null,
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
});
