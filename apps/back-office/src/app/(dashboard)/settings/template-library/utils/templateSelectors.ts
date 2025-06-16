import { Template } from "../hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";

export const getScoredMeasures = (
  templates: Template[] | undefined,
): Template[] => {
  if (!templates) return [];
  return templates.filter(
    (template) => template.type === TemplateType.SCORED_MEASURES,
  );
};

export const getIntakeForms = (
  templates: Template[] | undefined,
): Template[] => {
  if (!templates) return [];
  return templates.filter(
    (template) => template.type === TemplateType.INTAKE_FORMS,
  );
};

export const getProgressNotes = (
  templates: Template[] | undefined,
): Template[] => {
  if (!templates) return [];
  return templates.filter(
    (template) => template.type === TemplateType.PROGRESS_NOTES,
  );
};

export const getDiagnosisPlans = (
  templates: Template[] | undefined,
): Template[] => {
  if (!templates) return [];
  return templates.filter(
    (template) => template.type === TemplateType.DIAGNOSIS_AND_TREATMENT_PLANS,
  );
};

export const getOtherDocuments = (
  templates: Template[] | undefined,
): Template[] => {
  if (!templates) return [];
  return templates.filter(
    (template) => template.type === TemplateType.OTHER_DOCUMENTS,
  );
};
