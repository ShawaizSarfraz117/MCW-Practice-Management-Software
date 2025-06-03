"use client";

import { ConsentForms } from "./components/ConsentForms";
import { IntakeForm } from "./components/IntakeForm";
import {
  useShareableTemplates,
  getScoredMeasures,
  getIntakeForms,
  ShareableTemplate,
} from "./hooks/useShareableTemplates";
import { TemplateType } from "@/types/templateTypes";

export default function ShareableDocumentsPage() {
  const { data, isLoading, error } = useShareableTemplates();
  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p>Loading shareable documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p className="text-red-600">Error loading documents: {error.message}</p>
      </div>
    );
  }

  const templates = data?.data || [];

  // Filter templates by type
  const consentForms = templates
    .filter(
      (template: ShareableTemplate) =>
        template.type === TemplateType.OTHER_DOCUMENTS &&
        (template.name.toLowerCase().includes("consent") ||
          template.name.toLowerCase().includes("authorization") ||
          template.name.toLowerCase().includes("privacy") ||
          template.name.toLowerCase().includes("policies")),
    )
    .map((template: ShareableTemplate) => ({
      id: template.id,
      name: template.name,
      default: template.is_default,
      content: template.content,
    }));

  const scoredMeasures = getScoredMeasures(templates);
  const intakeForms = getIntakeForms(templates);

  return (
    <div className="space-y-8 h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Shareable Documents
        </h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage default intake documents and consent forms.
        </p>
      </div>

      {/* Consent Forms */}
      <ConsentForms forms={consentForms} />

      {/* Intake Forms */}
      <IntakeForm intakeForms={intakeForms} scoredMeasures={scoredMeasures} />
    </div>
  );
}
