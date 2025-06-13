import { useTemplates, Template } from "../../hooks/useTemplates";
import { TemplateType } from "@/types/templateTypes";

export function useAppointmentTemplates(selectedNote: string) {
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    is_active: true,
  });

  // Get progress notes, excluding psychotherapy templates
  const getProgressNotes = () => {
    if (!templatesData?.data) return [];
    return templatesData.data.filter(
      (template: Template) =>
        template.type === TemplateType.PROGRESS_NOTES &&
        // Exclude psychotherapy templates from progress notes
        !template.name.toLowerCase().includes("psycho") &&
        template.name !== "Physco" &&
        template.name !== "Psychotherapy Note",
    );
  };

  const progressNotes: Template[] = !isLoadingTemplates
    ? getProgressNotes()
    : [];

  const selectedTemplate = progressNotes.find((t) => t.id === selectedNote);

  // Find psychotherapy template specifically (separate from progress notes)
  const psychoTemplate = templatesData?.data?.find(
    (template: Template) =>
      template.name === "Physco" ||
      template.name === "Psychotherapy Note" ||
      template.name.toLowerCase().includes("psycho"),
  );

  return {
    templatesData,
    isLoadingTemplates,
    progressNotes,
    selectedTemplate,
    psychoTemplate,
  };
}
