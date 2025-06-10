import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@mcw/database";
import { withErrorHandling } from "@mcw/utils";
import { z } from "zod";
import { getBackOfficeSession } from "@/utils/helpers";

import { Prisma } from "@mcw/database";

const surveyAnswerSchema = z.object({
  template_id: z.string().uuid(),
  client_id: z.string().uuid(),
  content: z.string().nullable(),
  frequency: z.string().optional().nullable(),
  completed_at: z.string().datetime().optional().nullable(),
  assigned_at: z.string().datetime().optional().nullable(),
  expiry_date: z.string().datetime().optional().nullable(),
  is_intake: z.boolean().optional(),
  status: z.string().max(100),
  appointment_id: z.string().uuid().optional().nullable(),
  is_signed: z.boolean().optional(),
  is_locked: z.boolean().optional(),
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const template_id = searchParams.get("template_id");
  const client_id = searchParams.get("client_id");
  const appointment_id = searchParams.get("appointment_id") || id; // Support both 'id' and 'appointment_id' params

  const where: Prisma.SurveyAnswersWhereInput = {};

  // Build where clause based on provided parameters
  if (appointment_id && template_id) {
    // When both appointment_id and template_id are provided, find specific note
    const answer = await prisma.surveyAnswers.findFirst({
      where: {
        appointment_id,
        template_id,
      },
      include: {
        SurveyTemplate: true,
        Client: true,
      },
    });

    // Return null instead of 404 when note doesn't exist, so UI can create new one
    return NextResponse.json(answer || null);
  }

  if (appointment_id) {
    // If only appointment_id is provided, return all notes for that appointment
    const answers = await prisma.surveyAnswers.findMany({
      where: { appointment_id },
      include: {
        SurveyTemplate: true,
        Client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(answers);
  }

  // If no appointment_id, search by other criteria
  if (id) where.id = id;
  if (template_id) where.template_id = template_id;
  if (client_id) where.client_id = client_id;

  const answers = await prisma.surveyAnswers.findMany({
    where,
    include: {
      SurveyTemplate: true,
      Client: true,
    },
    orderBy: {
      created_at: "desc",
    },
  });

  return NextResponse.json(answers);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const parsed = surveyAnswerSchema.safeParse(data);

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.errors,
      },
      { status: 400 },
    );
  }

  // Check if a note already exists for this appointment
  if (parsed.data.appointment_id) {
    const existing = await prisma.surveyAnswers.findFirst({
      where: {
        appointment_id: parsed.data.appointment_id,
        template_id: parsed.data.template_id,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: "A note already exists for this appointment and template",
        },
        { status: 409 },
      );
    }
  }

  const created = await prisma.surveyAnswers.create({
    data: {
      ...parsed.data,
      completed_at: parsed.data.completed_at
        ? new Date(parsed.data.completed_at)
        : new Date(),
      assigned_at: parsed.data.assigned_at
        ? new Date(parsed.data.assigned_at)
        : new Date(),
      expiry_date: parsed.data.expiry_date
        ? new Date(parsed.data.expiry_date)
        : null,
    },
  });

  return NextResponse.json(created, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const data = await request.json();
  const { id, appointment_id, ...updateData } = data;

  // Support both id and appointment_id for flexibility
  const noteId = id || appointment_id;

  if (!noteId) {
    return NextResponse.json(
      {
        error: "Note ID or appointment ID is required",
      },
      { status: 400 },
    );
  }

  // Find the existing note - support lookup by either id or appointment_id
  const existing = await prisma.surveyAnswers.findFirst({
    where: {
      OR: [{ id: noteId }, { appointment_id: noteId }],
    },
  });

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  const parsed = surveyAnswerSchema.partial().safeParse(updateData);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Invalid input",
        details: parsed.error.errors,
      },
      { status: 400 },
    );
  }

  const updated = await prisma.surveyAnswers.update({
    where: { id: existing.id },
    data: {
      ...parsed.data,
      completed_at: parsed.data.completed_at
        ? new Date(parsed.data.completed_at)
        : existing.completed_at,
      assigned_at: parsed.data.assigned_at
        ? new Date(parsed.data.assigned_at)
        : existing.assigned_at,
      expiry_date: parsed.data.expiry_date
        ? new Date(parsed.data.expiry_date)
        : existing.expiry_date,
    },
  });

  return NextResponse.json(updated);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const session = await getBackOfficeSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const appointment_id = searchParams.get("appointment_id");
  const template_id = searchParams.get("template_id");

  const noteId = id || appointment_id;

  if (!noteId) {
    return NextResponse.json(
      {
        error: "Note ID or appointment ID is required",
      },
      { status: 400 },
    );
  }

  // Find the note by either id directly, or by appointment_id and template_id combination
  let existing;

  if (id) {
    // Direct ID lookup
    existing = await prisma.surveyAnswers.findUnique({
      where: { id: noteId },
    });
  } else if (appointment_id && template_id) {
    // Lookup by appointment and template combination
    existing = await prisma.surveyAnswers.findFirst({
      where: {
        appointment_id: appointment_id,
        template_id: template_id,
      },
    });
  } else {
    // Fallback to original OR logic
    existing = await prisma.surveyAnswers.findFirst({
      where: {
        OR: [{ id: noteId }, { appointment_id: noteId }],
      },
    });
  }

  if (!existing) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  // Perform hard delete
  await prisma.surveyAnswers.delete({
    where: { id: existing.id },
  });

  return NextResponse.json({
    message: "Note deleted successfully",
    id: existing.id,
  });
});
