/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect } from "react";
import { Button, toast, SurveyPreview } from "@mcw/ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSurveyAnswer,
  updateSurveyAnswer,
} from "../services/surveyAnswer.service";

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

export default function EditMentalStatusExam() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const mentalStatusExamId = params.mentalStatusExamId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyAnswerId, setSurveyAnswerId] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [defaultAnswers, setDefaultAnswers] = useState<Record<string, unknown>>(
    {},
  );
  const [clientInfo, setClientInfo] = useState<{
    legal_first_name: string;
    legal_last_name: string;
    preferred_first_name: string | null;
    date_of_birth: Date | null;
  } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the survey answer data (includes SurveyTemplate)
        const [surveyAnswerData, surveyAnswerError] = await fetchSurveyAnswer({
          id: mentalStatusExamId,
        });

        if (surveyAnswerError || !surveyAnswerData) {
          throw new Error(
            surveyAnswerError?.message || "Failed to fetch mental status exam",
          );
        }

        // Set survey answer ID for update
        setSurveyAnswerId(surveyAnswerData.id);

        // Set client info
        setClientInfo({
          legal_first_name: surveyAnswerData.Client.legal_first_name,
          legal_last_name: surveyAnswerData.Client.legal_last_name,
          preferred_first_name: surveyAnswerData.Client.preferred_name,
          date_of_birth: surveyAnswerData.Client.date_of_birth || null,
        });

        // Use the survey template content from the survey answer response
        if (surveyAnswerData.SurveyTemplate?.content) {
          setTemplateContent(
            typeof surveyAnswerData.SurveyTemplate.content === "string"
              ? surveyAnswerData.SurveyTemplate.content
              : JSON.stringify(surveyAnswerData.SurveyTemplate.content),
          );
        }

        // Set default answers from existing survey data
        if (surveyAnswerData.content) {
          // Use the existing content as default answers
          setDefaultAnswers(surveyAnswerData.content);
        }
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load mental status exam";
        toast({
          title: errorMessage,
          variant: "destructive",
        });
        router.push(`/clients/${clientId}/mentalStatusExam`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, mentalStatusExamId, router]);

  const handleUpdateMentalStatusExam = async (
    result: Record<string, unknown>,
  ) => {
    setIsSubmitting(true);

    try {
      if (!surveyAnswerId) {
        throw new Error("Survey answer ID not found");
      }

      const [response, error] = await updateSurveyAnswer({
        id: surveyAnswerId,
        content: result as Record<string, string>,
        status: "COMPLETED",
      });

      if (error || !response) {
        throw new Error(
          error?.message || "Failed to update mental status exam",
        );
      }

      toast({
        title: "Mental Status Exam updated successfully",
        variant: "success",
      });
      router.push(`/clients/${clientId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update mental status exam";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/clients/${clientId}/mentalStatusExam`);
  };

  const handleAllNormal = () => {
    setDefaultAnswers(normalValues);
  };

  if (isLoading || !templateContent) {
    return (
      <div className="px-4 w-full max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p>Loading mental status exam...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 w-full max-w-6xl mx-auto">
      {/* Client Info */}
      <h1 className="text-2xl font-semibold mt-4 mb-1">
        {clientInfo
          ? `${clientInfo.preferred_first_name || clientInfo.legal_first_name} ${clientInfo.legal_last_name}`
          : "Loading..."}
      </h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        {clientInfo?.date_of_birth && (
          <>
            {new Date().getFullYear() -
              new Date(clientInfo.date_of_birth).getFullYear() >=
            18
              ? "Adult"
              : "Minor"}
            <span className="text-gray-300">|</span>
          </>
        )}
        {clientInfo?.date_of_birth && (
          <>
            {new Date(clientInfo.date_of_birth).toLocaleDateString()}
            <span className="text-gray-300">|</span>
          </>
        )}
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/scheduled?client_id=${clientId}`}
        >
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link
          className="text-[#2d8467] hover:underline"
          href={`/clients/${clientId}/edit`}
        >
          Edit
        </Link>
      </div>

      {/* Section Title and All Normal */}
      <div className="flex items-center justify-between mt-8 mb-2">
        <h2 className="text-xl font-semibold">Edit Mental Status</h2>
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
          onComplete={handleUpdateMentalStatusExam}
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
          {isSubmitting ? "Updating..." : "Update Mental Status Exam"}
        </Button>
      </div>
    </div>
  );
}
