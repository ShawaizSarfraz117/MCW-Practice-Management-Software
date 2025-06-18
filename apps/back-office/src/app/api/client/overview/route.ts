/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getClinicianInfo } from "@/utils/helpers";
import { withErrorHandling } from "@mcw/utils";

// Document response type
interface ClientDocument {
  id: string;
  documentType: string;
  title: string;
  date: Date;
  status: string;
  clientName: string;
  clientId: string;
  clientGroupId: string;
  clientGroupName: string;
  content?: string;
  score?: string;
}

// Valid document types matching the dropdown filter
type DocumentType =
  | "appointments"
  | "chart_notes"
  | "diagnosis_and_treatment_plans"
  | "good_faith_estimate"
  | "mental_status_exams"
  | "scored_measures"
  | "questionnaires"
  | "other_documents";

// GET - Retrieve client documents overview
export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const clientGroupId = searchParams.get("clientGroupId");
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const itemType = searchParams.get("itemType") as DocumentType | "all" | null;
  const page = parseInt(searchParams.get("page") || "1", 10);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const skip = (page - 1) * limit;

  // Get clinician info for filtering
  const { clinicianId } = await getClinicianInfo();

  // Build date filter conditions
  let dateCondition = "";
  if (startDate) {
    const parsedStartDate = new Date(startDate);
    if (!isNaN(parsedStartDate.getTime())) {
      if (dateCondition) dateCondition += " AND ";
      dateCondition += `date >= '${parsedStartDate.toISOString()}'`;
    }
  }
  if (endDate) {
    const parsedEndDate = new Date(endDate);
    if (!isNaN(parsedEndDate.getTime())) {
      // Set to end of day
      parsedEndDate.setHours(23, 59, 59, 999);
      if (dateCondition) dateCondition += " AND ";
      dateCondition += `date <= '${parsedEndDate.toISOString()}'`;
    }
  }

  // Build client group filter condition - REQUIRED
  if (!clientGroupId) {
    return NextResponse.json(
      { error: "clientGroupId is required" },
      { status: 400 },
    );
  }

  // Validate clientGroupId is a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(clientGroupId)) {
    return NextResponse.json(
      { error: "Invalid clientGroupId format" },
      { status: 400 },
    );
  }

  const clientGroupCondition = `clientGroupId = '${clientGroupId}'`;

  // Build clinician filter condition for appointments
  let clinicianCondition = "";
  if (clinicianId && uuidRegex.test(clinicianId)) {
    clinicianCondition = `clinicianId = '${clinicianId}'`;
  }

  // Build queries based on itemType
  const unionQueries: string[] = [];

  // Helper to add a query if the type matches
  const shouldIncludeType = (type: DocumentType) => {
    return !itemType || itemType === "all" || itemType === type;
  };

  // 1. Appointments with progress notes
  if (shouldIncludeType("appointments")) {
    unionQueries.push(`
      SELECT 
        a.id,
        'appointments' as documentType,
        COALESCE(a.title, 'Appointment') as title,
        a.start_date as date,
        a.status,
        cg.name as clientName,
        a.client_group_id as clientId,
        a.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        a.clinician_id as clinicianId,
        (
          SELECT STRING_AGG(
            JSON_VALUE(CAST(sa.content AS NVARCHAR(MAX)), '$.sections[0].questions[0].answer'), 
            ' | '
          )
          FROM "SurveyAnswers" sa
          WHERE sa.appointment_id = a.id
            AND sa.status = 'COMPLETED'
        ) as content,
        NULL as score
      FROM "Appointment" a
      INNER JOIN "ClientGroup" cg ON a.client_group_id = cg.id
      WHERE a.type = 'APPOINTMENT'
    `);
  }

  // 2. Chart Notes
  if (shouldIncludeType("chart_notes")) {
    unionQueries.push(`
      SELECT 
        cn.id,
        'chart_notes' as documentType,
        'Chart Note' as title,
        cn.note_date as date,
        'COMPLETED' as status,
        cg.name as clientName,
        cn.client_group_id as clientId,
        cn.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        cn.text as content,
        NULL as score
      FROM "ClientGroupChartNote" cn
      INNER JOIN "ClientGroup" cg ON cn.client_group_id = cg.id
    `);
  }

  // 3. Diagnosis and Treatment Plans
  if (shouldIncludeType("diagnosis_and_treatment_plans")) {
    unionQueries.push(`
      SELECT 
        dtp.id,
        'diagnosis_and_treatment_plans' as documentType,
        dtp.title,
        dtp.created_at as date,
        CASE WHEN dtp.is_signed = '1' THEN 'SIGNED' ELSE 'UNSIGNED' END as status,
        cg.name as clientName,
        dtp.client_group_id as clientId,
        dtp.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        CAST(sa.content AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "DiagnosisTreatmentPlan" dtp
      INNER JOIN "ClientGroup" cg ON dtp.client_group_id = cg.id
      LEFT JOIN "SurveyAnswers" sa ON dtp.survey_answers_id = sa.id
    `);
  }

  // 4. Good Faith Estimates
  if (shouldIncludeType("good_faith_estimate")) {
    unionQueries.push(`
      SELECT 
        gfe.id,
        'good_faith_estimate' as documentType,
        'Good Faith Estimate' as title,
        gfe.created_at as date,
        'COMPLETED' as status,
        cg.name as clientName,
        gfe.client_group_id as clientId,
        gfe.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        gfe.clinician_id as clinicianId,
        CAST(gfe.total_cost AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "GoodFaithEstimate" gfe
      INNER JOIN "ClientGroup" cg ON gfe.client_group_id = cg.id
    `);
  }

  // 5. Mental Status Exams (SurveyAnswers with specific template type)
  if (shouldIncludeType("mental_status_exams")) {
    unionQueries.push(`
      SELECT 
        sa.id,
        'mental_status_exams' as documentType,
        st.name as title,
        sa.created_at as date,
        sa.status,
        cg.name as clientName,
        sa.client_group_id as clientId,
        sa.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        CAST(sa.content AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "SurveyAnswers" sa
      INNER JOIN "SurveyTemplate" st ON sa.template_id = st.id
      INNER JOIN "ClientGroup" cg ON sa.client_group_id = cg.id
      WHERE (st.name LIKE '%Mental Status Exam%'
         OR (st.type = 'ASSESSMENT' AND st.name LIKE '%MSE%'))
    `);
  }

  // 6. Scored Measures (SurveyAnswers with scoring templates)
  if (shouldIncludeType("scored_measures")) {
    unionQueries.push(`
      SELECT 
        sa.id,
        'scored_measures' as documentType,
        st.name as title,
        sa.created_at as date,
        sa.status,
        cg.name as clientName,
        sa.client_group_id as clientId,
        sa.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        CAST(sa.content AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "SurveyAnswers" sa
      INNER JOIN "SurveyTemplate" st ON sa.template_id = st.id
      INNER JOIN "ClientGroup" cg ON sa.client_group_id = cg.id
      WHERE st.type = 'scored_measures'
    `);
  }

  // 7. Questionnaires (Intake forms)
  if (shouldIncludeType("questionnaires")) {
    unionQueries.push(`
      SELECT 
        sa.id,
        'questionnaires' as documentType,
        st.name as title,
        sa.created_at as date,
        sa.status,
        cg.name as clientName,
        sa.client_group_id as clientId,
        sa.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        CAST(sa.content AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "SurveyAnswers" sa
      INNER JOIN "SurveyTemplate" st ON sa.template_id = st.id
      INNER JOIN "ClientGroup" cg ON sa.client_group_id = cg.id
      WHERE st.type = 'INTAKE' OR sa.is_intake = 1
    `);
  }

  // 8. Other Documents (Custom and Consent forms)
  if (shouldIncludeType("other_documents")) {
    unionQueries.push(`
      SELECT 
        sa.id,
        'other_documents' as documentType,
        st.name as title,
        sa.created_at as date,
        sa.status,
        cg.name as clientName,
        sa.client_group_id as clientId,
        sa.client_group_id as clientGroupId,
        cg.name as clientGroupName,
        NULL as clinicianId,
        CAST(sa.content AS NVARCHAR(MAX)) as content,
        NULL as score
      FROM "SurveyAnswers" sa
      INNER JOIN "SurveyTemplate" st ON sa.template_id = st.id
      INNER JOIN "ClientGroup" cg ON sa.client_group_id = cg.id
      WHERE st.type IN ('CUSTOM', 'CONSENT')
        AND sa.is_intake = 0
        AND st.name NOT LIKE '%Mental Status Exam%'
        AND st.name NOT LIKE '%PHQ%' 
        AND st.name NOT LIKE '%GAD%' 
        AND st.name NOT LIKE '%ARM%'
    `);
  }

  // If no queries were built, return empty result
  if (unionQueries.length === 0) {
    return NextResponse.json({
      data: [],
      pagination: {
        page,
        limit,
        total: 0,
        totalPages: 0,
      },
    });
  }

  // Build the union query
  const unionQuery = unionQueries.join("\n\nUNION ALL\n\n");

  // Combine all filter conditions (clientGroupCondition is always present)
  let whereConditions = [clientGroupCondition, dateCondition]
    .filter(Boolean)
    .join(" AND ");

  // Add clinician condition only for appointments and good faith estimates
  if (
    clinicianCondition &&
    (shouldIncludeType("appointments") ||
      shouldIncludeType("good_faith_estimate"))
  ) {
    if (whereConditions) {
      whereConditions = `(${whereConditions}) AND (documentType NOT IN ('appointments', 'good_faith_estimate') OR ${clinicianCondition})`;
    } else {
      whereConditions = `(documentType NOT IN ('appointments', 'good_faith_estimate') OR ${clinicianCondition})`;
    }
  }

  if (whereConditions) {
    whereConditions = `WHERE ${whereConditions}`;
  }

  // Count query to get total results without pagination
  const countQuery = `
    SELECT COUNT(*) as total FROM (
      ${unionQuery}
    ) as documents
    ${whereConditions}
  `;

  // Main query with filtering, sorting and pagination
  const mainQuery = `
    SELECT * FROM (
      ${unionQuery}
    ) as documents
    ${whereConditions}
    ORDER BY date DESC
    OFFSET ${skip} ROWS
    FETCH NEXT ${limit} ROWS ONLY
  `;

  // Execute the count query
  const countResult =
    await prisma.$queryRawUnsafe<[{ total: number }]>(countQuery);
  const total = Number(countResult[0]?.total || 0);

  // Execute the main query
  const documents = await prisma.$queryRawUnsafe<ClientDocument[]>(mainQuery);

  return NextResponse.json({
    data: documents,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// DELETE - Delete a document by ID and type
export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const documentId = searchParams.get("documentId");
  const documentType = searchParams.get("documentType") as DocumentType;

  if (!documentId) {
    return NextResponse.json(
      { error: "documentId is required" },
      { status: 400 },
    );
  }

  if (!documentType) {
    return NextResponse.json(
      { error: "documentType is required" },
      { status: 400 },
    );
  }

  // Validate documentId is a valid UUID
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(documentId)) {
    return NextResponse.json(
      { error: "Invalid documentId format" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    switch (documentType) {
      case "good_faith_estimate":
        // Delete child records first
        await tx.goodFaithClients.deleteMany({
          where: { good_faith_id: documentId },
        });
        await tx.goodFaithServices.deleteMany({
          where: { good_faith_id: documentId },
        });
        // Delete main record
        await tx.goodFaithEstimate.delete({
          where: { id: documentId },
        });
        break;

      case "diagnosis_and_treatment_plans": {
        // First get the record to check for survey_answers_id
        const diagnosisPlan = await tx.diagnosisTreatmentPlan.findUnique({
          where: { id: documentId },
          select: { survey_answers_id: true },
        });

        if (!diagnosisPlan) {
          throw new Error("Diagnosis treatment plan not found");
        }

        // Delete main record first
        await tx.diagnosisTreatmentPlan.delete({
          where: { id: documentId },
        });

        // If there's a survey_answers_id, delete the survey answer
        if (diagnosisPlan.survey_answers_id) {
          await tx.surveyAnswers.delete({
            where: { id: diagnosisPlan.survey_answers_id },
          });
        }
        break;
      }

      case "chart_notes":
        // Delete chart note
        await tx.clientGroupChartNote.delete({
          where: { id: documentId },
        });
        break;

      case "mental_status_exams":
      case "scored_measures":
      case "questionnaires":
      case "other_documents":
        // These are all SurveyAnswers records
        await tx.surveyAnswers.delete({
          where: { id: documentId },
        });
        break;

      case "appointments":
        return NextResponse.json(
          { error: "Appointments cannot be deleted through this endpoint" },
          { status: 400 },
        );

      default:
        return NextResponse.json(
          { error: "Invalid document type" },
          { status: 400 },
        );
    }
  });

  return NextResponse.json({ success: true });
});
