/* eslint-disable max-lines */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";
import { getClinicianInfo } from "@/utils/helpers";

// Content structure validation
const REQUIRED_MENTAL_STATUS_FIELDS = [
  "appearance",
  "dress",
  "motor_activity",
  "insight",
  "judgement",
  "affect",
  "mood",
  "orientation",
  "memory",
  "attention",
  "thought_content",
  "thought_process",
  "perception",
  "interview_behavior",
  "speech",
  "recommendations",
];

const VALID_STATUSES = ["PENDING", "IN_PROGRESS", "COMPLETED"];

// Validate Mental Status Exam content structure
const validateMentalStatusContent = (content: unknown): boolean => {
  if (!content || typeof content !== "object") {
    return false;
  }

  // Check if all required fields are present
  return REQUIRED_MENTAL_STATUS_FIELDS.every((field) =>
    Object.prototype.hasOwnProperty.call(content, field),
  );
};

// Validate foreign key relationships for survey answers
const validateSurveyAnswerRelationships = async (
  client_id: string,
  appointment_id: string,
) => {
  const [client, appointment] = await Promise.all([
    prisma.client.findUnique({
      where: { id: client_id },
    }),
    prisma.appointment.findUnique({
      where: { id: appointment_id },
    }),
  ]);

  return { client, appointment };
};

// Create or update survey answer for the template
const createOrUpdateSurveyAnswer = async (
  template_id: string,
  client_id: string,
  appointment_id: string,
  content?: unknown,
  status?: string,
) => {
  // Validate relationships
  const { client, appointment } = await validateSurveyAnswerRelationships(
    client_id,
    appointment_id,
  );

  if (!client) {
    throw new Error("Client not found");
  }

  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Check if survey answer already exists
  const existingSurveyAnswer = await prisma.surveyAnswers.findFirst({
    where: {
      template_id,
      client_id,
      appointment_id,
    },
  });

  const finalStatus = status || "PENDING";
  const completedAt =
    finalStatus === "COMPLETED"
      ? new Date()
      : finalStatus === "PENDING" || finalStatus === "IN_PROGRESS"
        ? null
        : null;

  if (existingSurveyAnswer) {
    // Update existing survey answer
    const updateData: Partial<{
      content: string | null;
      status: string;
      completed_at: Date | null;
    }> = {};

    if (content !== undefined) {
      updateData.content = content ? JSON.stringify(content) : null;
    }

    if (status !== undefined) {
      updateData.status = finalStatus;
      updateData.completed_at = completedAt;
    }

    return await prisma.surveyAnswers.update({
      where: { id: existingSurveyAnswer.id },
      data: updateData,
    });
  } else {
    // Create new survey answer
    return await prisma.surveyAnswers.create({
      data: {
        template_id,
        client_id,
        appointment_id,
        content: content ? JSON.stringify(content) : null,
        status: finalStatus,
        assigned_at: new Date(),
        completed_at: completedAt,
      },
    });
  }
};

// GET - Retrieve a specific Mental Status Exam template by ID
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      logger.warn(
        "Mental Status Exam template GET request missing ID parameter",
      );
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    logger.info("Retrieving Mental Status Exam template");

    const template = await prisma.surveyTemplate.findUnique({
      where: {
        id,
        type: "MENTAL_STATUS_EXAM",
      },
      include: {
        SurveyAnswers: true,
      },
    });

    if (!template) {
      logger.warn("Mental Status Exam template not found");
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    logger.info("Mental Status Exam template retrieved successfully");

    // Parse content if it's a string
    const parsedTemplate = {
      ...template,
      content:
        typeof template.content === "string"
          ? JSON.parse(template.content)
          : template.content,
    };

    return NextResponse.json(parsedTemplate);
  } catch (error: unknown) {
    logger.error("Error retrieving Mental Status Exam template");

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

// POST - Create a new Mental Status Exam template and optionally create/update survey answer
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    const {
      name,
      description,
      content,
      client_id,
      appointment_id,
      survey_content,
      status,
    } = requestData;

    // Validate required fields
    if (!name || !content) {
      logger.warn(
        "Mental Status Exam template POST request missing required fields",
      );
      return NextResponse.json(
        { error: "Name and content are required" },
        { status: 400 },
      );
    }

    // Validate name length
    if (name.length > 255) {
      return NextResponse.json(
        { error: "Name must be 255 characters or less" },
        { status: 400 },
      );
    }

    // Validate content structure
    if (!validateMentalStatusContent(content)) {
      logger.warn("Invalid Mental Status Exam content structure");
      return NextResponse.json(
        {
          error: "Invalid content structure",
          details: `Content must include all required fields: ${REQUIRED_MENTAL_STATUS_FIELDS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate status if provided for survey answer
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate survey answer fields if provided
    if ((client_id || appointment_id) && (!client_id || !appointment_id)) {
      return NextResponse.json(
        {
          error:
            "Both client_id and appointment_id are required when creating survey answers",
        },
        { status: 400 },
      );
    }

    logger.info("Creating Mental Status Exam template");

    const newTemplate = await prisma.surveyTemplate.create({
      data: {
        name,
        description: description || "Mental Status Exam template",
        type: "MENTAL_STATUS_EXAM",
        content: JSON.stringify(content),
        is_active: true,
        updated_at: new Date(),
      },
    });

    logger.info("Mental Status Exam template created successfully");

    let surveyAnswer = null;

    // Create survey answer if client_id and appointment_id are provided
    if (client_id && appointment_id) {
      try {
        logger.info("Creating survey answer for template");
        surveyAnswer = await createOrUpdateSurveyAnswer(
          newTemplate.id,
          client_id,
          appointment_id,
          survey_content,
          status,
        );
        logger.info("Survey answer created successfully");
      } catch (surveyError: unknown) {
        // If survey answer creation fails, we should still return the template
        // but include the error information
        logger.error("Failed to create survey answer");

        if (surveyError instanceof Error) {
          return NextResponse.json(
            { error: surveyError.message },
            { status: 400 },
          );
        }
      }
    }

    // Parse content for response
    const responseTemplate = {
      ...newTemplate,
      content: JSON.parse(newTemplate.content),
    };

    const responseData: {
      template: typeof responseTemplate;
      survey_answer?: typeof surveyAnswer;
      message: string;
    } = {
      template: responseTemplate,
      message: "Mental Status Exam template created successfully",
    };

    if (surveyAnswer) {
      responseData.survey_answer = {
        ...surveyAnswer,
        content: surveyAnswer.content ? JSON.parse(surveyAnswer.content) : null,
      };
      responseData.message =
        "Mental Status Exam template and survey answer created successfully";
    }

    return NextResponse.json(responseData, { status: 201 });
  } catch (error: unknown) {
    logger.error("Error creating Mental Status Exam template");

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2002":
          return NextResponse.json(
            { error: "Template with this name already exists" },
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

// PUT - Update an existing Mental Status Exam template and optionally update survey answer
export async function PUT(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requestData = await request.json();
    const {
      id,
      name,
      description,
      content,
      is_active,
      client_id,
      appointment_id,
      survey_content,
      status,
    } = requestData;

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required for update" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.surveyTemplate.findUnique({
      where: {
        id,
        type: "MENTAL_STATUS_EXAM",
      },
    });

    if (!existingTemplate) {
      logger.warn("Mental Status Exam template not found for update");
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    // Validate content structure if provided
    if (content && !validateMentalStatusContent(content)) {
      logger.warn("Invalid Mental Status Exam content structure for update");
      return NextResponse.json(
        {
          error: "Invalid content structure",
          details: `Content must include all required fields: ${REQUIRED_MENTAL_STATUS_FIELDS.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate name length if provided
    if (name && name.length > 255) {
      return NextResponse.json(
        { error: "Name must be 255 characters or less" },
        { status: 400 },
      );
    }

    // Validate status if provided for survey answer
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Invalid status. Valid values are: ${VALID_STATUSES.join(", ")}`,
        },
        { status: 400 },
      );
    }

    // Validate survey answer fields if provided
    if ((client_id || appointment_id) && (!client_id || !appointment_id)) {
      return NextResponse.json(
        {
          error:
            "Both client_id and appointment_id are required when updating survey answers",
        },
        { status: 400 },
      );
    }

    logger.info("Updating Mental Status Exam template");

    // Build update data
    const updateData: Partial<{
      name: string;
      description: string;
      content: string;
      is_active: boolean;
      updated_at: Date;
    }> = {
      updated_at: new Date(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (content !== undefined) updateData.content = JSON.stringify(content);
    if (is_active !== undefined) updateData.is_active = is_active;

    const updatedTemplate = await prisma.surveyTemplate.update({
      where: { id },
      data: updateData,
    });

    logger.info("Mental Status Exam template updated successfully");

    let surveyAnswer = null;

    // Update survey answer if client_id and appointment_id are provided
    if (client_id && appointment_id) {
      try {
        logger.info("Updating survey answer for template");
        surveyAnswer = await createOrUpdateSurveyAnswer(
          id,
          client_id,
          appointment_id,
          survey_content,
          status,
        );
        logger.info("Survey answer updated successfully");
      } catch (surveyError: unknown) {
        logger.error("Failed to update survey answer");

        if (surveyError instanceof Error) {
          return NextResponse.json(
            { error: surveyError.message },
            { status: 400 },
          );
        }
      }
    }

    // Parse content for response
    const responseTemplate = {
      ...updatedTemplate,
      content: JSON.parse(updatedTemplate.content),
    };

    const responseData: {
      template: typeof responseTemplate;
      survey_answer?: typeof surveyAnswer;
      message: string;
    } = {
      template: responseTemplate,
      message: "Template updated successfully",
    };

    if (surveyAnswer) {
      responseData.survey_answer = {
        ...surveyAnswer,
        content: surveyAnswer.content ? JSON.parse(surveyAnswer.content) : null,
      };
      responseData.message = "Template and survey answer updated successfully";
    }

    return NextResponse.json(responseData);
  } catch (error: unknown) {
    logger.error("Error updating Mental Status Exam template");

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Template not found" },
            { status: 404 },
          );
        case "P2002":
          return NextResponse.json(
            { error: "Template with this name already exists" },
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

// DELETE - Delete a Mental Status Exam template and its associated survey answers
export async function DELETE(request: NextRequest) {
  try {
    // Validate authentication
    const clinicianInfo = await getClinicianInfo();
    if (!clinicianInfo) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Template ID is required" },
        { status: 400 },
      );
    }

    // Check if template exists
    const existingTemplate = await prisma.surveyTemplate.findUnique({
      where: {
        id,
        type: "MENTAL_STATUS_EXAM",
      },
    });

    if (!existingTemplate) {
      logger.warn("Mental Status Exam template not found for deletion");
      return NextResponse.json(
        { error: "Template not found" },
        { status: 404 },
      );
    }

    logger.info(
      "Deleting Mental Status Exam template and associated survey answers",
    );

    // Delete associated survey answers first (to avoid foreign key constraint issues)
    await prisma.surveyAnswers.deleteMany({
      where: { template_id: id },
    });

    // Delete the template
    const deletedTemplate = await prisma.surveyTemplate.delete({
      where: { id },
    });

    logger.info(
      "Mental Status Exam template and associated survey answers deleted successfully",
    );

    // Parse content for response
    const responseTemplate = {
      ...deletedTemplate,
      content: JSON.parse(deletedTemplate.content),
    };

    return NextResponse.json({
      message: "Template and associated survey answers deleted successfully",
      template: responseTemplate,
    });
  } catch (error: unknown) {
    logger.error("Error deleting Mental Status Exam template");

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      switch (error.code) {
        case "P2025":
          return NextResponse.json(
            { error: "Template not found" },
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
