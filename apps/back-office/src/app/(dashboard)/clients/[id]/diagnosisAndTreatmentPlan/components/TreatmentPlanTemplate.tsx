"use client";
import React, { useState } from "react";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  SurveyPreview,
} from "@mcw/ui";
import { Pencil, FileText, AlertCircle } from "lucide-react";

import SignAndLockModal from "./SignAndLockModal";
import { useSurveyTemplates } from "../hooks/useSurveyTemplates";
import type { SurveyTemplate } from "../services/surveyTemplate.service";

const TreatmentPlanTemplate: React.FC = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("Shawaiz");
  const [credentials, setCredentials] = useState("LMFT");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SurveyTemplate | null>(null);

  // Fetch survey templates with type "diagnosis_treatment_plan"
  const {
    data: templatesData,
    isLoading,
    error,
  } = useSurveyTemplates("diagnosis_treatment_plan", true);

  // Remove duplicates based on template name
  const uniqueTemplates = templatesData?.data
    ? templatesData.data.filter(
        (template, index, self) =>
          index ===
          self.findIndex((t: SurveyTemplate) => t.name === template.name),
      )
    : [];

  // Debug: Log if duplicates were found
  if (
    templatesData?.data &&
    templatesData.data.length > uniqueTemplates.length
  ) {
    console.log("Duplicate templates found:", {
      original: templatesData.data.length,
      unique: uniqueTemplates.length,
      templates: templatesData.data.map((t: SurveyTemplate) => ({
        id: t.id,
        name: t.name,
      })),
    });
  }

  return (
    <div className="mt-6 w-full max-w-full">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Diagnosis and Treatment Plan
        </h1>
        <div className="flex gap-2 flex-wrap">
          <Button
            className="flex items-center gap-1 text-sm font-medium hover:bg-gray-100"
            variant="ghost"
            size="sm"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-1 text-sm font-medium hover:bg-gray-100"
                variant="ghost"
                size="sm"
              >
                More
                <svg
                  fill="none"
                  height="16"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  width="16"
                >
                  <path
                    d="M12 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M19 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                  <path
                    d="M5 16a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem>Print</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem className="text-red-600">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm"
            onClick={() => setModalOpen(true)}
            size="sm"
          >
            Sign
          </Button>
        </div>
      </div>

      {/* Diagnosis Card */}
      <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-sm hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
            <div className="text-lg font-semibold text-gray-900">Diagnosis</div>
          </div>
          <div className="text-gray-500 italic">None Selected</div>
        </div>
      </div>

      {/* Treatment Plan Template Section */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="p-8">
          <div className="mb-6">
            <label className="text-lg font-semibold text-gray-900 block mb-3">
              Select a Treatment Plan Template
            </label>
            <Select
              value={selectedTemplate?.id || ""}
              onValueChange={(value) => {
                const template = uniqueTemplates.find(
                  (t: SurveyTemplate) => t.id === value,
                );
                setSelectedTemplate(template || null);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full border-2 border-gray-200 rounded-lg h-12 px-4 text-base hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all">
                <SelectValue
                  placeholder={
                    isLoading ? "Loading templates..." : "Choose a template"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {error && (
                  <SelectItem value="error" disabled className="text-red-600">
                    Unable to load templates. Please try again later.
                  </SelectItem>
                )}
                {!isLoading && !error && uniqueTemplates.length === 0 && (
                  <SelectItem
                    value="no-templates"
                    disabled
                    className="text-gray-500 italic"
                  >
                    No treatment plan templates available
                  </SelectItem>
                )}
                {uniqueTemplates.map((template: SurveyTemplate) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Survey Preview Section */}
          {selectedTemplate && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <FileText className="h-5 w-5 text-gray-700 flex-shrink-0" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                  Template Preview: {selectedTemplate.name}
                </h3>
              </div>
              <div className="min-h-[400px] sm:min-h-[500px] max-h-[600px] sm:max-h-[700px] overflow-y-auto border-2 border-gray-200 rounded-lg bg-gradient-to-br from-gray-50 to-white">
                <div className="p-4 sm:p-6 lg:p-8">
                  {(() => {
                    // Ensure content is a string for SurveyPreview
                    let contentString = "";

                    try {
                      if (typeof selectedTemplate.content === "string") {
                        contentString = selectedTemplate.content;
                      } else if (
                        selectedTemplate.content &&
                        typeof selectedTemplate.content === "object"
                      ) {
                        contentString = JSON.stringify(
                          selectedTemplate.content,
                        );
                      }

                      if (
                        !contentString ||
                        contentString === "{}" ||
                        contentString === "null"
                      ) {
                        return (
                          <div className="flex flex-col items-center justify-center py-12">
                            <FileText className="h-12 w-12 text-gray-400 mb-3" />
                            <p className="text-gray-500 text-base font-medium">
                              No preview available for this template
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                              Template content is empty or not configured
                            </p>
                          </div>
                        );
                      }

                      return (
                        <SurveyPreview
                          content={contentString}
                          mode="display"
                          showInstructions={false}
                          title={selectedTemplate.name}
                          type={selectedTemplate.type}
                        />
                      );
                    } catch (error) {
                      console.error("Error preparing template content:", error);
                      return (
                        <div className="flex flex-col items-center justify-center py-12">
                          <AlertCircle className="h-12 w-12 text-red-400 mb-3" />
                          <p className="text-gray-600 text-base font-medium">
                            Error loading template preview
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Unable to display the template content
                          </p>
                        </div>
                      );
                    }
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="px-4 border-gray-300 hover:bg-gray-50 text-sm"
                onClick={() => {
                  // Handle cancel action
                  console.log("Cancel clicked");
                  setSelectedTemplate(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={() => {
                  // Handle save action
                  console.log("Save clicked with template:", selectedTemplate);
                }}
                disabled={!selectedTemplate}
              >
                Save
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SignAndLockModal
        credentials={credentials}
        name={name}
        open={modalOpen}
        setCredentials={setCredentials}
        setName={setName}
        onOpenChange={setModalOpen}
        onSign={() => {
          // handle sign and lock logic here
          setModalOpen(false);
        }}
      />
    </div>
  );
};

export default TreatmentPlanTemplate;
