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
      console.log("=== DEBUG SurveyPreview: Setting up survey ===");
      console.log("Initial data received:", initialData);
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

        // Set initial data if provided before setting model
        if (initialData && mode === "edit") {
          console.log("=== DEBUG SurveyPreview: Setting initial data on model ===");
          console.log("Initial data to set:", initialData);
          // Use setValue for each field to ensure proper binding
          Object.keys(initialData).forEach(key => {
            if (initialData[key] !== undefined && initialData[key] !== null) {
              const value = initialData[key];
              // Convert string boolean values to actual booleans for checkboxes
              let finalValue = value;
              if (value === "true") finalValue = true;
              else if (value === "false") finalValue = false;
              else if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
                // Try to parse array strings (for multiple checkbox values)
                try {
                  finalValue = JSON.parse(value);
                } catch (_e) {
                  console.log("Failed to parse array string:", value);
                }
              }
              
              model.setValue(key, finalValue);
            }
          });
          console.log("Model data after setting:", model.data);
        }

        // Ensure mode is properly set
        console.log("=== DEBUG SurveyPreview: Final model mode ===", model.mode);
        console.log("=== DEBUG SurveyPreview: Model is read-only? ===", model.isReadOnly);
        
        // Store model reference if provided (after data is set)
        if (modelRef) {
          modelRef.current = model;
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
  }, [content, title, type, mode]); // Remove initialData from deps to prevent re-creation

  // Handle initial data updates separately
  useEffect(() => {
    if (surveyModel && initialData && mode === "edit") {
      console.log("=== DEBUG SurveyPreview: Updating survey with initial data ===");
      Object.keys(initialData).forEach(key => {
        if (initialData[key] !== undefined && initialData[key] !== null) {
          const value = initialData[key];
          console.log(`Setting ${key}:`, value, "type:", typeof value);
          
          // Convert string boolean values to actual booleans for checkboxes
          let finalValue = value;
          if (value === "true") finalValue = true;
          else if (value === "false") finalValue = false;
          else if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
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
  }, [surveyModel, initialData, mode]);

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
    <div className="survey-preview-container" 
         onClick={() => console.log("=== DEBUG: Survey container clicked, mode:", surveyModel?.mode, "isReadOnly:", surveyModel?.isReadOnly)}>
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
