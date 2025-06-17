"use client";
import { Alert, AlertDescription } from "@mcw/ui";
import { useState } from "react";
import { useToast } from "@mcw/ui";
import { GAD7Content, SurveyType } from "@/types/survey-answer";
import {
  PHQ9Content,
  ARM5Content,
  mapGAD7ContentToQuestions,
  mapPHQ9ContentToQuestions,
  mapARM5ContentToQuestions,
  detectSurveyType,
  getSurveyMetadata,
} from "@/utils/survey-utils";
import { ScoringGuideSheet } from "./components/scoring-guide-sheet";
import { AssessmentHeader } from "./components/assessment-header";
import { AssessmentInfo } from "./components/assessment-info";
import { AssessmentScore } from "./components/assessment-score";
import { AssessmentQuestions } from "./components/assessment-questions";
import { AssessmentSummary } from "./components/assessment-summary";
import { PrintStyles } from "./components/print-styles";
import { DeleteAssessmentDialog } from "./components/delete-assessment-dialog";
import {
  useSurveyAnswer,
  useUpdateSurveyAnswer,
  useDeleteSurveyAnswer,
} from "./hooks/useSurveyAnswer";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@mcw/ui";

export default function AssessmentPage({
  params,
}: {
  params: { id: string; "survery-answer-id": string };
}) {
  const router = useRouter();
  const surveyAnswerId = params["survery-answer-id"];
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const { toast } = useToast();

  const {
    data: surveyAnswer,
    isLoading,
    error,
  } = useSurveyAnswer(surveyAnswerId);
  const updateMutation = useUpdateSurveyAnswer(surveyAnswerId);
  const deleteMutation = useDeleteSurveyAnswer();

  const handleSignMeasure = async () => {
    try {
      await updateMutation.mutateAsync({
        status: "COMPLETED",
      });
      toast({
        title: "Measure signed",
        description: "The assessment has been marked as completed.",
      });
    } catch (_error) {
      toast({
        title: "Error signing measure",
        description: "Failed to sign the measure. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(surveyAnswerId);
      toast({
        title: "Assessment deleted",
        description: "The assessment has been successfully deleted.",
      });
      router.push(`/clients/${params.id}`);
    } catch (_error) {
      toast({
        title: "Error deleting assessment",
        description: "Failed to delete the assessment. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = async () => {
    try {
      const pdfUrl = `/api/survey-answers/${surveyAnswerId}/pdf`;

      // Log request for debugging
      console.log("=== PDF DOWNLOAD REQUEST DEBUG ===");
      console.log("Full URL:", window.location.origin + pdfUrl);
      console.log("Survey Answer ID:", surveyAnswerId);
      console.log("Survey Answer exists:", !!surveyAnswer);
      console.log("Survey Answer Data:", {
        id: surveyAnswer?.id,
        templateName: surveyAnswer?.SurveyTemplate?.name,
        score: surveyAnswer?.score,
        content: surveyAnswer?.content ? "Present" : "Missing",
        status: surveyAnswer?.status,
      });

      const response = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
        credentials: "include", // Include cookies for authentication
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            if (errorText) {
              errorMessage = errorText;
            }
          } catch (_textError) {
            // Use default error message
          }
        }

        // Log error details
        console.error("=== PDF DOWNLOAD ERROR ===", {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          errorMessage,
          surveyAnswerId,
        });

        throw new Error(`Failed to generate PDF: ${errorMessage}`);
      }

      const htmlContent = await response.text();

      // Log HTML content info for debugging
      console.log("=== PDF RESPONSE DEBUG ===");
      console.log("HTML content length:", htmlContent.length);
      console.log(
        "HTML starts with DOCTYPE:",
        htmlContent.includes("<!DOCTYPE html>"),
      );
      console.log(
        "HTML contains score:",
        htmlContent.includes(surveyAnswer?.score?.totalScore?.toString() || ""),
      );
      console.log(
        "HTML contains client name:",
        htmlContent.includes(getClientDisplayName()),
      );

      // Validate that we received HTML content
      if (!htmlContent || !htmlContent.includes("<!DOCTYPE html>")) {
        throw new Error("Invalid PDF content received");
      }

      // Open the HTML content in a new window for printing/saving as PDF
      const printWindow = window.open("", "_blank", "width=800,height=600");
      if (!printWindow) {
        throw new Error(
          "Failed to open print window. Please allow pop-ups for this site.",
        );
      }

      // Write content and ensure it's properly loaded
      printWindow.document.open();
      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for content to be fully loaded before triggering print
      const waitForLoad = () => {
        return new Promise<void>((resolve) => {
          if (printWindow.document.readyState === "complete") {
            resolve();
          } else {
            printWindow.addEventListener("load", () => resolve());
          }
        });
      };

      await waitForLoad();

      // Give additional time for styling to apply
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();

        // Handle post-print cleanup
        const cleanup = () => {
          printWindow.close();
        };

        // Close window after print dialog
        printWindow.addEventListener("afterprint", cleanup);

        // Fallback: close after 30 seconds if user doesn't print
        setTimeout(cleanup, 30000);
      }, 1000);

      toast({
        title: "PDF Ready",
        description:
          "Your assessment PDF is ready for download. The print dialog should open shortly.",
      });
    } catch (error) {
      console.error("Failed to download PDF:", error);
      toast({
        title: "Download Failed",
        description:
          error instanceof Error
            ? error.message
            : "Failed to generate PDF. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getClientDisplayName = () => {
    if (!surveyAnswer?.Client) return "Unknown Client";
    const { preferred_name, legal_first_name, legal_last_name } =
      surveyAnswer.Client;
    const firstName = preferred_name || legal_first_name || "";
    const lastName = legal_last_name || "";
    return `${firstName} ${lastName}`.trim() || "Unknown Client";
  };

  const getFormattedDate = () => {
    if (!surveyAnswer?.created_at) return "";
    return format(new Date(surveyAnswer.created_at), "MM/dd/yyyy");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-32 w-full" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (error || !surveyAnswer) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert>
            <AlertDescription>Survey answer not found</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  // Parse score and content data consistently with PDF endpoint
  const scoreData =
    typeof surveyAnswer.score === "string"
      ? JSON.parse(surveyAnswer.score)
      : surveyAnswer.score;

  const contentData =
    typeof surveyAnswer.content === "string"
      ? JSON.parse(surveyAnswer.content)
      : surveyAnswer.content;

  const totalScore = scoreData?.totalScore || 0;
  const severity = scoreData?.severity || "Unknown";
  const interpretation = scoreData?.interpretation || "";

  // Detect survey type
  const surveyType = detectSurveyType(surveyAnswer.SurveyTemplate.name);
  const surveyMetadata =
    surveyType !== "UNKNOWN" ? getSurveyMetadata(surveyType) : null;

  // Map content based on survey type using parsed content
  const questions = (() => {
    switch (surveyType) {
      case "GAD7":
        return mapGAD7ContentToQuestions(contentData as GAD7Content | null);
      case "PHQ9":
        return mapPHQ9ContentToQuestions(contentData as PHQ9Content | null);
      case "ARM5":
        return mapARM5ContentToQuestions(contentData as ARM5Content | null);
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6 print-content">
        {/* Client Info */}
        <AssessmentInfo
          surveyAnswer={surveyAnswer}
          clientId={params.id}
          getClientDisplayName={getClientDisplayName}
          getFormattedDate={getFormattedDate}
        />

        {/* Assessment Header with Action Buttons */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {surveyAnswer.SurveyTemplate.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">{getFormattedDate()}</p>
              {surveyAnswer.status && (
                <p className="text-sm text-gray-500 mt-1">
                  Status:{" "}
                  <span className="capitalize">
                    {surveyAnswer.status.toLowerCase()}
                  </span>
                </p>
              )}
            </div>
            <AssessmentHeader
              isSignable={surveyAnswer.status !== "COMPLETED"}
              isSigned={surveyAnswer.status === "COMPLETED"}
              isPending={updateMutation.isPending}
              onSignMeasure={handleSignMeasure}
              onPrint={handlePrint}
              onDownloadPDF={handleDownload}
              onDelete={() => setShowDeleteDialog(true)}
            />
          </div>
        </div>

        {/* Score and Interpretation */}
        <AssessmentScore
          totalScore={totalScore}
          severity={severity}
          interpretation={interpretation}
          maxScore={surveyMetadata?.maxScore || 21}
          surveyType={surveyType}
          onViewScoringGuide={() => setShowScoringGuide(true)}
        />

        {/* Assessment Questions Table */}
        <AssessmentQuestions questions={questions} surveyType={surveyType} />

        {/* Summary Section */}
        <AssessmentSummary
          surveyType={surveyType}
          status={surveyAnswer.status}
          isSignable={surveyAnswer.status !== "COMPLETED"}
          isPending={updateMutation.isPending}
          onSignMeasure={handleSignMeasure}
        />

        {/* Delete Confirmation Dialog */}
        <DeleteAssessmentDialog
          open={showDeleteDialog}
          onOpenChange={setShowDeleteDialog}
          assessmentName={surveyAnswer?.SurveyTemplate.name || ""}
          clientName={getClientDisplayName()}
          assessmentDate={getFormattedDate()}
          isPending={deleteMutation.isPending}
          onConfirm={handleDelete}
        />

        {/* Scoring Guide Sheet */}
        {surveyType && (
          <ScoringGuideSheet
            open={showScoringGuide}
            onOpenChange={setShowScoringGuide}
            surveyType={surveyType as SurveyType}
          />
        )}
      </div>

      {/* Print Styles */}
      <PrintStyles />
    </div>
  );
}
