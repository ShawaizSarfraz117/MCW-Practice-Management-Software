import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

const querySchema = z.object({
  type: z.string().optional(),
  context: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get("type");
    const context = searchParams.get("context");

    // Validate query params
    const validation = querySchema.safeParse({ type, context });
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: validation.error.errors },
        { status: 400 },
      );
    }

    // Build Prisma where clause
    const where: import("@prisma/client").Prisma.SurveyTemplateWhereInput = {
      is_active: true,
      is_shareable: true,
      ...(type ? { type } : {}),
      ...(context ? { context } : {}),
    };

    // Select relevant fields
    const templates = await prisma.surveyTemplate.findMany({
      where,
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        content: true,
        frequency_options: true,
        requires_signature: true,
        is_default: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ data: templates });
  } catch (error: unknown) {
    logger.error(
      `Failed to fetch survey templates: ${error instanceof Error ? error.message : String(error)}`,
    );
    return NextResponse.json(
      { error: "Failed to fetch survey templates" },
      { status: 500 },
    );
  }
}
