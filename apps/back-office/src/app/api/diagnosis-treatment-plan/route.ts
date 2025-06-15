import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

interface DiagnosisItem {
  id?: string;
  code: string;
  description: string;
}

interface DiagnosisTreatmentPlanRequest {
  clientId: string;
  title: string;
  diagnoses: DiagnosisItem[];
  dateTime: string;
  surveyAnswersId?: string;
  clientGroupId?: string;
  surveyData?: {
    templateId: string;
    content: Record<string, string>;
  };
}

// GET - Fetch diagnosis treatment plans for a client
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const clientId = searchParams.get("clientId");
    const planId = searchParams.get("planId");

    if (planId) {
      const plan = await prisma.diagnosisTreatmentPlan.findUnique({
        where: { id: planId },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
          Client: true,
          SurveyAnswers: true,
        },
      });

      if (!plan) {
        return NextResponse.json(
          { error: "Treatment plan not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(plan);
    }

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    const plans = await prisma.diagnosisTreatmentPlan.findMany({
      where: { client_id: clientId },
      include: {
        DiagnosisTreatmentPlanItem: {
          include: {
            Diagnosis: true,
          },
        },
        SurveyAnswers: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(plans);
  } catch (error) {
    logger.error({
      message: "Error fetching diagnosis treatment plans:",
      error,
    });
    return NextResponse.json(
      { error: "Failed to fetch treatment plans" },
      { status: 500 },
    );
  }
}

// POST - Create a new diagnosis treatment plan
export async function POST(request: NextRequest) {
  try {
    const data: DiagnosisTreatmentPlanRequest = await request.json();
    const { clientId, title, diagnoses, dateTime, surveyAnswersId } = data;

    logger.info({
      message: "Creating diagnosis treatment plan",
      clientId,
      title,
      diagnosesCount: diagnoses?.length || 0,
      diagnoses: diagnoses,
    });

    if (!clientId || !title) {
      return NextResponse.json(
        { error: "Client ID and title are required" },
        { status: 400 },
      );
    }

    // First verify the client exists
    const clientExists = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!clientExists) {
      logger.error({ message: `Client not found with ID: ${clientId}` });
      return NextResponse.json(
        { error: `Client not found with ID: ${clientId}` },
        { status: 404 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Create the treatment plan
      const treatmentPlan = await tx.diagnosisTreatmentPlan.create({
        data: {
          client_id: clientId,
          client_group_id: data?.clientGroupId || null,
          title,
          survey_answers_id: surveyAnswersId || null,
          created_at: dateTime ? new Date(dateTime) : new Date(),
        },
      });

      // Check for existing diagnosis items for this treatment plan
      const existingItems = await tx.diagnosisTreatmentPlanItem.findMany({
        where: { treatment_plan_id: treatmentPlan.id },
        select: { diagnosis_id: true },
      });

      const existingDiagnosisIds = new Set(
        existingItems.map((item) => item.diagnosis_id),
      );

      // Only create diagnosis items if diagnosis_id is provided and not already exists
      const diagnosisItems = diagnoses
        .filter((diag) => diag.id && diag.id.length > 0)
        .filter((diag) => !existingDiagnosisIds.has(diag.id!))
        .map((diag) => ({
          treatment_plan_id: treatmentPlan.id,
          diagnosis_id: diag.id!,
          custom_description: diag.description || null,
        }));

      if (diagnosisItems.length > 0) {
        await tx.diagnosisTreatmentPlanItem.createMany({
          data: diagnosisItems,
        });
      }

      // Update existing items if description changed
      const itemsToUpdate = diagnoses
        .filter((diag) => diag.id && existingDiagnosisIds.has(diag.id))
        .filter((diag) => diag.description); // Only update if there's a description

      for (const diag of itemsToUpdate) {
        await tx.diagnosisTreatmentPlanItem.updateMany({
          where: {
            treatment_plan_id: treatmentPlan.id,
            diagnosis_id: diag.id!,
          },
          data: {
            custom_description: diag.description,
          },
        });
      }

      // Return the created plan with its items
      return await tx.diagnosisTreatmentPlan.findUnique({
        where: { id: treatmentPlan.id },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
          SurveyAnswers: true,
        },
      });
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    logger.error({
      message: "Error creating diagnosis treatment plan:",
      error,
    });
    return NextResponse.json(
      {
        error: "Failed to create treatment plan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - Update an existing diagnosis treatment plan
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { id, title, diagnoses, surveyAnswersId, surveyData } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Treatment plan ID is required" },
        { status: 400 },
      );
    }

    // First, get the existing plan to check if it has a survey answer
    const existingPlan = await prisma.diagnosisTreatmentPlan.findUnique({
      where: { id },
      include: { SurveyAnswers: true },
    });

    const result = await prisma.$transaction(async (tx) => {
      let finalSurveyAnswerId: string | null =
        existingPlan?.survey_answers_id || null;

      // Handle survey answer - update existing or create new
      if (surveyData && surveyData.templateId && surveyData.content) {
        if (existingPlan?.survey_answers_id) {
          // Update existing survey answer
          logger.info({
            message: "Updating existing survey answer",
            surveyAnswerId: existingPlan.survey_answers_id,
            templateId: surveyData.templateId,
            contentKeys: Object.keys(surveyData.content),
          });

          const updatedSurvey = await tx.surveyAnswers.update({
            where: { id: existingPlan.survey_answers_id },
            data: {
              content: JSON.stringify(surveyData.content),
              status: "COMPLETED",
              completed_at: new Date(),
            },
          });

          logger.info({
            message: "Updated survey answer successfully",
            surveyAnswerId: updatedSurvey.id,
            contentLength: updatedSurvey.content?.length,
          });

          finalSurveyAnswerId = existingPlan.survey_answers_id;
        } else {
          // Create new survey answer if none exists
          logger.info({
            message: "Creating new survey answer",
            templateId: surveyData.templateId,
            contentKeys: Object.keys(surveyData.content),
          });

          const surveyAnswer = await tx.surveyAnswers.create({
            data: {
              template_id: surveyData.templateId,
              client_id: data.clientId,
              client_group_id: data?.clientGroupId || null,
              content: JSON.stringify(surveyData.content),
              status: "COMPLETED",
              completed_at: new Date(),
              assigned_at: new Date(),
            },
          });
          finalSurveyAnswerId = surveyAnswer.id;
        }
      }

      // Update the treatment plan
      const treatmentPlan = await tx.diagnosisTreatmentPlan.update({
        where: { id },
        data: {
          title,
          client_group_id: data?.clientGroupId || null,
          survey_answers_id: surveyAnswersId || finalSurveyAnswerId || null,
          updated_at: new Date(),
        },
      });

      // Delete existing diagnosis items
      await tx.diagnosisTreatmentPlanItem.deleteMany({
        where: { treatment_plan_id: id },
      });

      // Create new diagnosis items
      const diagnosisItems = diagnoses
        .filter((diag: DiagnosisItem) => diag.id && diag.id.length > 0)
        .map((diag: DiagnosisItem) => ({
          treatment_plan_id: treatmentPlan.id,
          diagnosis_id: diag.id!,
          custom_description: diag.description || null,
        }));

      if (diagnosisItems.length > 0) {
        const validItems = diagnosisItems.filter(
          (item: { diagnosis_id: string }) => item.diagnosis_id !== "",
        );

        if (validItems.length > 0) {
          await tx.diagnosisTreatmentPlanItem.createMany({
            data: validItems,
          });
        }
      }

      // Return the updated plan with its items
      const updatedPlan = await tx.diagnosisTreatmentPlan.findUnique({
        where: { id: treatmentPlan.id },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
          SurveyAnswers: true,
        },
      });

      logger.info({
        message: "Updated plan with survey data",
        planId: updatedPlan?.id,
        surveyAnswersId: updatedPlan?.survey_answers_id,
        hasSurveyAnswers: !!updatedPlan?.SurveyAnswers,
      });

      return updatedPlan;
    });

    return NextResponse.json(result);
  } catch (error) {
    logger.error({
      message: "Error updating diagnosis treatment plan:",
      error,
    });
    return NextResponse.json(
      {
        error: "Failed to update treatment plan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// DELETE - Delete a diagnosis treatment plan
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Treatment plan ID is required" },
        { status: 400 },
      );
    }

    // First, get the treatment plan to check if it exists and get survey_answers_id
    const existingPlan = await prisma.diagnosisTreatmentPlan.findUnique({
      where: { id },
      select: {
        id: true,
        survey_answers_id: true,
        client_id: true,
        title: true,
      },
    });

    if (!existingPlan) {
      return NextResponse.json(
        { error: "Treatment plan not found" },
        { status: 404 },
      );
    }

    logger.info({
      message: "Deleting diagnosis treatment plan",
      planId: id,
      clientId: existingPlan.client_id,
      title: existingPlan.title,
      hasSurveyAnswers: !!existingPlan.survey_answers_id,
    });

    await prisma.$transaction(async (tx) => {
      // Delete diagnosis items first (due to foreign key constraint)
      await tx.diagnosisTreatmentPlanItem.deleteMany({
        where: { treatment_plan_id: id },
      });

      // Handle survey answers deletion properly
      let surveyAnswersToDelete: string | null = null;

      if (existingPlan.survey_answers_id) {
        // Check if this survey answer is used by other treatment plans or records
        const otherUsages = await tx.diagnosisTreatmentPlan.count({
          where: {
            survey_answers_id: existingPlan.survey_answers_id,
            id: { not: id },
          },
        });

        // Also check AppointmentNotes and ClientFiles that might reference this survey
        const appointmentNotesCount = await tx.appointmentNotes.count({
          where: { survey_answer_id: existingPlan.survey_answers_id },
        });

        const clientFilesCount = await tx.clientFiles.count({
          where: { survey_answers_id: existingPlan.survey_answers_id },
        });

        // Only mark for deletion if not referenced elsewhere
        if (
          otherUsages === 0 &&
          appointmentNotesCount === 0 &&
          clientFilesCount === 0
        ) {
          surveyAnswersToDelete = existingPlan.survey_answers_id;
          logger.info({
            message: "Survey answers will be deleted",
            surveyAnswersId: existingPlan.survey_answers_id,
          });
        } else {
          logger.info({
            message: "Survey answers preserved due to other references",
            surveyAnswersId: existingPlan.survey_answers_id,
            otherPlanReferences: otherUsages,
            appointmentNotesReferences: appointmentNotesCount,
            clientFilesReferences: clientFilesCount,
          });
        }
      }

      // Remove the foreign key reference first by updating the treatment plan
      await tx.diagnosisTreatmentPlan.update({
        where: { id },
        data: { survey_answers_id: null },
      });

      // Now delete the treatment plan
      await tx.diagnosisTreatmentPlan.delete({
        where: { id },
      });

      // Finally, delete the survey answers if safe to do so
      if (surveyAnswersToDelete) {
        await tx.surveyAnswers.delete({
          where: { id: surveyAnswersToDelete },
        });

        logger.info({
          message: "Associated survey answers deleted",
          surveyAnswersId: surveyAnswersToDelete,
        });
      }

      logger.info({
        message: "Treatment plan deleted successfully",
        planId: id,
      });
    });

    return NextResponse.json({
      message: "Treatment plan deleted successfully",
    });
  } catch (error) {
    logger.error({
      message: "Error deleting diagnosis treatment plan:",
      error,
    });
    return NextResponse.json(
      {
        error: "Failed to delete treatment plan",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
