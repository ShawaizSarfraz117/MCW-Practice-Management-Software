"use client";
import React, { useState, useEffect, useRef } from "react";
import type { Model } from "survey-core";
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
  toast,
} from "@mcw/ui";
import { Pencil, FileText, AlertCircle } from "lucide-react";

import SignAndLockModal from "./SignAndLockModal";
import { useSurveyTemplates } from "../hooks/useSurveyTemplates";
import { useDiagnosisTreatmentPlans } from "../hooks/useDiagnosisTreatmentPlans";
import type { SurveyTemplate } from "../services/surveyTemplate.service";
import { fetchDiagnosis } from "@/(dashboard)/clients/services/client.service";
import { useRouter, useParams } from "next/navigation";
import { showErrorToast } from "@mcw/utils";

type Diagnosis = { code: string; description: string; id?: string };
type DiagnosisOption = { id: string; code: string; description: string };

interface TreatmentPlanTemplateProps {
  clientId?: string;
  planId?: string;
}

function TreatmentPlanTemplate({
  clientId,
  planId,
}: TreatmentPlanTemplateProps) {
  const router = useRouter();
  const params = useParams();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("Shawaiz");
  const [credentials, setCredentials] = useState("LMFT");
  const [selectedTemplate, setSelectedTemplate] =
    useState<SurveyTemplate | null>(null);
  const [surveyAnswers, setSurveyAnswers] = useState<Record<string, unknown>>(
    {},
  );
  const [isSaving, setIsSaving] = useState(false);
  const surveyModelRef = useRef<Model | null>(null);

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
  const [loadedSurveyData, setLoadedSurveyData] = useState<Record<
    string,
    unknown
  > | null>(null);
  const [loadedTemplateId, setLoadedTemplateId] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Store original data for cancel functionality
  const [originalDiagnoses, setOriginalDiagnoses] = useState<Diagnosis[]>([]);
  const [originalTemplate, setOriginalTemplate] = useState<SurveyTemplate | null>(null);
  const [originalSurveyData, setOriginalSurveyData] = useState<Record<string, unknown> | null>(null);

  // Callback for survey completion
  const handleSurveyComplete = (answers: Record<string, unknown>) => {
    // Keep original data types to preserve checkbox states
    setSurveyAnswers(answers);
  };

  // Callback for when survey value changes
  const handleSurveyValueChanged = (name: string, value: unknown) => {
    console.log("=== DEBUG: Survey value changed ===");
    console.log("Field name:", name);
    console.log("New value:", value);
    console.log("Value type:", typeof value);
    
    // Update survey answers state - preserve original types
    setSurveyAnswers(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Get current survey data from the model
  const getCurrentSurveyData = () => {
    console.log("=== DEBUG: Getting current survey data ===");
    console.log("surveyModelRef.current exists:", !!surveyModelRef.current);
    console.log("surveyModelRef.current?.data:", surveyModelRef.current?.data);
    console.log("loadedSurveyData:", loadedSurveyData);
    console.log("surveyAnswers state:", surveyAnswers);
    
    if (surveyModelRef.current && surveyModelRef.current.data) {
      const modelData = surveyModelRef.current.data;
      console.log("Survey model has data:", modelData);
      console.log("Type of model data:", typeof modelData);
      console.log("Keys in model data:", Object.keys(modelData));

      // Return the data as-is to preserve types
      return modelData;
    }
    
    // If no model data but we have loaded survey data (edit mode), use it
    if (isEditMode && loadedSurveyData) {
      console.log("No survey model data but in edit mode, returning loadedSurveyData:", loadedSurveyData);
      return loadedSurveyData;
    }
    
    console.log("No survey model data, returning state:", surveyAnswers);
    return surveyAnswers;
  };

  // Fetch diagnosis treatment plans for the client
  const {
    data: diagnosisPlans,
    isLoading: isDiagnosisLoading,
    error: diagnosisError,
  } = useDiagnosisTreatmentPlans(clientId || "");

  // Load existing plan data if planId is provided
  useEffect(() => {
    const loadPlanData = async () => {
      if (planId) {
        try {
          console.log("=== DEBUG: Loading plan data for editing ===");
          console.log("planId:", planId);
          const response = await fetch(
            `/api/diagnosis-treatment-plan?planId=${planId}`,
          );
          if (response.ok) {
            const plan = await response.json();
            console.log("=== DEBUG: Full plan data loaded ===");
            console.log("Full plan object:", JSON.stringify(plan, null, 2));

            // Load existing diagnoses
            if (
              plan.DiagnosisTreatmentPlanItem &&
              plan.DiagnosisTreatmentPlanItem.length > 0
            ) {
              const loadedDiagnoses = plan.DiagnosisTreatmentPlanItem.map(
                (item: {
                  Diagnosis: { id: string; code: string; description: string };
                  custom_description: string | null;
                }) => ({
                  id: item.Diagnosis.id,
                  code: item.Diagnosis.code,
                  description:
                    item.custom_description || item.Diagnosis.description,
                }),
              );
              console.log("=== DEBUG: Loaded diagnoses ===", loadedDiagnoses);
              setDiagnoses(loadedDiagnoses);
              setOriginalDiagnoses(loadedDiagnoses); // Store original for cancel
              setDiagnosisInitialized(true);
            }

            // Load survey data if available
            if (plan.SurveyAnswers) {
              console.log("=== DEBUG: SurveyAnswers found ===");
              console.log("SurveyAnswers object:", plan.SurveyAnswers);
              console.log("Content type:", typeof plan.SurveyAnswers.content);
              console.log("Content value:", plan.SurveyAnswers.content);
              console.log("Template ID:", plan.SurveyAnswers.template_id);

              // Parse content if it's a string
              let content = plan.SurveyAnswers.content;
              if (typeof content === "string") {
                try {
                  console.log("=== DEBUG: Parsing string content ===");
                  content = JSON.parse(content);
                  console.log("Parsed content:", content);
                } catch (e) {
                  console.error("=== DEBUG: Failed to parse survey content ===", e);
                }
              }

              if (content && typeof content === "object") {
                console.log("=== DEBUG: Setting survey data states ===");
                console.log("Content to set:", content);
                const surveyDataToLoad = content as Record<string, unknown>;
                setLoadedSurveyData(surveyDataToLoad);
                setSurveyAnswers(surveyDataToLoad);
                setOriginalSurveyData(surveyDataToLoad); // Store original for cancel
                
                console.log("loadedSurveyData state will be:", surveyDataToLoad);
                console.log("surveyAnswers state will be:", surveyDataToLoad);
              }

              // Set the template ID if available
              if (plan.SurveyAnswers.template_id) {
                console.log("=== DEBUG: Setting template ID ===");
                console.log("Template ID to set:", plan.SurveyAnswers.template_id);
                setLoadedTemplateId(plan.SurveyAnswers.template_id);
              }
              
              // Mark as edit mode when we have survey data
              setIsEditMode(true);
            } else {
              console.log("=== DEBUG: No SurveyAnswers in plan ===");
            }
          } else {
            console.error("=== DEBUG: Response not OK ===", response.status);
          }
        } catch (error) {
          console.error("=== DEBUG: Error loading plan data ===", error);
        }
      }
    };

    loadPlanData();
  }, [planId]);

  // Get the most recent diagnosis from the treatment plans
  const latestDiagnosis = diagnosisPlans?.[0];
  const diagnosisItems = latestDiagnosis?.DiagnosisTreatmentPlanItem || [];

  // For read-only display, we'll show the first diagnosis
  const selectedDiagnosis =
    diagnosisItems.length > 0
      ? {
          code: diagnosisItems[0].Diagnosis.code,
          description: diagnosisItems[0].Diagnosis.description,
          dateTime: latestDiagnosis?.created_at
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

  // Select the loaded template when templates are available
  useEffect(() => {
    console.log("=== DEBUG: Template selection effect ===");
    console.log("loadedTemplateId:", loadedTemplateId);
    console.log("uniqueTemplates length:", uniqueTemplates.length);
    console.log("selectedTemplate:", selectedTemplate);
    console.log("loadedSurveyData:", loadedSurveyData);
    
    if (loadedTemplateId && uniqueTemplates.length > 0 && !selectedTemplate) {
      console.log("=== DEBUG: Looking for template ===");
      console.log("Looking for template with ID:", loadedTemplateId);
      console.log(
        "Available templates:",
        uniqueTemplates.map((t: SurveyTemplate) => ({
          id: t.id,
          name: t.name,
        })),
      );

      const template = uniqueTemplates.find(
        (t: SurveyTemplate) => t.id === loadedTemplateId,
      );
      if (template) {
        console.log("=== DEBUG: Auto-selecting template ===");
        console.log("Auto-selecting loaded template:", template);
        setSelectedTemplate(template);
        setOriginalTemplate(template); // Store original for cancel
      } else {
        console.log("=== DEBUG: Template not found ===");
        console.log("Template not found in available templates");
      }
    }
  }, [loadedTemplateId, uniqueTemplates, selectedTemplate, loadedSurveyData]);

  // Monitor loadedSurveyData changes - but don't update the model directly
  // Let the SurveyPreview component handle it through initialData prop
  useEffect(() => {
    console.log("=== DEBUG: loadedSurveyData changed ===");
    console.log("loadedSurveyData:", loadedSurveyData);
    console.log("isEditMode:", isEditMode);
    console.log("selectedTemplate:", selectedTemplate);
    
    // We don't need to manually update the survey model here
    // The SurveyPreview component will handle it through the initialData prop
  }, [loadedSurveyData, isEditMode, selectedTemplate]);

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

  // Initialize diagnosis fields with saved data when template is selected (only for new plans)
  useEffect(() => {
    if (selectedTemplate && !diagnosisInitialized && !planId) {
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
    } else if (!selectedTemplate && diagnosisInitialized && !planId) {
      // Reset when template is deselected (only for new plans)
      setDiagnosisInitialized(false);
      setDiagnoses([{ code: "", description: "" }]);
    }
  }, [selectedTemplate, diagnosisItems, diagnosisInitialized, planId]);

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
            size="sm"
            variant="ghost"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                className="flex items-center gap-1 text-sm font-medium hover:bg-gray-100"
                size="sm"
                variant="ghost"
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
            size="sm"
            onClick={() => setModalOpen(true)}
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
              <div className="w-20" />
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
                          className="w-full h-10 px-3 text-left border rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#2d8467] flex items-center justify-between"
                          type="button"
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
                              d="M19 9l-7 7-7-7"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                            />
                          </svg>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent align="start" className="w-[400px] p-0">
                        <div className="flex flex-col">
                          <div className="px-3 py-2 border-b">
                            <input
                              autoFocus
                              className="w-full px-2 py-1 text-sm outline-none"
                              placeholder="Type here to search through 1000's of ICD-10 codes"
                              type="text"
                              value={searchTerms[idx] || ""}
                              onChange={(e) => {
                                setSearchTerms((prev) => ({
                                  ...prev,
                                  [idx]: e.target.value,
                                }));
                              }}
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
                                  className="w-full px-3 py-2 text-left hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                                  type="button"
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
              disabled={isLoading}
              value={selectedTemplate?.id || ""}
              onValueChange={(value) => {
                const template = uniqueTemplates.find(
                  (t: SurveyTemplate) => t.id === value,
                );
                setSelectedTemplate(template || null);

                // Clear loaded survey data if user selects a different template
                // Only clear if we're in edit mode and changing from the loaded template
                if (
                  isEditMode &&
                  template &&
                  loadedTemplateId &&
                  template.id !== loadedTemplateId
                ) {
                  // Warn user about losing unsaved changes
                  const confirmChange = window.confirm(
                    "Changing the template will clear all current survey answers. Do you want to continue?"
                  );
                  
                  if (confirmChange) {
                    setLoadedSurveyData(null);
                    setSurveyAnswers({});
                    if (surveyModelRef.current) {
                      surveyModelRef.current.data = {};
                    }
                    console.log(
                      "Cleared survey data as user selected a different template",
                    );
                    // No longer in edit mode for the original data
                    setIsEditMode(false);
                  } else {
                    // Revert to the original template
                    setSelectedTemplate(originalTemplate);
                    return;
                  }
                }
              }}
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
                  <SelectItem disabled className="text-red-600" value="error">
                    Unable to load templates. Please try again later.
                  </SelectItem>
                )}
                {!isLoading && !error && uniqueTemplates.length === 0 && (
                  <SelectItem
                    disabled
                    className="text-gray-500 italic"
                    value="no-templates"
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

                      console.log("=== DEBUG: Rendering SurveyPreview ===");
                      console.log("contentString:", contentString);
                      console.log("selectedTemplate.id:", selectedTemplate?.id);
                      console.log("loadedTemplateId:", loadedTemplateId);
                      console.log("loadedSurveyData:", loadedSurveyData);
                      console.log("Condition check - loadedSurveyData exists:", !!loadedSurveyData);
                      console.log("Condition check - IDs match:", selectedTemplate?.id === loadedTemplateId);
                      
                      // Use loaded survey data if we're in edit mode and have data
                      const initialDataToPass = isEditMode && loadedSurveyData
                          ? loadedSurveyData
                          : undefined;
                      
                      console.log("=== DEBUG: Initial data decision ===");
                      console.log("isEditMode:", isEditMode);
                      console.log("loadedSurveyData exists:", !!loadedSurveyData);
                      console.log("initialData being passed:", initialDataToPass);
                      
                      return (
                        <SurveyPreview
                          content={contentString}
                          mode="edit"
                          modelRef={surveyModelRef}
                          showInstructions={true}
                          title={selectedTemplate.name}
                          type={selectedTemplate.type}
                          onComplete={handleSurveyComplete}
                          onValueChanged={handleSurveyValueChanged}
                          initialData={initialDataToPass}
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
                  className="px-4 border-gray-300 hover:bg-gray-50 text-sm"
                  disabled={isSaving}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (isEditMode && planId) {
                      // In edit mode, restore original data
                      console.log("=== DEBUG: Cancel in edit mode - restoring original data ===");
                      
                      // Restore diagnoses
                      if (originalDiagnoses.length > 0) {
                        setDiagnoses(originalDiagnoses);
                      } else {
                        setDiagnoses([{ code: "", description: "" }]);
                      }
                      
                      // Restore template
                      setSelectedTemplate(originalTemplate);
                      
                      // Restore survey data
                      if (originalSurveyData) {
                        setSurveyAnswers(originalSurveyData);
                        setLoadedSurveyData(originalSurveyData);
                        
                        // Update the survey model if it exists
                        if (surveyModelRef.current && surveyModelRef.current.setValue) {
                          Object.keys(originalSurveyData).forEach(key => {
                            const value = originalSurveyData[key];
                            let finalValue = value;
                            if (value === "true") finalValue = true;
                            else if (value === "false") finalValue = false;
                            else if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
                              try {
                                finalValue = JSON.parse(value);
                              } catch (_e) {
                                console.log("Failed to parse array string:", value);
                              }
                            }
                            surveyModelRef.current!.setValue(key, finalValue);
                          });
                        }
                      } else {
                        setSurveyAnswers({});
                        setLoadedSurveyData(null);
                      }
                      
                      // Navigate back to view page
                      router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan/view/${planId}`);
                    } else {
                      // For new plans, clear everything
                      console.log("=== DEBUG: Cancel for new plan - clearing all data ===");
                      setSelectedTemplate(null);
                      setSurveyAnswers({});
                      setLoadedSurveyData(null);
                      setDiagnoses([{ code: "", description: "" }]);
                      setDiagnosisInitialized(false);
                      
                      // Navigate back to client overview
                      router.push(`/clients/${params.id}`);
                    }
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="text-white px-6 text-sm shadow-sm"
                  disabled={isSaving}
                  size="sm"
                  style={{ backgroundColor: "rgb(45, 132, 103)" }}
                  variant="default"
                  onClick={async () => {
                    if (!clientId || !selectedTemplate) {
                      toast({
                        title: "Error",
                        description: "Missing required information",
                        variant: "destructive",
                      });
                      return;
                    }

                    setIsSaving(true);
                    try {
                      // Get current survey data
                      const currentSurveyData = getCurrentSurveyData();
                      console.log("Survey data being sent:", currentSurveyData);
                      console.log(
                        "Survey model ref data:",
                        surveyModelRef.current?.data,
                      );

                      // Prepare valid diagnoses
                      const validDiagnoses = diagnoses.filter(
                        (d) => d.code && d.id,
                      );

                      // If we have a planId, update the existing plan with survey data
                      const url = "/api/diagnosis-treatment-plan";
                      const method = planId ? "PUT" : "POST";

                      const requestBody: Record<string, unknown> = {
                        clientId,
                        clientGroupId: params.id as string,
                        title: "Diagnosis and Treatment Plan",
                        diagnoses: validDiagnoses,
                        surveyData: {
                          templateId: selectedTemplate.id,
                          content: currentSurveyData,
                        },
                      };

                      // Include id for PUT request
                      if (planId) {
                        requestBody.id = planId;
                      } else {
                        requestBody.dateTime = new Date().toISOString();
                      }

                      const response = await fetch(url, {
                        method,
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(requestBody),
                      });

                      if (!response.ok) {
                        const error = await response.json();
                        throw new Error(
                          error.error || "Failed to save treatment plan",
                        );
                      }

                      const result = await response.json();

                      toast({
                        title: "Success",
                        description: "Treatment plan saved successfully",
                      });

                      // Redirect to the view page
                      router.push(
                        `/clients/${params.id}/diagnosisAndTreatmentPlan/view/${result.id || planId}`,
                      );
                    } catch (error) {
                      showErrorToast(toast, error);
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                >
                  {isSaving ? "Saving..." : "Save"}
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

export default TreatmentPlanTemplate;
