import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";
import { Prisma } from "@prisma/client";

const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

// POST - Create a new survey answer
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    const {
      template_id,
      client_id,
      appointment_id,
      content,
      status = "PENDING",
    } = requestData;

    // Validate required fields
    if (!template_id || !client_id) {
      logger.warn("Survey answer POST request missing required fields");
      return NextResponse.json(
        { error: "template_id and client_id are required" },
        { status: 400 },
      );
    }

    // Validate status
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate template exists
    const template = await prisma.surveyTemplate.findUnique({
      where: { id: template_id },
    });

    if (!template) {
      return NextResponse.json(
        { error: "Survey template not found" },
        { status: 404 },
      );
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: client_id },
    });

    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Validate appointment if provided
    if (appointment_id) {
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointment_id },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }
    }

    logger.info("Creating new survey answer");

    const completedAt = status === "COMPLETED" ? new Date() : null;

    const newSurveyAnswer = await prisma.surveyAnswers.create({
      data: {
        template_id,
        client_id,
        appointment_id: appointment_id || null,
        content: content ? JSON.stringify(content) : null,
        status,
        assigned_at: new Date(),
        completed_at: completedAt,
      },
      include: {
        SurveyTemplate: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
            preferred_name: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
          },
        },
      },
    });

    logger.info("Survey answer created successfully");

    // Parse content for response
    const responseData = {
      ...newSurveyAnswer,
      content: newSurveyAnswer.content
        ? JSON.parse(newSurveyAnswer.content)
        : null,
    };

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    logger.error(`Error creating survey answer: ${error}`);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Survey answer already exists" },
            { status: 409 },
          );
        default:
          return NextResponse.json(
            { error: "Database operation failed" },
            { status: 500 },
          );
      }
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET - Retrieve survey answers with filtering options
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const client_id = searchParams.get("client_id");
    const template_id = searchParams.get("template_id");
    const template_type = searchParams.get("template_type");
    const status = searchParams.get("status");
    const appointment_id = searchParams.get("appointment_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    logger.info("Retrieving survey answers");

    // Build where clause
    const whereClause: Prisma.SurveyAnswersWhereInput = {};

    if (client_id) {
      whereClause.client_id = client_id;
    }

    if (template_id) {
      whereClause.template_id = template_id;
    }

    if (template_type) {
      whereClause.SurveyTemplate = {
        type: template_type,
      };
    }

    if (status) {
      whereClause.status = status;
    }

    if (appointment_id) {
      whereClause.appointment_id = appointment_id;
    }

    // Get total count for pagination
    const total = await prisma.surveyAnswers.count({
      where: whereClause,
    });

    // Fetch survey answers with pagination
    const surveyAnswers = await prisma.surveyAnswers.findMany({
      where: whereClause,
      include: {
        SurveyTemplate: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
          },
        },
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
            preferred_name: true,
          },
        },
        Appointment: {
          select: {
            id: true,
            start_date: true,
            end_date: true,
          },
        },
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    logger.info(`Retrieved ${surveyAnswers.length} survey answers`);

    // Parse content for all survey answers
    const parsedSurveyAnswers = surveyAnswers.map((answer) => ({
      ...answer,
      content:
        typeof answer.content === "string"
          ? JSON.parse(answer.content)
          : answer.content,
    }));

    return NextResponse.json({
      data: parsedSurveyAnswers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: unknown) {
    logger.error(`Error retrieving survey answers: ${error}`);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        { error: "Database operation failed" },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
