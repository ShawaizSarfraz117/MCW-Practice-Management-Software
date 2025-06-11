"use client";

import React from "react";
import {
  useTemplates,
  useDuplicateTemplate,
  useUpdateTemplate,
  Template,
} from "./hooks/useTemplates";
import { TemplateSection } from "./components/TemplateSection";
import { DocumentFormatSection } from "./components/DocumentFormatSection";
import {
  getScoredMeasures,
  getIntakeForms,
  getProgressNotes,
  getDiagnosisPlans,
  getOtherDocuments,
} from "./utils/templateSelectors";

export default function TemplateLibraryPage() {
  const { data, isLoading } = useTemplates({
    is_active: true,
  });

  const duplicateTemplate = useDuplicateTemplate();
  const updateTemplate = useUpdateTemplate();

  const handleDuplicateTemplate = (template: Template) => {
    duplicateTemplate.mutate(template);
  };

  const handleShareableChange = (template: Template, checked: boolean) => {
    updateTemplate.mutate({
      id: template.id,
      is_shareable: checked,
    });
  };

  const templates = data?.data || [];
  const scoredMeasures = getScoredMeasures(templates);
  const intakeForms = getIntakeForms(templates);
  const progressNotes = getProgressNotes(templates);
  const diagnosisPlans = getDiagnosisPlans(templates);
  const otherDocuments = getOtherDocuments(templates);

  if (isLoading) {
    return (
      <div className="h-[calc(100vh-4rem)] flex items-center justify-center">
        <p>Loading templates...</p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:none]">
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-gray-900">
            Template Library
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Organize the documentation templates used by your practice
          </p>
        </div>

        <div className="space-y-6">
          <TemplateSection
            title="Scored measures"
            description="Use these templates to track client-reported symptoms and outcomes"
            templates={scoredMeasures}
            showBadge={true}
            onDuplicateTemplate={handleDuplicateTemplate}
            onShareableChange={handleShareableChange}
          />

          <TemplateSection
            title="Intake forms"
            description="Templates to gather information from clients via the Client Portal in"
            templates={intakeForms}
            showIntakeLink={true}
            onDuplicateTemplate={handleDuplicateTemplate}
            onShareableChange={handleShareableChange}
          />

          <TemplateSection
            title="Progress Notes / Session Notes"
            description="Templates to record the observations, interventions, and outcomes from each appointment"
            templates={progressNotes}
            onDuplicateTemplate={handleDuplicateTemplate}
            onShareableChange={handleShareableChange}
          />

          <TemplateSection
            title="Diagnosis and Treatment Plans"
            description="Templates to outline a client's plan of care"
            templates={diagnosisPlans}
            onDuplicateTemplate={handleDuplicateTemplate}
            onShareableChange={handleShareableChange}
          />

          <TemplateSection
            title="Other documents"
            description="Other templates relevant to treatment and clinical practice"
            templates={otherDocuments}
            onDuplicateTemplate={handleDuplicateTemplate}
            onShareableChange={handleShareableChange}
          />

          <DocumentFormatSection />
        </div>
      </div>
    </div>
  );
}
