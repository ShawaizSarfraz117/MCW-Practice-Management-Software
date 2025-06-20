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

/* eslint-disable max-lines-per-function */

interface SurveyPreviewProps {
  content: string;
  title?: string;
  type?: string;
  mode?: SurveyMode;
  showInstructions?: boolean;
  onComplete?: (result: Record<string, unknown>) => void;
  onValueChanged?: (name: string, value: unknown) => void;
  modelRef?: React.MutableRefObject<Model | null>;
  initialData?: Record<string, unknown>;
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
      onValueChanged,
      modelRef,
      initialData,
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
        console.log("=== DEBUG SurveyPreview: Setting up survey ===");
        console.log("Mode:", mode);

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

          // Ensure mode is properly set
          console.log(
            "=== DEBUG SurveyPreview: Final model mode ===",
            model.mode,
          );
          console.log(
            "=== DEBUG SurveyPreview: Model is read-only? ===",
            model.isReadOnly,
          );

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
    }, [content, title, type, mode]);

    // Set up event handlers when callbacks or model changes
    useEffect(() => {
      if (!surveyModel) return;

      // Set up completion handler
      if (onComplete && mode === "edit") {
        const handler = (sender: Model) => {
          onComplete(sender.data as Record<string, unknown>);
        };
        surveyModel.onComplete.add(handler);

        // Cleanup function to remove handler
        return () => {
          surveyModel.onComplete.remove(handler);
        };
      }
    }, [surveyModel, onComplete, mode]);

    // Set up value change handler
    useEffect(() => {
      if (!surveyModel || !onValueChanged) return;

      const handler = (
        _sender: Model,
        options: { name: string; value: unknown },
      ) => {
        onValueChanged(options.name, options.value);
      };

      surveyModel.onValueChanged.add(handler);

      // Cleanup function to remove handler
      return () => {
        surveyModel.onValueChanged.remove(handler);
      };
    }, [surveyModel, onValueChanged]);

    // Update model reference when model changes
    useEffect(() => {
      if (modelRef && surveyModel) {
        modelRef.current = surveyModel;
      }
    }, [modelRef, surveyModel]);

    // Handle initial data updates separately
    useEffect(() => {
      const dataToSet = initialData || defaultAnswers;
      if (surveyModel && dataToSet && mode === "edit") {
        console.log(
          "=== DEBUG SurveyPreview: Updating survey with initial data ===",
        );
        Object.keys(dataToSet).forEach((key) => {
          if (dataToSet[key] !== undefined && dataToSet[key] !== null) {
            const value = dataToSet[key];
            console.log(`Setting ${key}:`, value, "type:", typeof value);

            // Convert string boolean values to actual booleans for checkboxes
            let finalValue = value;
            if (value === "true") finalValue = true;
            else if (value === "false") finalValue = false;
            else if (
              typeof value === "string" &&
              value.startsWith("[") &&
              value.endsWith("]")
            ) {
              // Try to parse array strings (for multiple checkbox values)
              try {
                finalValue = JSON.parse(value);
              } catch (_e) {
                console.log("Failed to parse array string:", value);
              }
            }

            surveyModel.setValue(key, finalValue);
          }
        });
        console.log("Survey model data after update:", surveyModel.data);
      }
    }, [surveyModel, initialData, defaultAnswers, mode]);

    // Ensure the survey stays in the correct mode
    useEffect(() => {
      if (surveyModel && surveyModel.mode !== mode) {
        console.log("=== DEBUG SurveyPreview: Correcting survey mode ===");
        console.log("Current mode:", surveyModel.mode, "Expected mode:", mode);
        surveyModel.mode = mode;
      }
    }, [surveyModel, mode]);

    if (!surveyModel) {
      return (
        <div className="flex items-center justify-center p-8">
          <p className="text-gray-500">Loading survey...</p>
        </div>
      );
    }

    return (
      <div
        className="survey-preview-container"
        onClick={() =>
          console.log(
            "=== DEBUG: Survey container clicked, mode:",
            surveyModel?.mode,
            "isReadOnly:",
            surveyModel?.isReadOnly,
          )
        }
      >
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
