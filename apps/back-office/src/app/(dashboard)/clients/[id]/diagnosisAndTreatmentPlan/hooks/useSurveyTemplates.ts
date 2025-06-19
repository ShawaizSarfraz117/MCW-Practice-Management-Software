import { useQuery } from "@tanstack/react-query";
import {
  fetchSurveyTemplates,
  SurveyTemplate,
} from "../services/surveyTemplate.service";

export function useSurveyTemplates(type?: string, isActive?: boolean) {
  return useQuery({
    queryKey: ["survey-templates", type, isActive],
    queryFn: () => fetchSurveyTemplates(type, isActive),
    retry: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export type { SurveyTemplate };
