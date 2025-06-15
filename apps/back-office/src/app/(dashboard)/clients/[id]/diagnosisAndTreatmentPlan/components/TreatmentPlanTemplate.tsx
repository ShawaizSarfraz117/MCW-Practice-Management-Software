"use client";
import React, { useState, useEffect } from "react";
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
  Input,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@mcw/ui";
import { Pencil, FileText, AlertCircle } from "lucide-react";

import SignAndLockModal from "./SignAndLockModal";
import { useSurveyTemplates } from "../hooks/useSurveyTemplates";
import { useDiagnosisTreatmentPlans } from "../hooks/useDiagnosisTreatmentPlans";
import type { SurveyTemplate } from "../services/surveyTemplate.service";
import { fetchDiagnosis } from "@/(dashboard)/clients/services/client.service";

type Diagnosis = { code: string; description: string; id?: string };
type DiagnosisOption = { id: string; code: string; description: string };

interface TreatmentPlanTemplateProps {
  clientId?: string;
  planId?: string;
}

export default function TreatmentPlanTemplate({
  clientId,
  planId, // eslint-disable-line @typescript-eslint/no-unused-vars
}: TreatmentPlanTemplateProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("Shawaiz");
  const [credentials, setCredentials] = useState("LMFT");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SurveyTemplate | null>(null);

  // State for diagnosis rows
  const [diagnoses, setDiagnoses] = useState<Diagnosis[]>([
    { code: "", description: "" },
  ]);
  const [diagnosisOptions, setDiagnosisOptions] = useState<DiagnosisOption[]>(
    [],
  );
  const [openPopovers, setOpenPopovers] = useState<{ [key: number]: boolean }>(
    {},
  );
  const [searchTerms, setSearchTerms] = useState<{ [key: number]: string }>({});
  const [diagnosisInitialized, setDiagnosisInitialized] = useState(false);

  // Fetch diagnosis treatment plans for the client
  const {
    data: diagnosisPlans,
    isLoading: isDiagnosisLoading,
    error: diagnosisError,
  } = useDiagnosisTreatmentPlans(clientId || "");

  // Get the most recent diagnosis from the treatment plans
  const latestDiagnosis = diagnosisPlans?.[0];
  const diagnosisItems = latestDiagnosis?.DiagnosisTreatmentPlanItem || [];

  // For read-only display, we'll show the first diagnosis
  const selectedDiagnosis =
    diagnosisItems.length > 0
      ? {
          code: diagnosisItems[0].Diagnosis.code,
          description: diagnosisItems[0].Diagnosis.description,
          dateTime: latestDiagnosis.created_at
            ? new Date(latestDiagnosis.created_at).toLocaleString("en-US", {
                month: "2-digit",
                day: "2-digit",
                year: "numeric",
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
            : "No date available",
        }
      : null;

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

  // Load diagnosis options
  useEffect(() => {
    const loadDiagnoses = async () => {
      const [data, error] = await fetchDiagnosis();
      if (!error && data) {
        const diagnosisArray = Array.isArray(data) ? data : [];
        setDiagnosisOptions(diagnosisArray as DiagnosisOption[]);
      }
    };
    loadDiagnoses();
  }, []);

  // Initialize diagnosis fields with saved data when template is selected
  useEffect(() => {
    if (selectedTemplate && !diagnosisInitialized) {
      if (diagnosisItems.length > 0) {
        // Initialize with all saved diagnosis data
        const savedDiagnoses = diagnosisItems.map((item) => ({
          code: item.Diagnosis.code,
          description: item.Diagnosis.description,
          id: item.Diagnosis.id,
        }));
        setDiagnoses(savedDiagnoses);
      } else {
        // No saved data, keep empty row
        setDiagnoses([{ code: "", description: "" }]);
      }
      setDiagnosisInitialized(true);
    } else if (!selectedTemplate && diagnosisInitialized) {
      // Reset when template is deselected
      setDiagnosisInitialized(false);
      setDiagnoses([{ code: "", description: "" }]);
    }
  }, [selectedTemplate, diagnosisItems, diagnosisInitialized]);

  // Helper functions for diagnosis rows
  const updateDiagnosis = (idx: number, updates: Partial<Diagnosis>) => {
    setDiagnoses((prev) => {
      const newDiagnoses = [...prev];
      newDiagnoses[idx] = { ...newDiagnoses[idx], ...updates };
      return newDiagnoses;
    });
  };

  const addDiagnosis = () => {
    setDiagnoses((prev) => [...prev, { code: "", description: "" }]);
  };

  const removeDiagnosis = (idx: number) => {
    if (diagnoses.length > 1) {
      setDiagnoses((prev) => prev.filter((_, i) => i !== idx));
      // Clean up popover and search state
      setOpenPopovers((prev) => {
        const newState = { ...prev };
        delete newState[idx];
        return newState;
      });
      setSearchTerms((prev) => {
        const newState = { ...prev };
        delete newState[idx];
        return newState;
      });
    }
  };

  const handleDiagnosisSelect = (idx: number, diagnosis: DiagnosisOption) => {
    updateDiagnosis(idx, {
      code: diagnosis.code,
      description: diagnosis.description,
      id: diagnosis.id,
    });
    // Close popover and clear search
    setOpenPopovers((prev) => ({ ...prev, [idx]: false }));
    setSearchTerms((prev) => ({ ...prev, [idx]: "" }));
  };

  const filteredOptions = (idx: number) => {
    const term = searchTerms[idx] || "";
    if (!term) return diagnosisOptions.slice(0, 10);

    return diagnosisOptions
      .filter(
        (option) =>
          option.code.toLowerCase().includes(term.toLowerCase()) ||
          option.description.toLowerCase().includes(term.toLowerCase()),
      )
      .slice(0, 20);
  };

  return (
    <div className="mt-6 w-full max-w-full">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-8 bg-white border-b pb-4">
        <h1 className="text-xl font-medium text-gray-900">
          Diagnosis and treatment plan
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

      {/* Content Area */}
      <div className="bg-white p-6">
        {/* Diagnosis Section - Read-only display when no template is selected */}
        {!selectedTemplate && isDiagnosisLoading ? (
          <div className="mb-6">
            <div className="text-sm text-gray-500 py-3">
              Loading diagnosis information...
            </div>
          </div>
        ) : !selectedTemplate && diagnosisError ? (
          <div className="mb-6">
            <div className="text-sm text-red-600 py-3">
              Error loading diagnosis information
            </div>
          </div>
        ) : !selectedTemplate && selectedDiagnosis ? (
          <div className="mb-6">
            <div className="flex items-center gap-16 py-3 border-b border-gray-100">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Diagnosis
                </div>
                <div className="text-sm text-gray-700">
                  {selectedDiagnosis.code} - {selectedDiagnosis.description}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-16 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-gray-900 mb-1">
                  Date and time
                </div>
                <div className="text-sm text-gray-700">
                  {selectedDiagnosis.dateTime}
                </div>
              </div>
            </div>
          </div>
        ) : !selectedTemplate ? (
          <div className="mb-6">
            <div className="text-sm text-gray-500 py-3">
              No diagnosis information available
            </div>
          </div>
        ) : null}

        {/* Diagnosis Fields Section - Only visible when template is selected */}
        {selectedTemplate && (
          <div className="mb-6">
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-900 mb-2">
                Diagnosis Information
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Add diagnosis codes for this treatment plan.
              </p>
            </div>

            {/* Table header */}
            <div className="flex gap-2 mb-2 max-w-4xl">
              <div className="w-48">
                <span className="text-sm font-medium text-gray-700">
                  Diagnosis code
                </span>
              </div>
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700">
                  Description
                </span>
              </div>
              <div className="w-20"></div>
            </div>

            {/* Diagnosis rows */}
            <div className="space-y-2 mb-6">
              {diagnoses.map((diag, idx) => (
                <div
                  key={`diagnosis-${idx}-${diag.code || "empty"}`}
                  className="flex gap-2 items-start"
                >
                  <div className="w-48">
                    <Popover
                      open={openPopovers[idx] || false}
                      onOpenChange={(open) =>
                        setOpenPopovers((prev) => ({ ...prev, [idx]: open }))
                      }
                    >
                      <PopoverTrigger asChild>
                        <button
                          type="button"
                          className="w-full h-10 px-3 text-left border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d8467] flex items-center justify-between"
                        >
                          <span
                            className={
                              diag.code ? "text-gray-900" : "text-gray-400"
                            }
                          >
                            {diag.code || "Search"}
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[400px] p-0">
                        <div className="flex flex-col">
                          <div className="px-3 py-2 border-b">
                            <input
                              type="text"
                              className="w-full px-2 py-1 text-sm outline-none"
                              placeholder="Type here to search through 1000's of ICD-10 codes"
                              value={searchTerms[idx] || ""}
                              onChange={(e) => {
                                setSearchTerms((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value,
                                }));
                              }}
                              autoFocus
                            />
                          </div>
                          <div className="max-h-64 overflow-y-auto">
                            {filteredOptions(idx).length === 0 ? (
                              <div className="px-3 py-2 text-sm text-gray-500">
                                No diagnosis found.
                              </div>
                            ) : (
                              filteredOptions(idx).map((option) => (
                                <button
                                  key={option.id}
                                  type="button"
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  onClick={() => {
                                    handleDiagnosisSelect(idx, option);
                                  }}
                                >
                                  <div className="flex items-center">
                                    <span className="font-medium">
                                      {option.code}
                                    </span>
                                    <span className="ml-2 text-gray-600 truncate">
                                      - {option.description}
                                    </span>
                                  </div>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex-1">
                    <Input
                      className="w-full h-10"
                      placeholder="None Selected"
                      value={diag.description || ""}
                      onChange={(e) =>
                        updateDiagnosis(idx, { description: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex gap-1 items-center pt-1">
                    <Button
                      aria-label="Add diagnosis"
                      className="p-0 h-6 w-6 text-[#2d8467]"
                      type="button"
                      variant="ghost"
                      onClick={addDiagnosis}
                    >
                      +
                    </Button>
                    <Button
                      aria-label="Remove diagnosis"
                      className="p-0 h-6 w-6 text-gray-400"
                      disabled={diagnoses.length === 1}
                      type="button"
                      variant="ghost"
                      onClick={() => removeDiagnosis(idx)}
                    >
                      <svg
                        fill="none"
                        height="16"
                        viewBox="0 0 24 24"
                        width="16"
                      >
                        <path
                          d="M6 19a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V7H6v12ZM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4Z"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                        />
                      </svg>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Treatment Plan Template Section */}
        <div className="mb-6 border-t pt-6">
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-900 block mb-3">
              Select a treatment plan template
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
              <SelectTrigger className="w-full max-w-md border border-gray-300 rounded h-10 px-3 text-sm">
                <SelectValue
                  placeholder={
                    isLoading ? "Loading templates..." : "Choose one"
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

              {/* Action Buttons */}
              <div className="mt-4 flex justify-end gap-2">
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
                  className="text-white px-6 text-sm shadow-sm"
                  style={{ backgroundColor: "rgb(45, 132, 103)" }}
                  onClick={() => {
                    // Handle save action with diagnoses
                    console.log(
                      "Save clicked with template:",
                      selectedTemplate,
                    );
                    console.log(
                      "Diagnoses:",
                      diagnoses.filter((d) => d.code || d.description),
                    );
                  }}
                >
                  Save
                </Button>
              </div>
            </div>
          )}
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
}
