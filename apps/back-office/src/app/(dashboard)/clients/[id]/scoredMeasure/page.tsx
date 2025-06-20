/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Button,
  toast,
  SurveyPreview,
  SurveyPreviewRef,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@mcw/ui";
import Loading from "@/components/Loading";
import { useParams, useRouter } from "next/navigation";
import { createSurveyAnswer } from "../mentalStatusExam/services/surveyAnswer.service";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";
import { fetchSurveyTemplateByName } from "@/(dashboard)/clients/services/surveyTemplate.service";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";
import { ClientInfoHeader } from "../components/ClientInfoHeader";

// Available scored measures
const SCORED_MEASURES = [
  { value: "GAD-7", label: "GAD-7 (Generalized Anxiety Disorder)" },
  { value: "PHQ-9", label: "PHQ-9 (Patient Health Questionnaire)" },
  { value: "ARM-5", label: "ARM-5 (Agnew Relationship Measure)" },
];

// Function to map generic survey question names to scoring format
const mapSurveyAnswersToScoringFormat = (
  answers: Record<string, unknown>,
  measureType: string,
): Record<string, string> => {
  const mappedAnswers: Record<string, string> = {};

  switch (measureType) {
    case "GAD-7":
      // GAD-7 has 9 questions (question2-question9 map to gad7_q1-gad7_q8)
      // question9 is the difficulty question (maps to gad7_q8)
      for (let i = 2; i <= 9; i++) {
        const questionKey = `question${i}`;
        const scoringKey = `gad7_q${i - 1}`; // question2 -> gad7_q1, question3 -> gad7_q2, etc.
        if (answers[questionKey]) {
          mappedAnswers[scoringKey] = answers[questionKey] as string;
        }
      }
      break;

    case "PHQ-9":
      // PHQ-9 has 11 questions (question2-question11 map to phq9_q1-phq9_q10)
      // question11 is the difficulty question (maps to phq9_q10)
      for (let i = 2; i <= 11; i++) {
        const questionKey = `question${i}`;
        const scoringKey = `phq9_q${i - 1}`; // question2 -> phq9_q1, question3 -> phq9_q2, etc.
        if (answers[questionKey]) {
          mappedAnswers[scoringKey] = answers[questionKey] as string;
        }
      }
      break;

    case "ARM-5":
      // ARM-5 has 5 questions (question2-question6 map to arm5_q1-arm5_q5)
      for (let i = 2; i <= 6; i++) {
        const questionKey = `question${i}`;
        const scoringKey = `arm5_q${i - 1}`; // question2 -> arm5_q1, question3 -> arm5_q2, etc.
        if (answers[questionKey]) {
          mappedAnswers[scoringKey] = answers[questionKey] as string;
        }
      }
      break;

    default:
      // If no mapping is found, return original answers
      Object.keys(answers).forEach((key) => {
        if (typeof answers[key] === "string") {
          mappedAnswers[key] = answers[key] as string;
        }
      });
  }

  return mappedAnswers;
};

export default function ScoredMeasure() {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [selectedMeasure, setSelectedMeasure] = useState("GAD-7");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const surveyRef = useRef<SurveyPreviewRef>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client info
        const data = (await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {
            includeProfile: "true",
            includeAdress: "true",
            includeMembership: "true",
            includeContacts: "true",
          },
        })) as { data: ClientGroupFromAPI } | null;
        if (data?.data) {
          setClientInfo(data?.data);
        }
      } catch (error) {
        console.error("Failed to fetch client data:", error);
      }
    };

    fetchData();
  }, [clientGroupId]);

  // Fetch survey template when measure changes
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const [surveyTemplate, error] =
          await fetchSurveyTemplateByName(selectedMeasure);

        if (surveyTemplate && !error) {
          setTemplateId(surveyTemplate.id);
          setTemplateContent(
            typeof surveyTemplate.content === "string"
              ? surveyTemplate.content
              : JSON.stringify(surveyTemplate.content),
          );
        } else {
          console.error("Failed to fetch template:", error);
          toast({
            title: "Error",
            description: `Failed to load ${selectedMeasure} template`,
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch template:", error);
        toast({
          title: "Error",
          description: `Failed to load ${selectedMeasure} template`,
          variant: "destructive",
        });
      }
    };

    fetchTemplate();
  }, [selectedMeasure]);

  const handleSaveScoredMeasure = async (result: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      // Check if we have the template ID from the initial load
      if (!templateId) {
        throw new Error(`${selectedMeasure} template not found`);
      }
      if (!clientInfo?.ClientGroupMembership?.[0]?.Client?.id) {
        toast({
          title: "Client not found",
          variant: "destructive",
        });
        return;
      }

      // Map the generic survey answers to the expected scoring format
      const mappedContent = mapSurveyAnswersToScoringFormat(
        result,
        selectedMeasure,
      );

      const [response, error] = await createSurveyAnswer({
        client_id: clientInfo.ClientGroupMembership?.[0]?.Client?.id || "",
        template_id: templateId,
        content: mappedContent,
        status: "COMPLETED",
        client_group_id: clientGroupId,
      });

      if (error || !response) {
        throw new Error(error?.message || "Failed to save scored measure");
      }

      // Show score if available
      if (response.score) {
        toast({
          title: "Scored Measure saved successfully",
          description: `Score: ${response.score.totalScore} - ${response.score.severity || "Completed"}`,
          variant: "success",
        });

        // Check for clinical alerts
        if (
          response.score.flaggedItems &&
          response.score.flaggedItems.length > 0
        ) {
          toast({
            title: "⚠️ Clinical Alert",
            description: response.score.flaggedItems[0],
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Scored Measure saved successfully",
          variant: "success",
        });
      }

      router.push(`/clients/${clientGroupId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save scored measure";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/clients/${clientGroupId}`);
  };

  const handleSubmit = () => {
    if (surveyRef.current) {
      surveyRef.current.submit();
    }
  };

  // Show loading state while fetching template
  if (!templateContent) {
    return (
      <div className="px-4 w-full max-w-6xl mx-auto mt-4">
        <ClientInfoHeader
          clientGroupId={clientGroupId}
          clientInfo={clientInfo}
        />
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Loading scored measure form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 w-full max-w-6xl mx-auto mt-4">
      <ClientInfoHeader clientGroupId={clientGroupId} clientInfo={clientInfo} />

      {/* Section Title and Measure Selection */}
      <div className="flex items-center justify-between mt-8 mb-6">
        <h2 className="text-xl font-semibold">Scored Measure</h2>
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">
            Select Measure:
          </label>
          <Select value={selectedMeasure} onValueChange={setSelectedMeasure}>
            <SelectTrigger className="w-80">
              <span>
                {
                  SCORED_MEASURES.find((m) => m.value === selectedMeasure)
                    ?.label
                }
              </span>
            </SelectTrigger>
            <SelectContent>
              {SCORED_MEASURES.map((measure) => (
                <SelectItem key={measure.value} value={measure.value}>
                  {measure.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Survey Form */}
      <div className="border rounded-lg bg-white p-6 relative">
        <SurveyPreview
          ref={surveyRef}
          content={templateContent}
          defaultAnswers={{}}
          mode="edit"
          showInstructions={false}
          title={selectedMeasure}
          type="scored_measures"
          onComplete={handleSaveScoredMeasure}
        />

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <Loading message="Saving scored measure..." />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="flex gap-2 my-6">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] text-white"
          disabled={isSubmitting}
          onClick={handleSubmit}
          type="button"
        >
          {isSubmitting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
          )}
          {isSubmitting ? "Saving..." : "Save Scored Measure"}
        </Button>
      </div>
    </div>
  );
}
