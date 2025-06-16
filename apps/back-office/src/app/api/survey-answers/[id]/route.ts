import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getClinicianInfo } from "@/utils/helpers";
import { Prisma } from "@prisma/client";
import { calculateSurveyScore, getSurveyType } from "@mcw/utils";

const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

// GET - Retrieve a specific survey answer by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveyAnswerId = params.id;

    if (!surveyAnswerId) {
      logger.warn("Survey answer GET request missing ID parameter");
      return NextResponse.json(
        { error: "Survey answer ID is required" },
        { status: 400 },
      );
    }

    logger.info(`Retrieving survey answer with ID: ${surveyAnswerId}`);

    const surveyAnswer = await prisma.surveyAnswers.findUnique({
      where: {
        id: surveyAnswerId,
      },
      include: {
        SurveyTemplate: {
          select: {
            id: true,
            name: true,
            type: true,
            description: true,
            content: true,
          },
        },
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
            preferred_name: true,
            date_of_birth: true,
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
    });

    if (!surveyAnswer) {
      logger.warn("Survey answer not found");
      return NextResponse.json(
        { error: "Survey answer not found" },
        { status: 404 },
      );
    }

    logger.info("Survey answer retrieved successfully");

    // Parse content and score if they're strings
    const parsedSurveyAnswer = {
      ...surveyAnswer,
      content:
        typeof surveyAnswer.content === "string"
          ? JSON.parse(surveyAnswer.content)
          : surveyAnswer.content,
      score:
        typeof surveyAnswer.score === "string"
          ? JSON.parse(surveyAnswer.score)
          : surveyAnswer.score,
      SurveyTemplate: {
        ...surveyAnswer.SurveyTemplate,
        content:
          typeof surveyAnswer.SurveyTemplate.content === "string"
            ? JSON.parse(surveyAnswer.SurveyTemplate.content)
            : surveyAnswer.SurveyTemplate.content,
      },
    };

    return NextResponse.json(parsedSurveyAnswer);
  } catch (error: unknown) {
    logger.error(`Error retrieving survey answer: ${error}`);

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

// PUT - Update an existing survey answer
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveyAnswerId = params.id;

    if (!surveyAnswerId) {
      return NextResponse.json(
        { error: "Survey answer ID is required for update" },
        { status: 400 },
      );
    }

    const requestData = await request.json();
    const { content, status, appointment_id } = requestData;

    // Check if survey answer exists and get template for scoring
    const existingSurveyAnswer = await prisma.surveyAnswers.findUnique({
      where: {
        id: surveyAnswerId,
      },
      include: {
        SurveyTemplate: true,
      },
    });

    if (!existingSurveyAnswer) {
      logger.warn("Survey answer not found for update");
      return NextResponse.json(
        { error: "Survey answer not found" },
        { status: 404 },
      );
    }

    // Validate status if provided
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
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

    logger.info(`Updating survey answer with ID: ${surveyAnswerId}`);

    // Build update data
    const updateData: Partial<{
      content: string | null;
      status: string;
      appointment_id: string | null;
      completed_at: Date | null;
      score: string | null;
    }> = {};

    if (content !== undefined) {
      updateData.content = content ? JSON.stringify(content) : null;
    }

    if (status !== undefined) {
      updateData.status = status;
      updateData.completed_at = status === "COMPLETED" ? new Date() : null;

      // Calculate score if status is changing to completed and content is provided
      if (status === "COMPLETED" && (content || existingSurveyAnswer.content)) {
        const surveyType = getSurveyType(
          existingSurveyAnswer.SurveyTemplate.name,
        );
        if (surveyType) {
          const surveyContent =
            content ||
            (existingSurveyAnswer.content
              ? JSON.parse(existingSurveyAnswer.content as string)
              : null);
          if (surveyContent) {
            const score = calculateSurveyScore(surveyType, surveyContent);
            updateData.score = JSON.stringify(score);
          }
        }
      }
    }

    if (appointment_id !== undefined) {
      updateData.appointment_id = appointment_id;
    }

    const updatedSurveyAnswer = await prisma.surveyAnswers.update({
      where: { id: surveyAnswerId },
      data: updateData,
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

    logger.info("Survey answer updated successfully");

    const responseData = {
      ...updatedSurveyAnswer,
      content: updatedSurveyAnswer.content
        ? JSON.parse(updatedSurveyAnswer.content)
        : null,
      score: updatedSurveyAnswer.score
        ? JSON.parse(updatedSurveyAnswer.score)
        : null,
    };

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    logger.error(`Error updating survey answer: ${error}`);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Survey answer not found" },
            { status: 404 },
          );
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

// DELETE - Delete a survey answer
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const surveyAnswerId = params.id;

    if (!surveyAnswerId) {
      return NextResponse.json(
        { error: "Survey answer ID is required" },
        { status: 400 },
      );
    }

    // Check if survey answer exists
    const existingSurveyAnswer = await prisma.surveyAnswers.findUnique({
      where: {
        id: surveyAnswerId,
      },
    });

    if (!existingSurveyAnswer) {
      logger.warn("Survey answer not found for deletion");
      return NextResponse.json(
        { error: "Survey answer not found" },
        { status: 404 },
      );
    }

    logger.info(`Deleting survey answer with ID: ${surveyAnswerId}`);

    // Delete the survey answer
    const deletedSurveyAnswer = await prisma.surveyAnswers.delete({
      where: { id: surveyAnswerId },
    });

    logger.info("Survey answer deleted successfully");

    // Parse content for response
    const responseSurveyAnswer = {
      ...deletedSurveyAnswer,
      content: deletedSurveyAnswer.content
        ? JSON.parse(deletedSurveyAnswer.content)
        : null,
    };

    return NextResponse.json({
      message: "Survey answer deleted successfully",
      survey_answer: responseSurveyAnswer,
    });
  } catch (error: unknown) {
    logger.error(`Error deleting survey answer: ${error}`);

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Survey answer not found" },
            { status: 404 },
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
