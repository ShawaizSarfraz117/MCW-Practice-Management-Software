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
    if (window.confirm("Are you sure you want to delete this survey answer?")) {
      await deleteMutation.mutateAsync(surveyAnswerId);
      router.push(`/clients/${params.id}`);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // TODO: Implement PDF download functionality
    console.log("Download functionality to be implemented");
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

  const totalScore = surveyAnswer.score?.totalScore || 0;
  const severity = surveyAnswer.score?.severity || "Unknown";
  const interpretation = surveyAnswer.score?.interpretation || "";

  // Detect survey type
  const surveyType = detectSurveyType(surveyAnswer.SurveyTemplate.name);
  const surveyMetadata =
    surveyType !== "UNKNOWN" ? getSurveyMetadata(surveyType) : null;

  // Map content based on survey type
  const questions = (() => {
    switch (surveyType) {
      case "GAD7":
        return mapGAD7ContentToQuestions(
          surveyAnswer.content as GAD7Content | null,
        );
      case "PHQ9":
        return mapPHQ9ContentToQuestions(
          surveyAnswer.content as PHQ9Content | null,
        );
      case "ARM5":
        return mapARM5ContentToQuestions(
          surveyAnswer.content as ARM5Content | null,
        );
      default:
        return [];
    }
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
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
              <Button size="sm" variant="ghost" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDownload}>
                <Download className="h-4 w-4" />
              </Button>
              <Button
                disabled={deleteMutation.isPending}
                size="sm"
                variant="ghost"
                onClick={handleDelete}
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
                        if (surveyType === "GAD7" && surveyAnswer.content) {
                          difficultyResponse =
                            (surveyAnswer.content as GAD7Content).gad7_q8 || "";
                        } else if (
                          surveyType === "PHQ9" &&
                          surveyAnswer.content
                        ) {
                          difficultyResponse =
                            (surveyAnswer.content as PHQ9Content).phq9_q10 ||
                            "";
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
      </div>
    </div>
  );
}
