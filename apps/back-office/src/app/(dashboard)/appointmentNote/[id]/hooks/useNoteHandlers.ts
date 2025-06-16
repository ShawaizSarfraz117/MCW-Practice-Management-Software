import { toast } from "@mcw/ui";
import { Template } from "../../hooks/useTemplates";
import { SurveyAnswerInput } from "../services/appointmentNote.service";

interface UseNoteHandlersProps {
  clientId?: string;
  appointmentId: string;
  selectedTemplate?: Template;
  psychoTemplate?: Template;
  progressNote?: { id: string } | null;
  psychoNote?: { id: string } | null;
  createMutation: {
    mutate: (data: SurveyAnswerInput) => void;
  };
  updateMutation: {
    mutate: (data: {
      noteId: string;
      data: Partial<SurveyAnswerInput>;
    }) => void;
  };
  deleteMutation: {
    mutate: (data: { noteId: string }) => void;
  };
  updateAppointmentMutation: {
    mutate: (data: {
      appointmentId: string;
      data: { start_date: string; end_date: string };
    }) => void;
  };
  setShowEditProgressNote: (show: boolean) => void;
  setShowPsychotherapyNote: (show: boolean) => void;
}

export function useNoteHandlers({
  clientId,
  appointmentId,
  selectedTemplate,
  psychoTemplate,
  progressNote,
  psychoNote,
  createMutation,
  updateMutation,
  deleteMutation,
  updateAppointmentMutation,
  setShowEditProgressNote,
  setShowPsychotherapyNote,
}: UseNoteHandlersProps) {
  const handleSaveProgressNote = (result: Record<string, unknown>) => {
    if (!clientId || !selectedTemplate) {
      toast({
        title: "Error",
        description:
          "Unable to save note: Missing client or template information",
        variant: "destructive",
      });
      return;
    }

    if (progressNote) {
      updateMutation.mutate({
        noteId: progressNote.id,
        data: { content: JSON.stringify(result) },
      });
    } else {
      createMutation.mutate({
        template_id: selectedTemplate.id,
        client_id: clientId,
        content: JSON.stringify(result),
        appointment_id: appointmentId,
        status: "COMPLETED",
      });
    }
  };

  const handleSavePsychotherapyNote = (result: Record<string, unknown>) => {
    if (!clientId || !psychoTemplate) {
      toast({
        title: "Error",
        description:
          "Unable to save note: Missing client or template information",
        variant: "destructive",
      });
      return;
    }

    if (psychoNote) {
      updateMutation.mutate({
        noteId: psychoNote.id,
        data: { content: JSON.stringify(result) },
      });
    } else {
      createMutation.mutate({
        template_id: psychoTemplate.id,
        client_id: clientId,
        content: JSON.stringify(result),
        appointment_id: appointmentId,
        status: "COMPLETED",
      });
    }
  };

  const handleCancelProgressNote = () => {
    setShowEditProgressNote(false);
  };

  const handleCancelPsychotherapyNote = () => {
    setShowPsychotherapyNote(false);
  };

  const handleDeleteProgressNote = () => {
    if (progressNote?.id) {
      deleteMutation.mutate({ noteId: progressNote.id });
    }
  };

  const handleDeletePsychotherapyNote = () => {
    if (psychoNote?.id) {
      deleteMutation.mutate({ noteId: psychoNote.id });
    }
  };

  const handleSaveAppointment = (
    date: string,
    time: string,
    duration: string,
  ) => {
    // Parse date (YYYY-MM-DD)
    const [year, month, day] = date.split("-").map(Number);

    // Parse time (HH:MM)
    const [hours, minutes] = time.split(":").map(Number);

    // Create start date
    const startDate = new Date(year, month - 1, day, hours, minutes);

    // Calculate end date based on duration
    const endDate = new Date(startDate.getTime() + parseInt(duration) * 60000);

    updateAppointmentMutation.mutate({
      appointmentId,
      data: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
    });
  };

  return {
    handleSaveProgressNote,
    handleSavePsychotherapyNote,
    handleCancelProgressNote,
    handleCancelPsychotherapyNote,
    handleDeleteProgressNote,
    handleDeletePsychotherapyNote,
    handleSaveAppointment,
  };
}
