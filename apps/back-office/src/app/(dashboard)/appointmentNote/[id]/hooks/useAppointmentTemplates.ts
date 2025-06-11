import { useTemplates, Template } from "../../hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";

export function useAppointmentTemplates(selectedNote: string) {
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    is_active: true,
  });

  const getProgressNotes = () => {
    if (!templatesData?.data) return [];
    return templatesData.data.filter(
      (template: Template) => template.type === TemplateType.PROGRESS_NOTES,
    );
  };

  const progressNotes: Template[] = !isLoadingTemplates
    ? getProgressNotes()
    : [];

  const selectedTemplate = progressNotes.find((t) => t.id === selectedNote);

  // Find psychotherapy template by name (matches original logic)
  const psychoTemplate = progressNotes.find(
    (template) => template.name === "Physco",
  );

  return {
    templatesData,
    isLoadingTemplates,
    progressNotes,
    selectedTemplate,
    psychoTemplate,
  };
}
