import { useQuery } from "@tanstack/react-query";
import { TemplateType } from "@/types/templateTypes";

export interface ShareableTemplate {
  id: string;
  name: string;
  content: string;
  type: TemplateType;
  description: string | null;
  frequency_options: Record<string, unknown> | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  requires_signature: boolean;
  is_shareable: boolean;
}

export function useShareableTemplates() {
  return useQuery({
    queryKey: ["shareable-templates"],
    queryFn: async () => {
      const response = await fetch("/api/templates?sharable=true&is_active=true");
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to fetch shareable templates");
      }
      return response.json();
    },
  });
}

// Helper functions to filter templates by type
export function filterTemplatesByType(templates: ShareableTemplate[], type: TemplateType) {
  return templates.filter(template => template.type === type);
}

export function getConsentForms(templates: ShareableTemplate[]) {
  return templates.filter(template => 
    template.type === TemplateType.OTHER_DOCUMENTS && 
    template.name.toLowerCase().includes('consent')
  );
}

export function getScoredMeasures(templates: ShareableTemplate[]) {
  return filterTemplatesByType(templates, TemplateType.SCORED_MEASURES);
}

export function getIntakeForms(templates: ShareableTemplate[]) {
  return filterTemplatesByType(templates, TemplateType.INTAKE_FORMS);
}