import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";
import { Prisma } from "@mcw/database";
import { SurveyAnswers } from "@prisma/client";
import { withErrorHandling } from "@mcw/utils";

// GET - Retrieve survey templates with their survey answers, filtered by type
export const GET = withErrorHandling(async (request: NextRequest) => {
  // Validate authentication
  const clinicianInfo = await getClinicianInfo();
  if (!clinicianInfo) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type");
  const clientId = searchParams.get("client_id");
  const includeAnswers = searchParams.get("include_answers") !== "false"; // Default to true
  const isActive = searchParams.get("is_active");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");

  logger.info("Retrieving survey templates");

  // Build where clause
  const whereClause: Prisma.SurveyTemplateWhereInput = {};

  if (type) {
    whereClause.type = type;
  }

  if (isActive !== null) {
    whereClause.is_active = isActive === "true";
  }

  // Build include clause
  const includeClause: Prisma.SurveyTemplateInclude = {};

  if (includeAnswers) {
    includeClause.SurveyAnswers = {
      where: clientId ? { client_id: clientId } : undefined,
      include: {
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
            type: true,
          },
        },
      },
    };
  }

  // Get total count for pagination
  const total = await prisma.surveyTemplate.count({
    where: whereClause,
  });

  // Fetch templates with pagination
  const templates = await prisma.surveyTemplate.findMany({
    where: whereClause,
    include: includeClause,
    orderBy: {
      created_at: "desc",
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  logger.info(`Retrieved ${templates.length} survey templates`);

  // Parse content for all templates and survey answers
  const parsedTemplates = templates.map((template) => ({
    ...template,
    content:
      typeof template.content === "string"
        ? JSON.parse(template.content)
        : template.content,
    SurveyAnswers: includeAnswers
      ? template.SurveyAnswers?.map((answer: SurveyAnswers) => ({
          ...answer,
          content:
            typeof answer.content === "string"
              ? JSON.parse(answer.content)
              : answer.content,
        }))
      : undefined,
  }));

  return NextResponse.json({
    data: parsedTemplates,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});
