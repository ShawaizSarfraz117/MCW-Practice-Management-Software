"use client";

import { Button } from "@mcw/ui";
import { Card, CardContent } from "@mcw/ui";
import { Plus, Printer, Download, Trash2, HelpCircle } from "lucide-react";
import {
  useSurveyAnswer,
  useUpdateSurveyAnswer,
  useDeleteSurveyAnswer,
} from "./hooks/useSurveyAnswer";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Skeleton } from "@mcw/ui";
import { Alert, AlertDescription } from "@mcw/ui";
import { AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mcw/ui";
import { useState } from "react";
import { useToast } from "@mcw/ui";
import { GAD7Content } from "@/types/survey-answer";
import {
  PHQ9Content,
  ARM5Content,
  mapGAD7ContentToQuestions,
  mapPHQ9ContentToQuestions,
  mapARM5ContentToQuestions,
  detectSurveyType,
  getSurveyMetadata,
  getDifficultyLabel,
} from "@/utils/survey-utils";

export default function AssessmentPage({
  params,
}: {
  params: { id: string; "survery-answer-id": string };
}) {
  const router = useRouter();
  const surveyAnswerId = params["survery-answer-id"];
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  const {
    data: surveyAnswer,
    isLoading,
    error,
  } = useSurveyAnswer(surveyAnswerId);
  const updateMutation = useUpdateSurveyAnswer(surveyAnswerId);
  const deleteMutation = useDeleteSurveyAnswer();

  const handleSignMeasure = async () => {
    await updateMutation.mutateAsync({ status: "COMPLETED" });
  };

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync(surveyAnswerId);
      router.push(`/clients/${params.id}`);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      console.error("Failed to delete survey answer:", error);
    } finally {
      setShowDeleteDialog(false);
    }
  };

  const handlePrint = () => {
    // Log current page data for comparison with download
    console.log("=== PRINT DEBUG INFO ===");
    console.log("Current page survey data for print:", {
      id: surveyAnswer?.id,
      templateName: surveyAnswer?.SurveyTemplate.name,
      totalScore: surveyAnswer?.score?.totalScore,
      severity: surveyAnswer?.score?.severity,
      interpretation: surveyAnswer?.score?.interpretation,
      contentKeys: surveyAnswer?.content
        ? Object.keys(surveyAnswer.content)
        : [],
      clientName: getClientDisplayName(),
      date: getFormattedDate(),
    });

    // Add a small delay to ensure the DOM is ready
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handleDownload = async () => {
    try {
      // Log current page data for comparison
      console.log("=== DOWNLOAD DEBUG INFO ===");
      console.log("Current page survey data:", {
        id: surveyAnswer?.id,
        templateName: surveyAnswer?.SurveyTemplate.name,
        totalScore: surveyAnswer?.score?.totalScore,
        severity: surveyAnswer?.score?.severity,
        interpretation: surveyAnswer?.score?.interpretation,
        contentKeys: surveyAnswer?.content
          ? Object.keys(surveyAnswer.content)
          : [],
        clientName: getClientDisplayName(),
        date: getFormattedDate(),
      });

      toast({
        title: "Generating PDF",
        description: "Please wait while we prepare your assessment PDF...",
      });

      const pdfUrl = `/api/survey-answers/${surveyAnswerId}/pdf`;
      console.log("=== PDF REQUEST DEBUG ===");
      console.log("Making request to:", pdfUrl);
      console.log("Survey Answer ID:", surveyAnswerId);

      const response = await fetch(pdfUrl, {
        method: "GET",
        headers: {
          Accept: "text/html",
        },
      });

      console.log("Response status:", response.status);
      console.log("Response ok:", response.ok);

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (_jsonError) {
          // If response is not JSON, try to get text
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (_textError) {
            // Use the HTTP status as fallback
          }
        }

        console.error("PDF generation failed:", {
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
    try {
      return format(
        new Date(surveyAnswer.created_at),
        "MM/dd/yyyy 'at' h:mm a",
      );
    } catch {
      return "";
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-8 w-64 mb-4" />
              <Skeleton className="h-4 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Error loading survey answer: {(error as Error).message}
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (!surveyAnswer) {
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

  // Log questions data for debugging (only in development)
  if (process.env.NODE_ENV === "development") {
    console.log("=== PAGE QUESTIONS DEBUG ===");
    console.log("Survey type:", surveyType);
    console.log("Questions count:", questions.length);
    console.log("First 3 questions:", questions.slice(0, 3));
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6 print-content">
        {/* Patient Header */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {getClientDisplayName()}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                {surveyAnswer.Client.date_of_birth && (
                  <span>
                    DOB:{" "}
                    {format(
                      new Date(surveyAnswer.Client.date_of_birth),
                      "MM/dd/yyyy",
                    )}
                  </span>
                )}
                <span
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => router.push(`/clients/${params.id}`)}
                >
                  View Client
                </span>
              </div>
            </div>
            <Button size="sm" variant="ghost">
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Assessment Header */}
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
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Note
              </Button>
              <Button
                size="sm"
                title="Print this assessment"
                variant="ghost"
                onClick={handlePrint}
              >
                <Printer className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                title="Download as PDF"
                variant="ghost"
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                size="sm"
                title="Delete this assessment"
                variant="ghost"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Score and Interpretation */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Score Visualization */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-6">Score</h3>
              <div className="flex items-center justify-center">
                <div className="relative w-48 h-48">
                  <svg
                    className="w-full h-full transform -rotate-90"
                    viewBox="0 0 100 100"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="40"
                      stroke="#e5e7eb"
                      strokeWidth="8"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      fill="none"
                      r="40"
                      stroke="#f59e0b"
                      strokeDasharray={`${(totalScore / (surveyMetadata?.maxScore || 21)) * 251.2} 251.2`}
                      strokeLinecap="round"
                      strokeWidth="8"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold text-gray-900">
                      {totalScore}
                    </span>
                    <span className="text-sm text-gray-600 mt-1">
                      {severity}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-4">
                <span>0</span>
                <span>{surveyMetadata?.maxScore || 21}</span>
              </div>
            </CardContent>
          </Card>

          {/* Scoring Interpretation */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-lg font-medium">Scoring interpretation</h3>
                <HelpCircle className="h-4 w-4 text-gray-400" />
              </div>
              <div className="space-y-3">
                <p className="text-sm text-gray-700">{interpretation}</p>
                {severity === "Moderate" && (
                  <p className="text-sm text-gray-700">
                    The client's symptoms make it{" "}
                    <strong>somewhat difficult</strong> to function.
                  </p>
                )}
                {severity === "Severe" && (
                  <p className="text-sm text-gray-700">
                    The client's symptoms make it{" "}
                    <strong>very difficult</strong> to function.
                  </p>
                )}
                <Button
                  className="p-0 h-auto text-blue-600 text-sm"
                  variant="link"
                >
                  View scoring guide
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assessment Questions Table */}
        <Card>
          <CardContent className="p-6">
            {surveyMetadata && (
              <div className="mb-4">
                <p className="text-sm text-gray-700">
                  {surveyMetadata.timeFrame},{" "}
                  {surveyType === "ARM5"
                    ? "please indicate how strongly you agree or disagree with each statement."
                    : "how often have you been bothered by the following problems?"}
                </p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Question
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Response
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Since last
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-900">
                      Since baseline
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {questions.map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="py-4 px-4">
                        <div className="flex items-start gap-3">
                          <span className="text-sm font-medium text-gray-900 min-w-[20px]">
                            {item.id}.
                          </span>
                          <span className="text-sm text-gray-700">
                            {item.question}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {item.response}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {item.score}
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={
                            item.sinceLast.includes("↓")
                              ? "text-blue-600"
                              : item.sinceLast.includes("↑")
                                ? "text-red-600"
                                : "text-gray-700"
                          }
                        >
                          {item.sinceLast}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-sm">
                        <span
                          className={
                            item.sinceBaseline.includes("↓")
                              ? "text-blue-600"
                              : item.sinceBaseline.includes("↑")
                                ? "text-red-600"
                                : "text-gray-700"
                          }
                        >
                          {item.sinceBaseline}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Additional Question for GAD7 and PHQ9 */}
            {surveyMetadata?.difficultyQuestion &&
              (surveyType === "GAD7" || surveyType === "PHQ9") && (
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 items-start">
                    <div className="lg:col-span-2">
                      <p className="text-sm text-gray-700">
                        {surveyMetadata.difficultyQuestion}
                      </p>
                    </div>
                    <div className="text-sm text-gray-700">
                      {(() => {
                        let difficultyResponse = "";
                        if (surveyType === "GAD7" && contentData) {
                          difficultyResponse =
                            (contentData as GAD7Content).gad7_q8 || "";
                        } else if (surveyType === "PHQ9" && contentData) {
                          difficultyResponse =
                            (contentData as PHQ9Content).phq9_q10 || "";
                        }
                        return difficultyResponse
                          ? getDifficultyLabel(difficultyResponse)
                          : "Not answered";
                      })()}
                    </div>
                    <div />
                    <div />
                  </div>
                </div>
              )}
          </CardContent>
        </Card>

        {/* Sources */}
        {surveyMetadata && (
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Sources</h3>
              <div className="space-y-4">
                {surveyMetadata.sources.map((source, index) => (
                  <div key={index} className="text-sm text-gray-700">
                    <strong>{index + 1}.</strong> {source.text}
                  </div>
                ))}
                <div className="text-sm text-gray-600 mt-4 p-4 bg-gray-50 rounded-lg">
                  This measure and its scoring information have been reproduced
                  from source material and supporting literature. This tool
                  should not be used as a substitute for clinical judgment.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sign Button */}
        {surveyAnswer.status !== "COMPLETED" && (
          <div className="flex justify-start">
            <Button
              disabled={updateMutation.isPending}
              variant="outline"
              onClick={handleSignMeasure}
            >
              {updateMutation.isPending ? "Signing..." : "Sign measure"}
            </Button>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this{" "}
                <strong>{surveyAnswer?.SurveyTemplate.name}</strong> assessment
                for <strong>{getClientDisplayName()}</strong>?
                <br />
                <br />
                This action cannot be undone and will permanently remove:
                <br />• All survey responses and scores
                <br />• Assessment date: {getFormattedDate()}
                <br />• Any associated notes or data
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={deleteMutation.isPending}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                disabled={deleteMutation.isPending}
                onClick={handleDelete}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete Assessment"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Print Styles */}
      <style global jsx>{`
        @media print {
          @page {
            size: A4;
            margin: 0.75in;
          }

          body * {
            visibility: hidden;
          }

          .print-content,
          .print-content * {
            visibility: visible;
          }

          .print-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }

          /* Hide buttons and interactive elements when printing */
          button,
          .no-print {
            display: none !important;
          }

          /* Fix grid layouts for print */
          .grid {
            display: block !important;
          }

          .lg\\:grid-cols-2 > * {
            width: 100% !important;
            margin-bottom: 20px !important;
            break-inside: avoid;
          }

          .lg\\:grid-cols-5 > * {
            width: 100% !important;
            margin-bottom: 10px !important;
          }

          /* Ensure good contrast for printing */
          .bg-gray-50 {
            background-color: white !important;
          }

          .bg-gray-100 {
            background-color: #f8f9fa !important;
          }

          /* Fix score visualization for print */
          .relative.w-48.h-48 {
            width: 120px !important;
            height: 120px !important;
            margin: 0 auto !important;
          }

          /* Improve table printing */
          table {
            break-inside: auto;
          }

          tr {
            break-inside: avoid;
            break-after: auto;
          }

          thead {
            display: table-header-group;
          }

          /* Page breaks */
          .print-page-break {
            page-break-before: always;
          }

          /* Remove shadows and borders for cleaner print */
          .shadow-sm,
          .shadow {
            box-shadow: none !important;
            border: 1px solid #e5e7eb !important;
          }

          /* Ensure text is readable */
          .text-gray-600,
          .text-gray-700 {
            color: #374151 !important;
          }

          /* Reduce padding for print */
          .p-6 {
            padding: 1rem !important;
          }

          .py-4 {
            padding-top: 0.5rem !important;
            padding-bottom: 0.5rem !important;
          }

          /* Fix flex layouts */
          .flex {
            display: block !important;
          }

          .justify-between {
            text-align: left !important;
          }

          .items-center {
            align-items: flex-start !important;
          }
        }
      `}</style>
    </div>
  );
}
