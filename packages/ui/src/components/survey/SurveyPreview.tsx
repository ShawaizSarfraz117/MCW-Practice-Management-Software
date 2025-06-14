"use client";

import React, {
  useEffect,
  useState,
  useImperativeHandle,
  forwardRef,
} from "react";
import { Survey } from "survey-react-ui";
import { Model } from "survey-core";
import {
  createSurveyModel,
  parseSurveyContent,
  getDefaultSurveyJson,
  configureSurveyTheme,
  SurveyMode,
  initializeCustomWidgets,
} from "@mcw/utils";

interface SurveyPreviewProps {
  content: string;
  title?: string;
  type?: string;
  mode?: SurveyMode;
  showInstructions?: boolean;
  onComplete?: (result: Record<string, unknown>) => void;
  defaultAnswers?: Record<string, unknown>;
}

export interface SurveyPreviewRef {
  submit: () => void;
  isComplete: () => boolean;
}

export const SurveyPreview = forwardRef<SurveyPreviewRef, SurveyPreviewProps>(
  (
    {
      content,
      title = "Survey Preview",
      type = "survey",
      mode = "display",
      showInstructions = true,
      onComplete,
      defaultAnswers,
    },
    ref,
  ) => {
    const [surveyModel, setSurveyModel] = useState<Model | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Expose methods to parent components
    useImperativeHandle(
      ref,
      () => ({
        submit: () => {
          if (surveyModel && mode === "edit") {
            surveyModel.completeLastPage();
          }
        },
        isComplete: () => {
          return surveyModel ? surveyModel.state === "completed" : false;
        },
      }),
      [surveyModel, mode],
    );

    useEffect(() => {
      const setupSurvey = async () => {
        // Initialize custom widgets
        await initializeCustomWidgets();
        const theme = configureSurveyTheme();

        // Parse survey content
        const surveyJson = parseSurveyContent(content);

        if (!surveyJson) {
          // Use default survey if parsing fails
          const defaultJson = getDefaultSurveyJson(type, title);
          const model = createSurveyModel(defaultJson, mode, { theme });
          setSurveyModel(model);
          setError("Unable to load survey content. Showing default template.");
          return;
        }

        // Create survey model
        try {
          const model = createSurveyModel(surveyJson, mode, {
            showNavigationButtons: mode === "edit",
            showCompletedPage: false,
            showProgressBar: "off",
            theme,
          });

          // Set up completion handler
          if (onComplete && mode === "edit") {
            model.onComplete.add((sender) => {
              onComplete(sender.data as Record<string, unknown>);
            });
          }

          // Set default answers if provided
          if (defaultAnswers && typeof defaultAnswers === "object") {
            console.log("Setting default answers:", defaultAnswers);
            model.data = defaultAnswers;
          }

          setSurveyModel(model);
          setError(null);
        } catch (err) {
          console.error("Error creating survey model:", err);
          setError("Failed to create survey preview.");

          // Fallback to default
          const defaultJson = getDefaultSurveyJson(type, title);
          const model = createSurveyModel(defaultJson, mode, { theme });
          setSurveyModel(model);
        }
      };

      setupSurvey();
    }, [content, title, type, mode, onComplete, defaultAnswers]);

    if (!surveyModel) {
      return (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Loading survey...</p>
        </div>
      );
    }

    return (
      <div className="survey-preview-container">
        {showInstructions && mode === "display" && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 text-right">
              <span className="text-red-500">*</span> indicates a required field
            </p>
            {surveyModel.description && (
              <p className="text-sm text-gray-800 italic mt-2">
                {surveyModel.description}
              </p>
            )}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <p className="text-sm text-yellow-800">{error}</p>
          </div>
        )}

        <Survey model={surveyModel} />
      </div>
    );
  },
);

SurveyPreview.displayName = "SurveyPreview";
