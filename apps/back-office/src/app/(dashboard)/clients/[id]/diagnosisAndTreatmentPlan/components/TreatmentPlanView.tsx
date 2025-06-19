"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import { useRouter, useParams } from "next/navigation";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  toast,
} from "@mcw/ui";
import { Pencil } from "lucide-react";
import {
  fetchDiagnosisTreatmentPlanById,
  deleteDiagnosisTreatmentPlan,
} from "../services/diagnosisTreatmentPlan.service";
import { fetchSurveyAnswer } from "@/(dashboard)/clients/[id]/mentalStatusExam/services/surveyAnswer.service";
import { showErrorToast } from "@mcw/utils";
import DeleteConfirmDialog from "./DeleteConfirmDialog";
import type { DiagnosisTreatmentPlan } from "../services/diagnosisTreatmentPlan.service";

interface TreatmentPlanViewProps {
  planId: string;
  onEdit?: () => void;
  onSign?: () => void;
}

interface SurveyField {
  label: string;
  value: string;
  type?: "text" | "list" | "section";
}

export default function TreatmentPlanView({
  planId,
  onEdit,
  onSign,
}: TreatmentPlanViewProps) {
  const router = useRouter();
  const params = useParams();
  const clientGroupId = params.id as string;

  const [plan, setPlan] = useState<DiagnosisTreatmentPlan | null>(null);
  const [surveyData, setSurveyData] = useState<
    Record<string, string | string[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the treatment plan
        const planData = await fetchDiagnosisTreatmentPlanById(planId);
        setPlan(planData);

        // Debug logging
        console.log("Treatment plan data:", planData);
        console.log("Survey answers ID:", planData.survey_answers_id);
        console.log("Survey answers data:", planData.SurveyAnswers);

        // Check if survey data is included in the response
        if (planData.SurveyAnswers && planData.SurveyAnswers.content) {
          // Parse content if it's a string
          let content = planData.SurveyAnswers.content;
          if (typeof content === "string") {
            try {
              content = JSON.parse(content);
              console.log("Parsed survey content:", content);
            } catch (e) {
              console.error("Failed to parse survey content:", e);
            }
          }
          if (typeof content === "object" && content !== null) {
            setSurveyData(content as Record<string, string | string[]>);
          }
        } else if (planData.survey_answers_id) {
          console.log(
            "Fetching survey answer separately with ID:",
            planData.survey_answers_id,
          );
          // Fallback: fetch separately if not included
          const [surveyAnswer, surveyError] = await fetchSurveyAnswer({
            id: planData.survey_answers_id,
          });

          if (!surveyError && surveyAnswer && surveyAnswer.content) {
            console.log("Fetched survey answer:", surveyAnswer);
            // Parse content if it's a string
            let content = surveyAnswer.content;
            if (typeof content === "string") {
              try {
                content = JSON.parse(content);
                console.log(
                  "Parsed survey content from separate fetch:",
                  content,
                );
              } catch (e) {
                console.error("Failed to parse survey content:", e);
              }
            }
            if (typeof content === "object" && content !== null) {
              setSurveyData(content as Record<string, string | string[]>);
            }
          } else if (surveyError) {
            console.error("Error fetching survey answer:", surveyError);
          }
        } else {
          console.log("No survey data available for this treatment plan");
        }
      } catch (err) {
        console.error("Error loading treatment plan:", err);
        setError("Failed to load treatment plan");
      } finally {
        setIsLoading(false);
      }
    };

    if (planId) {
      loadPlanData();
    }
  }, [planId]);

  // Handle delete treatment plan
  const handleDelete = async () => {
    if (!plan) return;

    try {
      setIsDeleting(true);
      await deleteDiagnosisTreatmentPlan(planId);

      toast({
        title: "Success",
        description: "Treatment plan deleted successfully",
      });

      // Navigate back to the main client page
      router.push(`/clients/${clientGroupId}`);
    } catch (error) {
      console.error("Error deleting treatment plan:", error);
      showErrorToast(toast, error);
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
    }
  };

  // Transform survey data into display format
  const getSurveyFields = (): SurveyField[] => {
    const fields: SurveyField[] = [];

    // Debug: Log all available fields
    console.log("Available survey data fields:", Object.keys(surveyData));
    console.log("Survey data values:", surveyData);

    // If we have survey data, display it
    if (Object.keys(surveyData).length > 0) {
      // Group fields by sections based on field names
      const presentingProblemFields: Array<[string, string | string[]]> = [];
      const goalFields: Array<[string, string | string[]]> = [];
      const objectiveFields: Array<[string, string | string[]]> = [];
      const interventionFields: Array<[string, string | string[]]> = [];
      const treatmentFields: Array<[string, string | string[]]> = [];
      const otherFields: Array<[string, string | string[]]> = [];

      // Categorize fields
      Object.entries(surveyData).forEach(([key, value]) => {
        if (!value || value === "") return;

        const lowerKey = key.toLowerCase();

        if (lowerKey.includes("presenting") || lowerKey.includes("problem")) {
          presentingProblemFields.push([key, value]);
        } else if (lowerKey.includes("goal")) {
          goalFields.push([key, value]);
        } else if (
          lowerKey.includes("objective") ||
          lowerKey.startsWith("question")
        ) {
          objectiveFields.push([key, value]);
        } else if (lowerKey.includes("intervention")) {
          interventionFields.push([key, value]);
        } else if (
          lowerKey.includes("treatment") ||
          lowerKey.includes("approach")
        ) {
          treatmentFields.push([key, value]);
        } else if (lowerKey !== "status" && !lowerKey.includes("id")) {
          otherFields.push([key, value]);
        }
      });

      // Add presenting problem fields
      presentingProblemFields.forEach(([_key, value]) => {
        fields.push({
          label: "Presenting problem:",
          value: String(value),
          type: "text",
        });
      });

      // Add Goals and Objectives section if any exist
      if (goalFields.length > 0 || objectiveFields.length > 0) {
        fields.push({
          label: "GOALS AND OBJECTIVES",
          value: "",
          type: "section",
        });

        // Add goals
        goalFields.forEach(([_key, value], index) => {
          fields.push({
            label: `Goal ${index + 1}`,
            value: String(value),
            type: "text",
          });
        });

        // Add objectives
        objectiveFields.forEach(([key, value], index) => {
          const label = key.toLowerCase().includes("question")
            ? `Objective ${index + 1}`
            : formatFieldLabel(key);
          fields.push({
            label: label + ":",
            value: String(value),
            type: "text",
          });
        });

        // Add status if exists
        if (surveyData.status) {
          fields.push({
            label: "Status:",
            value: String(surveyData.status),
            type: "text",
          });
        }
      }

      // Add interventions
      interventionFields.forEach(([_key, value]) => {
        const interventions = Array.isArray(value) ? value : [value];
        fields.push({
          label: "Interventions:",
          value: interventions.map((v) => String(v)).join("\n"),
          type: "list",
        });
      });

      // Add treatment approach section
      if (treatmentFields.length > 0) {
        fields.push({
          label: "TREATMENT APPROACH",
          value: "",
          type: "section",
        });

        treatmentFields.forEach(([key, value]) => {
          fields.push({
            label: formatFieldLabel(key) + ":",
            value: String(value),
            type: "text",
          });
        });
      }

      // Add any other fields
      if (otherFields.length > 0) {
        otherFields.forEach(([key, value]) => {
          fields.push({
            label: formatFieldLabel(key) + ":",
            value: String(value),
            type: "text",
          });
        });
      }
    }

    // If still no fields, show a message
    if (fields.length === 0) {
      fields.push({
        label: "No survey data available",
        value: "Survey data has not been filled out for this treatment plan.",
        type: "text",
      });
    }

    return fields;
  };

  // Helper function to format field labels
  const formatFieldLabel = (key: string): string => {
    return key
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase())
      .replace(/^\d+\s*/, "") // Remove leading numbers
      .trim();
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
            <div className="h-4 bg-gray-200 rounded w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !plan) {
    return (
      <div className="bg-white p-6">
        <div className="text-red-600">
          {error || "Treatment plan not found"}
        </div>
      </div>
    );
  }

  const surveyFields = getSurveyFields();

  // Debug logging for survey fields
  console.log("Survey data state:", surveyData);
  console.log("Generated survey fields:", surveyFields);

  return (
    <div className="bg-white">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 border-b pb-4 px-6 pt-6">
        <h1 className="text-xl font-medium text-gray-900">
          Diagnosis and treatment plan
        </h1>
        <div className="flex gap-2">
          <Button
            className="flex items-center gap-1"
            size="sm"
            variant="ghost"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost">
                More
                <svg
                  className="ml-1 h-4 w-4"
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
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Print</DropdownMenuItem>
              <DropdownMenuItem>Download</DropdownMenuItem>
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            size="sm"
            onClick={onSign}
          >
            Sign
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="px-6 pb-6">
        <div className="bg-gray-50 rounded-lg p-6 space-y-4">
          <h2 className="font-medium text-gray-900 mb-4">Treatment Plan</h2>

          {/* Diagnosis Section */}
          <div className="space-y-2">
            <div className="font-medium text-gray-700">Diagnosis</div>
            <ul className="list-disc list-inside space-y-1">
              {plan.DiagnosisTreatmentPlanItem.map((item, index) => (
                <li key={index} className="text-gray-700">
                  {item.Diagnosis.code} -{" "}
                  {item.custom_description || item.Diagnosis.description}
                </li>
              ))}
            </ul>
          </div>

          {/* Survey Fields */}
          {surveyFields.map((field, index) => (
            <div key={index} className={field.type === "section" ? "mt-6" : ""}>
              {field.type === "section" ? (
                <h3 className="font-semibold text-gray-900 uppercase text-xs tracking-wider mb-3 mt-4">
                  {field.label}
                </h3>
              ) : field.type === "list" ? (
                <div className="space-y-1">
                  <div className="text-gray-700">{field.label}</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    {field.value.split("\n").map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              ) : (
                <div className="space-y-1 mb-3">
                  <div className="text-gray-700">
                    {field.label.endsWith(":")
                      ? field.label.slice(0, -1)
                      : field.label}
                    :
                    <span className="ml-1 text-gray-600">
                      {field.value || "Not specified"}
                    </span>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Date and Time */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-gray-700 mb-1">
              Date and time assigned to plan
            </div>
            <div className="text-gray-600">
              {plan.created_at
                ? format(new Date(plan.created_at), "MM/dd/yyyy h:mm a")
                : "Not available"}
            </div>
          </div>

          {/* Edit History */}
          {plan.updated_at && (
            <div className="mt-4 text-sm text-gray-500">
              Edited by Alam 1 Naqvi on{" "}
              {format(new Date(plan.updated_at), "MMMM d, yyyy 'at' h:mm a")}.
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        isDeleting={isDeleting}
        open={deleteDialogOpen}
        treatmentPlanTitle={plan?.title || ""}
        onConfirm={handleDelete}
        onOpenChange={setDeleteDialogOpen}
      />
    </div>
  );
}
