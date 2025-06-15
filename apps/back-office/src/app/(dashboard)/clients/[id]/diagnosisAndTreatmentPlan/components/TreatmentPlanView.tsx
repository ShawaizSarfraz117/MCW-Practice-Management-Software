"use client";

import React, { useEffect, useState } from "react";
import { format } from "date-fns";
import {
  Button,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";
import { Pencil } from "lucide-react";
import { fetchDiagnosisTreatmentPlanById } from "../services/diagnosisTreatmentPlan.service";
import { fetchSurveyAnswer } from "@/(dashboard)/clients/[id]/mentalStatusExam/services/surveyAnswer.service";
import type { DiagnosisTreatmentPlan } from "../services/diagnosisTreatmentPlan.service";

interface DiagnosisTreatmentPlanWithSurvey extends DiagnosisTreatmentPlan {
  SurveyAnswers?: {
    id: string;
    content: string;
    [key: string]: unknown;
  } | null;
}

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
  const [plan, setPlan] = useState<DiagnosisTreatmentPlanWithSurvey | null>(
    null,
  );
  const [surveyData, setSurveyData] = useState<
    Record<string, string | string[]>
  >({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Fetch the treatment plan
        const planData = (await fetchDiagnosisTreatmentPlanById(
          planId,
        )) as DiagnosisTreatmentPlanWithSurvey;
        setPlan(planData);

        // Check if survey data is included in the response
        if (planData.SurveyAnswers && planData.SurveyAnswers.content) {
          // Parse content if it's a string
          let content = planData.SurveyAnswers.content;
          if (typeof content === "string") {
            try {
              content = JSON.parse(content);
            } catch (e) {
              console.error("Failed to parse survey content:", e);
            }
          }
          setSurveyData(content as Record<string, string | string[]>);
        } else if (planData.survey_answers_id) {
          // Fallback: fetch separately if not included
          const [surveyAnswer, surveyError] = await fetchSurveyAnswer({
            id: planData.survey_answers_id,
          });

          if (!surveyError && surveyAnswer && surveyAnswer.content) {
            // Parse content if it's a string
            let content = surveyAnswer.content;
            if (typeof content === "string") {
              try {
                content = JSON.parse(content);
              } catch (e) {
                console.error("Failed to parse survey content:", e);
              }
            }
            setSurveyData(content as Record<string, string | string[]>);
          }
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

  // Transform survey data into display format
  const getSurveyFields = (): SurveyField[] => {
    const fields: SurveyField[] = [];

    // Add Presenting Problem
    if (surveyData.presenting_problem) {
      fields.push({
        label: "Presenting problem:",
        value: String(surveyData.presenting_problem),
        type: "text",
      });
    }

    // Add Goals and Objectives section
    const hasGoalsSection =
      surveyData.goal ||
      surveyData.goal_1 ||
      surveyData.objective_1a ||
      surveyData.objective_1b ||
      surveyData.objective_2a ||
      surveyData.objective_2b;

    if (hasGoalsSection) {
      fields.push({
        label: "GOALS AND OBJECTIVES",
        value: "",
        type: "section",
      });

      // Goal
      if (surveyData.goal || surveyData.goal_1) {
        fields.push({
          label: "Goal 1",
          value: String(surveyData.goal || surveyData.goal_1),
          type: "text",
        });
      }

      // Objectives
      if (surveyData.objective_1a) {
        fields.push({
          label: "Objective 1A:",
          value: String(surveyData.objective_1a),
          type: "text",
        });
      }

      if (surveyData.objective_1b) {
        fields.push({
          label: "Objective 1B:",
          value: String(surveyData.objective_1b),
          type: "text",
        });
      }

      if (surveyData.objective_2a) {
        fields.push({
          label: "Objective 2B:",
          value: String(surveyData.objective_2a),
          type: "text",
        });
      }

      if (surveyData.objective_2b) {
        fields.push({
          label: "Objective: ff",
          value: String(surveyData.objective_2b),
          type: "text",
        });
      }

      // Status
      if (surveyData.status) {
        fields.push({
          label: "Status:",
          value: String(surveyData.status),
          type: "text",
        });
      }

      // Interventions
      if (surveyData.interventions) {
        const interventions = Array.isArray(surveyData.interventions)
          ? surveyData.interventions
          : [surveyData.interventions];

        fields.push({
          label: "Interventions:",
          value: interventions.join("\n"),
          type: "list",
        });
      }
    }

    // Treatment Approach section
    if (surveyData.treatment_approach) {
      fields.push({
        label: "TREATMENT APPROACH",
        value: "",
        type: "section",
      });
      // Add any treatment approach content here if available
    }

    return fields;
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
              <DropdownMenuItem className="text-red-600">
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
    </div>
  );
}
