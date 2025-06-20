/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button, toast, SurveyPreview, SurveyPreviewRef } from "@mcw/ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSurveyAnswer,
  updateSurveyAnswer,
} from "@/(dashboard)/clients/[id]/mentalStatusExam/services/surveyAnswer.service";
import Loading from "@/components/Loading";

export default function EditScoredMeasure() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const scoredMeasureId = params.scoredMeasureId as string;
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
  const surveyRef = useRef<SurveyPreviewRef>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch the survey answer data (includes SurveyTemplate)
        const [surveyAnswerData, surveyAnswerError] = await fetchSurveyAnswer({
          id: scoredMeasureId,
        });

        if (surveyAnswerError || !surveyAnswerData) {
          throw new Error(
            surveyAnswerError?.message || "Failed to fetch scored measure",
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
            : "Failed to load scored measure";
        toast({
          title: errorMessage,
          variant: "destructive",
        });
        router.push(`/clients/${clientId}/scoredMeasure`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, scoredMeasureId, router]);

  const handleUpdateScoredMeasure = async (result: Record<string, unknown>) => {
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
        throw new Error(error?.message || "Failed to update scored measure");
      }

      // Show score if available
      if (response.score) {
        toast({
          title: "Scored Measure updated successfully",
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
          title: "Scored Measure updated successfully",
          variant: "success",
        });
      }

      router.push(`/clients/${clientId}`);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to update scored measure";
      toast({
        title: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push(`/clients/${clientId}/scoredMeasure`);
  };

  const handleSubmit = () => {
    if (surveyRef.current) {
      surveyRef.current.submit();
    }
  };

  if (isLoading || !templateContent) {
    return (
      <div className="px-4 w-full max-w-6xl mx-auto">
        <div className="flex justify-center items-center h-64">
          <p>Loading scored measure...</p>
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

      {/* Section Title */}
      <div className="flex items-center justify-between mt-8 mb-2">
        <h2 className="text-xl font-semibold">Edit Scored Measure</h2>
      </div>

      {/* Survey Form */}
      <div className="border rounded-lg bg-white p-6 relative">
        <SurveyPreview
          ref={surveyRef}
          content={templateContent}
          defaultAnswers={defaultAnswers}
          mode="edit"
          showInstructions={false}
          title="Scored Measure"
          type="scored_measures"
          onComplete={handleUpdateScoredMeasure}
        />

        {/* Loading Overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
            <Loading message="Updating scored measure..." />
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
          {isSubmitting ? "Updating..." : "Update Scored Measure"}
        </Button>
      </div>
    </div>
  );
}
