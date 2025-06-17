"use client";

import { Card, CardContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import type { SurveyType } from "@/types/survey-answer";
import { getSurveyMetadata } from "@/utils/survey-utils";

interface AssessmentSummaryProps {
  surveyType: SurveyType | "UNKNOWN";
  status: string | null;
  isSignable: boolean;
  isPending: boolean;
  onSignMeasure: () => void;
}

export function AssessmentSummary({
  surveyType,
  status,
  isSignable,
  isPending,
  onSignMeasure,
}: AssessmentSummaryProps) {
  const surveyMetadata =
    surveyType !== "UNKNOWN"
      ? getSurveyMetadata(surveyType as SurveyType)
      : null;

  return (
    <>
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
                from source material and supporting literature. This tool should
                not be used as a substitute for clinical judgment.
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sign Button */}
      {status !== "COMPLETED" && isSignable && (
        <div className="flex justify-start">
          <Button
            disabled={isPending}
            variant="outline"
            onClick={onSignMeasure}
          >
            {isPending ? "Signing..." : "Sign measure"}
          </Button>
        </div>
      )}
    </>
  );
}
