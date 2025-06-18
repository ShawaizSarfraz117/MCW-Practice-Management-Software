"use client";

import { Button } from "@mcw/ui";
import { HelpCircle } from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import type { SurveyAnswerWithRelations } from "@/types/survey-answer";

interface AssessmentInfoProps {
  surveyAnswer: SurveyAnswerWithRelations;
  clientId: string;
  getClientDisplayName: () => string;
  getFormattedDate: () => string;
}

export function AssessmentInfo({
  surveyAnswer,
  clientId,
  getClientDisplayName,
  getFormattedDate,
}: AssessmentInfoProps) {
  const router = useRouter();

  return (
    <>
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
                onClick={() => router.push(`/clients/${clientId}`)}
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
        </div>
      </div>
    </>
  );
}
