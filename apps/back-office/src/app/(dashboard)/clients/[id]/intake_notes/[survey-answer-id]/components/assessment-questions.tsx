"use client";

import { Card, CardContent } from "@mcw/ui";
import type { SurveyType } from "@/types/survey-answer";
import {
  getSurveyMetadata,
  getDifficultyLabel,
  BaseQuestion,
} from "@/utils/survey-utils";

interface AssessmentQuestionsProps {
  questions: BaseQuestion[];
  surveyType: SurveyType | "UNKNOWN";
}

export function AssessmentQuestions({
  questions,
  surveyType,
}: AssessmentQuestionsProps) {
  const surveyMetadata =
    surveyType !== "UNKNOWN"
      ? getSurveyMetadata(surveyType as SurveyType)
      : null;

  return (
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
                  <td className="py-4 px-4 text-sm text-gray-500">-</td>
                  <td className="py-4 px-4 text-sm text-gray-500">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* PHQ-9 Question */}
        {surveyType === "PHQ9" && questions.length >= 9 && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg print-page-break">
            <p className="text-sm font-medium text-gray-900 mb-2">
              If you checked off any problems, how difficult have these problems
              made it for you to do your work, take care of things at home, or
              get along with other people?
            </p>
            <div className="mt-3">
              <span className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
                {getDifficultyLabel(
                  (questions[8]?.response || "").toLowerCase(),
                )}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
