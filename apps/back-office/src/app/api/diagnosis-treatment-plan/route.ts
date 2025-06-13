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

      // Only create diagnosis items if diagnosis_id is provided
      const diagnosisItems = diagnoses
        .filter((diag) => diag.id && diag.id.length > 0)
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

      // Return the created plan with its items
      return await tx.diagnosisTreatmentPlan.findUnique({
        where: { id: treatmentPlan.id },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
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
    const { id, title, diagnoses, surveyAnswersId } = data;

    if (!id) {
      return NextResponse.json(
        { error: "Treatment plan ID is required" },
        { status: 400 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update the treatment plan
      const treatmentPlan = await tx.diagnosisTreatmentPlan.update({
        where: { id },
        data: {
          title,
          client_group_id: data?.clientGroupId || null,
          survey_answers_id: surveyAnswersId,
          updated_at: new Date(),
        },
      });

      // Delete existing diagnosis items
      await tx.diagnosisTreatmentPlanItem.deleteMany({
        where: { treatment_plan_id: id },
      });

      // Create new diagnosis items
      const diagnosisItems = diagnoses
        .filter((diag: DiagnosisItem) => diag.id || diag.description)
        .map((diag: DiagnosisItem) => ({
          treatment_plan_id: treatmentPlan.id,
          diagnosis_id: diag.id || "",
          custom_description: !diag.id ? diag.description : null,
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
      return await tx.diagnosisTreatmentPlan.findUnique({
        where: { id: treatmentPlan.id },
        include: {
          DiagnosisTreatmentPlanItem: {
            include: {
              Diagnosis: true,
            },
          },
        },
      });
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

    await prisma.$transaction(async (tx) => {
      // Delete diagnosis items first (due to foreign key constraint)
      await tx.diagnosisTreatmentPlanItem.deleteMany({
        where: { treatment_plan_id: id },
      });

      // Delete the treatment plan
      await tx.diagnosisTreatmentPlan.delete({
        where: { id },
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
