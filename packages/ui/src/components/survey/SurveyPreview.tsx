"use client";

import React, { useEffect, useState } from "react";
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
  onValueChanged?: (name: string, value: unknown) => void;
  modelRef?: React.MutableRefObject<Model | null>;
  initialData?: Record<string, unknown>;
}

export function SurveyPreview({
  content,
  title = "Survey Preview",
  type = "survey",
  mode = "display",
  showInstructions = true,
  onComplete,
  onValueChanged,
  modelRef,
  initialData,
}: SurveyPreviewProps) {
  const [surveyModel, setSurveyModel] = useState<Model | null>(null);
  const [error, setError] = useState<string | null>(null);

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

        // Set up value change handler
        if (onValueChanged) {
          model.onValueChanged.add((_sender, options) => {
            onValueChanged(options.name, options.value);
          });
        }

        // Store model reference if provided
        if (modelRef) {
          modelRef.current = model;
        }

        // Set initial data if provided
        if (initialData && mode === "edit") {
          model.data = initialData;
          console.log("Set initial survey data:", initialData);
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
  }, [content, title, type, mode, onComplete, onValueChanged, modelRef]);

  // Separate effect to handle initial data updates
  useEffect(() => {
    if (surveyModel && initialData && mode === "edit") {
      surveyModel.data = initialData;
      console.log("Updated survey model with initial data:", initialData);
    }
  }, [surveyModel, initialData, mode]);

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
}
