"use client";

import React from "react";
import { Button, Badge } from "@mcw/ui";
import { Copy, FileText } from "lucide-react";
import { ViewTemplate } from "./components/ViewTemplate";
import { DeleteTemplateDialog } from "./components/DeleteTemplateDialog";
import {
  useTemplates,
  useDuplicateTemplate,
  useUpdateTemplate,
  Template,
} from "./hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";

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

  const getScoredMeasures = () => {
    if (!data?.data) return [];
    return data.data.filter(
      (template: Template) => template.type === TemplateType.SCORED_MEASURES,
    );
  };

  const getIntakeForms = () => {
    if (!data?.data) return [];
    return data.data.filter(
      (template: Template) => template.type === TemplateType.INTAKE_FORMS,
    );
  };

  const getProgressNotes = () => {
    if (!data?.data) return [];
    return data.data.filter(
      (template: Template) => template.type === TemplateType.PROGRESS_NOTES,
    );
  };

  const getDiagnosisPlans = () => {
    if (!data?.data) return [];
    return data.data.filter(
      (template: Template) =>
        template.type === TemplateType.DIAGNOSIS_AND_TREATMENT_PLANS,
    );
  };

  const getOtherDocuments = () => {
    if (!data?.data) return [];
    return data.data.filter(
      (template: Template) => template.type === TemplateType.OTHER_DOCUMENTS,
    );
  };

  const scoredMeasures: Template[] = !isLoading ? getScoredMeasures() : [];
  const intakeForms: Template[] = !isLoading ? getIntakeForms() : [];
  const progressNotes: Template[] = !isLoading ? getProgressNotes() : [];
  const diagnosisPlans: Template[] = !isLoading ? getDiagnosisPlans() : [];
  const otherDocuments: Template[] = !isLoading ? getOtherDocuments() : [];

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

        <div className="bg-white rounded-lg border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="max-w-[75%]">
              <h2 className="text-lg font-semibold text-gray-900">
                Expand your template library
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Find customizable, pre-built templates designed for your
                specialty or start with a blank canvas in the template builder
              </p>
              <div className="flex gap-3 mt-6">
                <Button
                  variant="default"
                  className="bg-green-700 hover:bg-green-800"
                >
                  Browse pre-built templates
                </Button>
                <Button variant="outline">Build new template</Button>
              </div>
            </div>
            <div className="w-24 h-24 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <FileText className="h-12 w-12 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold text-gray-900">
                Scored measures
              </h2>
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 hover:bg-orange-100"
              >
                New
              </Badge>
            </div>

            <p className="text-sm text-gray-600">
              Use these templates to track client-reported symptoms and outcomes
            </p>

            {scoredMeasures.length > 0 && (
              <div className="space-y-2">
                {scoredMeasures.map((template: Template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={template.is_shareable}
                        onChange={(e) =>
                          handleShareableChange(template, e.target.checked)
                        }
                        disabled={template.is_default}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                        {template.is_default && " (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ViewTemplate template={template} />
                      {!template.is_default && (
                        <DeleteTemplateDialog
                          id={template.id}
                          title={template.name}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Intake forms
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Templates to gather information from clients via the Client
                Portal in{" "}
                <a
                  href="/settings/shareable-documents"
                  className="text-blue-600 hover:text-blue-800"
                >
                  Shareable documents
                </a>
              </p>
            </div>

            {intakeForms.length > 0 && (
              <div className="space-y-2">
                {intakeForms.map((template: Template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={template.is_shareable}
                        onChange={(e) =>
                          handleShareableChange(template, e.target.checked)
                        }
                        disabled={template.is_default}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                        {template.is_default && " (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ViewTemplate template={template} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!template.is_default && (
                        <DeleteTemplateDialog
                          id={template.id}
                          title={template.name}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Progress Notes / Session Notes
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Templates to record the observations, interventions, and
                outcomes from each appointment
              </p>
            </div>

            {progressNotes.length > 0 && (
              <div className="space-y-2">
                {progressNotes.map((template: Template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={template.is_shareable}
                        onChange={(e) =>
                          handleShareableChange(template, e.target.checked)
                        }
                        disabled={template.is_default}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                        {template.is_default && " (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ViewTemplate template={template} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!template.is_default && (
                        <DeleteTemplateDialog
                          id={template.id}
                          title={template.name}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Diagnosis and Treatment Plans
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Templates to outline a client's plan of care
              </p>
            </div>

            {diagnosisPlans.length > 0 && (
              <div className="space-y-2">
                {diagnosisPlans.map((template: Template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={template.is_shareable}
                        onChange={(e) =>
                          handleShareableChange(template, e.target.checked)
                        }
                        disabled={template.is_default}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                        {template.is_default && " (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ViewTemplate template={template} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!template.is_default && (
                        <DeleteTemplateDialog
                          id={template.id}
                          title={template.name}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-gray-900">
                Other Documents
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                Templates for documentation that's not related to specific
                appointments
              </p>
            </div>

            {otherDocuments.length > 0 && (
              <div className="space-y-2">
                {otherDocuments.map((template: Template) => (
                  <div
                    key={template.id}
                    className="flex items-center justify-between py-3 px-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                        checked={template.is_shareable}
                        onChange={(e) =>
                          handleShareableChange(template, e.target.checked)
                        }
                        disabled={template.is_default}
                      />
                      <span className="text-sm font-medium text-gray-900">
                        {template.name}
                        {template.is_default && " (Default)"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ViewTemplate template={template} />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleDuplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4 text-gray-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                      </Button>
                      {!template.is_default && (
                        <DeleteTemplateDialog
                          id={template.id}
                          title={template.name}
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6 bg-white rounded-lg border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900">
              Standard client document format
            </h2>

            <div className="space-y-5">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="include-logo"
                  className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                <label htmlFor="include-logo" className="text-sm text-gray-900">
                  Include practice logo
                </label>
              </div>

              <div className="space-y-2.5">
                <label
                  htmlFor="footer-info"
                  className="block text-sm text-gray-900"
                >
                  Footer information
                </label>
                <textarea
                  id="footer-info"
                  rows={7}
                  className="block w-[600px] rounded-md border border-gray-200 text-sm p-2 text-gray-900 shadow-sm placeholder:text-gray-400 focus:border-green-500 focus:ring-green-500 resize-none"
                  placeholder="Information that will show in the footer of your billing documents goes here. The character limit is 120 characters."
                />
              </div>

              <div className="pt-2">
                <Button
                  variant="default"
                  className="bg-green-700 hover:bg-green-800"
                >
                  Save format
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
