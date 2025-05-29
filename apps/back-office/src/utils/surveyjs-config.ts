import { Model } from "survey-core";

// Define a type for the survey JSON structure
export type SurveyJson = Record<string, unknown>;

export function createSurveyModel(json: SurveyJson): Model {
  return new Model(json);
}
