"use client";

import { Card, CardContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { HelpCircle } from "lucide-react";
import type { SurveyType } from "@/types/survey-answer";

interface AssessmentScoreProps {
  totalScore: number;
  severity: string;
  interpretation: string;
  maxScore: number;
  surveyType: SurveyType | "UNKNOWN";
  onViewScoringGuide: () => void;
}

export function AssessmentScore({
  totalScore,
  severity,
  interpretation,
  maxScore,
  surveyType,
  onViewScoringGuide,
}: AssessmentScoreProps) {
  return (
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
                  strokeDasharray={`${(totalScore / maxScore) * 251.2} 251.2`}
                  strokeLinecap="round"
                  strokeWidth="8"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold text-gray-900">
                  {totalScore}
                </span>
                <span className="text-sm text-gray-600 mt-1">{severity}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-4">
            <span>0</span>
            <span>{maxScore}</span>
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
                The client's symptoms make it <strong>very difficult</strong> to
                function.
              </p>
            )}
            {surveyType !== "UNKNOWN" && (
              <Button
                className="p-0 h-auto text-blue-600 text-sm"
                variant="link"
                onClick={onViewScoringGuide}
              >
                View scoring guide
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
