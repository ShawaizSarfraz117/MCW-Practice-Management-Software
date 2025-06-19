/* eslint-disable max-lines-per-function */
"use client";

import React, { useState, useEffect } from "react";
import { Button, toast, SurveyPreview } from "@mcw/ui";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  fetchSurveyAnswer,
  updateSurveyAnswer,
} from "../../mentalStatusExam/services/surveyAnswer.service";

// Function to transform stored data format to template format
const transformStoredDataToTemplateFormat = (
  content: Record<string, unknown>,
  templateName: string,
): Record<string, unknown> => {
  if (!content || typeof content !== "object") {
    return {};
  }

  const normalizedName = templateName.toUpperCase();

  if (normalizedName.includes("GAD-7")) {
    // Convert gad7_q1 -> question2, gad7_q2 -> question3, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 1; i <= 8; i++) {
      const storedKey = `gad7_q${i}`;
      const templateKey = `question${i + 1}`; // GAD-7 template starts at question2

      if (content[storedKey]) {
        transformed[templateKey] = content[storedKey];
      }
    }

    console.log("GAD-7 transformation:", {
      input: content,
      output: transformed,
    });
    return transformed;
  }

  if (normalizedName.includes("PHQ-9")) {
    // Convert phq9_q1 -> question2, phq9_q2 -> question3, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 1; i <= 10; i++) {
      const storedKey = `phq9_q${i}`;
      const templateKey = `question${i + 1}`; // PHQ-9 template starts at question2

      if (content[storedKey]) {
        transformed[templateKey] = content[storedKey];
      }
    }

    console.log("PHQ-9 transformation:", {
      input: content,
      output: transformed,
    });
    return transformed;
  }

  if (normalizedName.includes("ARM-5")) {
    // Convert arm5_q1 -> question2, arm5_q2 -> question3, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 1; i <= 5; i++) {
      const storedKey = `arm5_q${i}`;
      const templateKey = `question${i + 1}`; // ARM-5 template starts at question2

      if (content[storedKey]) {
        transformed[templateKey] = content[storedKey];
      }
    }

    console.log("ARM-5 transformation:", {
      input: content,
      output: transformed,
    });
    return transformed;
  }

  // For other survey types, return as-is
  console.log("No transformation needed for:", templateName);
  return content;
};

// Function to transform template format back to stored format
const transformTemplateDataToStoredFormat = (
  data: Record<string, unknown>,
  templateName: string,
): Record<string, unknown> => {
  if (!data || typeof data !== "object") {
    return {};
  }

  const normalizedName = templateName.toUpperCase();

  if (normalizedName.includes("GAD-7")) {
    // Convert question2 -> gad7_q1, question3 -> gad7_q2, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 2; i <= 9; i++) {
      const templateKey = `question${i}`;
      const storedKey = `gad7_q${i - 1}`; // question2 -> gad7_q1

      if (data[templateKey]) {
        transformed[storedKey] = data[templateKey];
      }
    }

    console.log("GAD-7 reverse transformation:", {
      input: data,
      output: transformed,
    });
    return transformed;
  }

  if (normalizedName.includes("PHQ-9")) {
    // Convert question2 -> phq9_q1, question3 -> phq9_q2, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 2; i <= 11; i++) {
      const templateKey = `question${i}`;
      const storedKey = `phq9_q${i - 1}`; // question2 -> phq9_q1

      if (data[templateKey]) {
        transformed[storedKey] = data[templateKey];
      }
    }

    console.log("PHQ-9 reverse transformation:", {
      input: data,
      output: transformed,
    });
    return transformed;
  }

  if (normalizedName.includes("ARM-5")) {
    // Convert question2 -> arm5_q1, question3 -> arm5_q2, etc.
    const transformed: Record<string, unknown> = {};

    for (let i = 2; i <= 6; i++) {
      const templateKey = `question${i}`;
      const storedKey = `arm5_q${i - 1}`; // question2 -> arm5_q1

      if (data[templateKey]) {
        transformed[storedKey] = data[templateKey];
      }
    }

    console.log("ARM-5 reverse transformation:", {
      input: data,
      output: transformed,
    });
    return transformed;
  }

  // For other survey types, return as-is
  return data;
};

export default function EditScoredMeasure() {
  const params = useParams();
  const router = useRouter();
  const clientId = params.id as string;
  const scoredMeasureId = params.scoredMeasureId as string;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [surveyAnswerId, setSurveyAnswerId] = useState<string | null>(null);
  const [templateContent, setTemplateContent] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState<string>("");
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
        console.log("Fetching scored measure data for ID:", scoredMeasureId);

        // Fetch the survey answer data (includes SurveyTemplate)
        const [surveyAnswerData, surveyAnswerError] = await fetchSurveyAnswer({
          id: scoredMeasureId,
        });

        if (surveyAnswerError || !surveyAnswerData) {
          console.error("Error fetching survey answer:", surveyAnswerError);
          throw new Error(
            surveyAnswerError?.message || "Failed to fetch scored measure",
          );
        }

        console.log("Survey answer data fetched:", surveyAnswerData);

        // Set survey answer ID for update
        setSurveyAnswerId(surveyAnswerData.id);

        // Set client info
        setClientInfo({
          legal_first_name: surveyAnswerData.Client.legal_first_name,
          legal_last_name: surveyAnswerData.Client.legal_last_name,
          preferred_first_name: surveyAnswerData.Client.preferred_name,
          date_of_birth: surveyAnswerData.Client.date_of_birth || null,
        });

        // Set template name
        const templateName =
          surveyAnswerData.SurveyTemplate?.name || "Scored Measure";
        setTemplateName(templateName);

        // Use the survey template content from the survey answer response
        if (surveyAnswerData.SurveyTemplate?.content) {
          setTemplateContent(
            typeof surveyAnswerData.SurveyTemplate.content === "string"
              ? surveyAnswerData.SurveyTemplate.content
              : JSON.stringify(surveyAnswerData.SurveyTemplate.content),
          );
        }

        // Set default answers from existing survey data with transformation
        if (surveyAnswerData.content) {
          console.log("Original stored content:", surveyAnswerData.content);

          // Transform stored data format to template format
          const transformedData = transformStoredDataToTemplateFormat(
            surveyAnswerData.content,
            templateName,
          );

          console.log("Transformed data for template:", transformedData);
          setDefaultAnswers(transformedData);
        } else {
          console.log("No existing content found in survey answer");
        }
      } catch (error: unknown) {
        console.error("Error in fetchData:", error);
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to load scored measure";
        toast({
          title: errorMessage,
          variant: "destructive",
        });
        router.push(`/clients/${clientId}?tab=measures`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [clientId, scoredMeasureId, router]);

  const handleUpdateScoredMeasure = async (result: Record<string, unknown>) => {
    setIsSubmitting(true);

    try {
      console.log("Received form result:", result);

      if (!surveyAnswerId) {
        throw new Error("Survey answer ID not found");
      }

      // Transform template format back to stored format
      const transformedResult = transformTemplateDataToStoredFormat(
        result,
        templateName,
      );
      console.log("Transformed result for storage:", transformedResult);

      const [response, error] = await updateSurveyAnswer({
        id: surveyAnswerId,
        content: transformedResult as Record<string, string>,
        status: "COMPLETED",
      });

      if (error || !response) {
        console.error("Error updating survey answer:", error);
        throw new Error(error?.message || "Failed to update scored measure");
      }

      console.log("Survey answer updated successfully:", response);

      toast({
        title: "Scored measure updated successfully",
        variant: "success",
      });
      router.push(`/clients/${clientId}?tab=measures`);
    } catch (error: unknown) {
      console.error("Error in handleUpdateScoredMeasure:", error);
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
    router.push(`/clients/${clientId}?tab=measures`);
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

  console.log("Rendering form with defaultAnswers:", defaultAnswers);
  console.log("Template content:", templateContent);

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
        <h2 className="text-xl font-semibold">Edit {templateName}</h2>
      </div>

      {/* Debug Info - Remove in production */}
      {process.env.NODE_ENV === "development" && (
        <div className="bg-gray-100 p-4 rounded-lg mb-4 text-sm">
          <div>
            <strong>Survey ID:</strong> {scoredMeasureId}
          </div>
          <div>
            <strong>Template Name:</strong> {templateName}
          </div>
          <div>
            <strong>Default Answers:</strong>{" "}
            {JSON.stringify(defaultAnswers, null, 2)}
          </div>
        </div>
      )}

      {/* Survey Form */}
      <div className="border rounded-lg bg-white p-6">
        <SurveyPreview
          content={templateContent}
          defaultAnswers={defaultAnswers}
          mode="edit"
          showInstructions={false}
          title={templateName}
          type="scored_measures"
          onComplete={handleUpdateScoredMeasure}
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
          form="sq-root-form"
          type="submit"
        >
          {isSubmitting ? "Updating..." : "Update Scored Measure"}
        </Button>
      </div>
    </div>
  );
}
