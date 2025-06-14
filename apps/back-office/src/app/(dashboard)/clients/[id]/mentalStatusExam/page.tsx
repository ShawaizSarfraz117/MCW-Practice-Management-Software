"use client";

import React, { useState, useEffect } from "react";
import { Button, toast, SurveyPreview } from "@mcw/ui";
import { useParams, useRouter } from "next/navigation";
import { createMentalStatusExamAnswer } from "./services/surveyAnswer.service";
import { fetchSingleClientGroup } from "@/(dashboard)/clients/services/client.service";
import { fetchSurveyTemplateByType } from "@/(dashboard)/clients/services/surveyTemplate.service";
import { ClientGroupFromAPI } from "../edit/components/ClientEdit";
import { ClientInfoHeader } from "../components/ClientInfoHeader";

// Type for Mental Status Exam content
type MentalStatusExamContent = {
  appearance: string;
  dress: string;
  motor_activity: string;
  insight: string;
  judgement: string;
  affect: string;
  mood: string;
  orientation: string;
  memory: string;
  attention: string;
  thought_content: string;
  thought_process: string;
  perception: string;
  interview_behavior: string;
  speech: string;
  recommendations: string;
};

const normalValues = {
  appearance: "Normal",
  Dress: "Appropriate",
  motor_activity: "Normal",
  insight: "Good",
  judgement: "Good",
  affect: "Appropriate",
  mood: "Euthymic",
  orientation: "X3: Oriented to person, place and time",
  memory: "Intact",
  attention: "Good",
  thought_content: "Normal",
  question3: "Normal", // Thought Process
  perception: "Normal",
  interview_behavior: "Appropriate",
  speech: "Normal",
  recommendations: "",
  date: new Date().toISOString().slice(0, 16), // Default to current datetime
};

export default function MentalStatusExam() {
  const params = useParams();
  const router = useRouter();
  const clientGroupId = params.id as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientInfo, setClientInfo] = useState<ClientGroupFromAPI | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [defaultAnswers, setDefaultAnswers] = useState<Record<string, unknown>>(
    {},
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch client info
        const data = (await fetchSingleClientGroup({
          id: clientGroupId,
          searchParams: {
            includeProfile: "true",
            includeAdress: "true",
          },
        })) as { data: ClientGroupFromAPI } | null;
        if (data?.data) {
          setClientInfo(data?.data);
        }
        // Fetch survey template for mental status exam
        const [surveyTemplate, error] =
          await fetchSurveyTemplateByType("mental_status_exam");

        if (surveyTemplate && !error) {
          setTemplateId(surveyTemplate.id);
          // Store the content from the API response
          setTemplateContent(
            typeof surveyTemplate.content === "string"
              ? surveyTemplate.content
              : JSON.stringify(surveyTemplate.content),
          );
        }
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, [clientGroupId]);

  const handleSaveMentalStatusExam = async (
    result: Record<string, unknown>,
  ) => {
    setIsSubmitting(true);

    try {
      // Check if we have the template ID from the initial load
      if (!templateId) {
        throw new Error("Mental Status Exam template not found");
      }
      if (!clientInfo?.ClientGroupMembership[0]?.Client?.id) {
        toast({
          title: "Client not found",
          variant: "destructive",
        });
        return;
      }

      const [response, error] = await createMentalStatusExamAnswer({
        client_id: clientInfo?.ClientGroupMembership[0]?.Client?.id || "",
        template_id: templateId,
        content: result as MentalStatusExamContent,
        status: "COMPLETED",
        client_group_id: clientGroupId,
      });

      if (error || !response) {
        throw new Error(error?.message || "Failed to save mental status exam");
      }

      toast({
        title: "Mental Status Exam saved successfully",
        variant: "success",
      });

      router.push(`/clients/${clientGroupId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to save mental status exam";
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

  const handleAllNormal = () => {
    setDefaultAnswers(normalValues);
  };

  // Show loading state while fetching template
  if (!templateContent) {
    return (
      <div className="px-4 w-full max-w-6xl mx-auto mt-4">
        <ClientInfoHeader
          clientInfo={clientInfo}
          clientGroupId={clientGroupId}
        />
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Loading mental status exam form...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 w-full max-w-6xl mx-auto mt-4">
      <ClientInfoHeader clientGroupId={clientGroupId} clientInfo={clientInfo} />

      {/* Section Title and All Normal */}
      <div className="flex items-center justify-between mt-8 mb-2">
        <h2 className="text-xl font-semibold">Current Mental Status</h2>
        <button
          className="text-green-700 font-medium hover:underline text-sm"
          type="button"
          onClick={handleAllNormal}
        >
          All Normal
        </button>
      </div>

      {/* Survey Form */}
      <div className="border rounded-lg bg-white p-6">
        <SurveyPreview
          content={templateContent}
          mode="edit"
          showInstructions={false}
          title="Mental Status Exam"
          type="mental_status_exam"
          onComplete={handleSaveMentalStatusExam}
          defaultAnswers={defaultAnswers}
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-2 my-6">
        <Button type="button" variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] text-white"
          disabled={isSubmitting}
          type="submit"
          form="sq-root-form"
        >
          {isSubmitting ? "Saving..." : "Save Mental Status Exam"}
        </Button>
      </div>
    </div>
  );
}
