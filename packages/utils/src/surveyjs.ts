import { Model, ITheme } from "survey-core";
import { DefaultLight } from "survey-core/themes";
import "survey-core/survey-core.min.css";

// Define survey JSON type
export type SurveyJson = Record<string, unknown>;

// Define survey mode types
export type SurveyMode = "display" | "edit" | "preview";

// Configure SurveyJS theme
export const configureSurveyTheme = (): ITheme => {
  // Create a custom theme based on DefaultLight with custom CSS variables
  const customTheme: ITheme = {
    ...DefaultLight,
    cssVariables: {
      ...DefaultLight.cssVariables,
      "--sjs-primary-backcolor": "#10b981",
      "--sjs-primary-backcolor-light": "#d1fae5",
      "--sjs-primary-backcolor-dark": "#059669",
      "--sjs-primary-forecolor": "#ffffff",
      "--sjs-primary-forecolor-light": "#ffffff",
      "--sjs-base-unit": "8px",
      "--sjs-corner-radius": "6px",
      "--sjs-secondary-backcolor": "#f3f4f6",
      "--sjs-secondary-forecolor": "#111827",
      "--sjs-shadow-small": "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
      "--sjs-shadow-medium": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
      "--sjs-border-default": "#e5e7eb",
      "--sjs-border-light": "#f3f4f6",
    },
    isPanelless: false,
  };

  return customTheme;
};

// Create survey model with configuration
export const createSurveyModel = (
  json: SurveyJson,
  mode: SurveyMode = "display",
  options?: {
    showNavigationButtons?: boolean;
    showCompletedPage?: boolean;
    showQuestionNumbers?: boolean;
    showProgressBar?: string;
    theme?: ITheme;
  },
): Model => {
  const survey = new Model(json);

  // Apply theme (use custom theme or default)
  const theme = options?.theme || configureSurveyTheme();
  survey.applyTheme(theme);

  // Set mode
  survey.mode = mode;

  // Apply default options
  survey.showNavigationButtons = options?.showNavigationButtons ?? false;
  survey.showCompletedPage = options?.showCompletedPage ?? false;
  survey.showQuestionNumbers = options?.showQuestionNumbers ?? "on";
  survey.showProgressBar = options?.showProgressBar ?? "off";
  survey.showCompleteButton = true;

  // Configure for preview/display mode
  if (mode === "display" || mode === "preview") {
    survey.showNavigationButtons = false;
    survey.showCompletedPage = false;
  }

  // For edit mode, ensure survey can be completed programmatically
  if (mode === "edit") {
    survey.showCompleteButton = false; // Hide the built-in complete button since we use external button
    survey.showCompletedPage = false; // Prevent auto-redirect after completion
  }

  return survey;
};

// Parse survey content safely
export const parseSurveyContent = (content: string): SurveyJson | null => {
  try {
    if (!content || content.trim() === "") {
      return null;
    }
    const parsed = JSON.parse(content);
    return parsed as SurveyJson;
  } catch (error) {
    console.error("Failed to parse survey content:", error);
    return null;
  }
};

// Generate default survey JSON for different template types
export const getDefaultSurveyJson = (
  templateType: string,
  title: string,
): SurveyJson => {
  return {
    title: title,
    pages: [
      {
        name: "page1",
        elements: [
          {
            type: "html",
            name: "placeholder",
            html: `<div style="text-align: center; padding: 40px;">
              <p style="color: #6b7280; font-size: 16px;">
                This template does not have a survey preview configured yet.
              </p>
              <p style="color: #9ca3af; font-size: 14px; margin-top: 8px;">
                Template type: ${templateType}
              </p>
            </div>`,
          },
        ],
      },
    ],
  };
};
