import { v4 as uuidv4 } from "uuid";
import { readFileSync } from "fs";
import { join } from "path";

export async function seedSurveys(prisma) {
  console.log("Seeding survey templates...");

  const surveyFiles = [
    { filename: "ARM-5.json", name: "ARM-5 (Agnew Relationship Measure – 5)" , type: "scored_measures" , is_default: false },
    { filename: "GAD-7.json", name: "GAD-7 (Generalized Anxiety Disorder)" , type: "scored_measures" , is_default: false },
    { filename: "PHQ-9.json", name: "PHQ-9 (Patient Health Questionnaire)" , type: "scored_measures" , is_default: false },
    { filename: "Biopsychosocial Assessment.json", name: "Biopsychosocial Assessment & SOAP" , type: "progress_notes" , is_default: false },
    { filename: "COVID-19 Pre-Appointment Screening Questionnaire.json", name: "COVID-19 Pre-Appointment Screening Questionnaire" , type: "intake_forms" , is_default: false},
    { filename: "Consent for Minor Usage of Software Services.json", name: "Consent for Minor Usage of Software Services" , type: "intake_forms" , is_default: false },
    { filename: "Group Therapy Progress Note.json", name: "Group Therapy Progress Note" , type: "progress_notes" , is_default: false   },
    { filename: "Release of Information Consent.json", name: "Release of Information Consent" , type: "intake_forms" , is_default: false },
    { filename: "Standard Intake Questionnaire Template.json", name: "Standard Intake Questionnaire Template" , type: "intake_forms" , is_default: true },
    { filename: "Standard Progress Note.json", name: "Standard Progress Note" , type: "progress_notes" , is_default: false },
    { filename: "Treatment Plan.json", name: "Treatment Plan & Goals Note" , type: "progress_notes" , is_default: false },
    { filename: "Release of Information.json", name: "Release of Information" , type: "other_documents" , is_default: false },
    { filename: "Mental Status Exam.json", name: "Mental Status Exam" , type: "mental_status_exam" , is_default: false },
    { filename: "Behavioral Health Treatment Plan.json", name: "Behavioral Health Treatment Plan" , type: "diagnosis_treatment_plan" , is_default: false }
  ];

  const surveysPath = join(process.cwd(), "../../apps/back-office/public/surveys");

  for (const survey of surveyFiles) {
    try {
      const filePath = join(surveysPath, survey.filename);
      const content = readFileSync(filePath, "utf8");

      await prisma.surveyTemplate.create({
        data: {
          id: uuidv4(),
          name: survey.name,
          content: content,
          type: survey.type,
          is_shareable: true,
          is_default: survey.is_default,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      console.log(`Created survey template: ${survey.name}`);
    } catch (error) {
      console.error(`Error creating survey template ${survey.name}:`, error.message);
    }
  }

  console.log("Survey templates seeding completed.");
}