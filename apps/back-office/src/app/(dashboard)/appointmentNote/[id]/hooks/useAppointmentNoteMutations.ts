import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";
import {
  createSurveyAnswer,
  updateSurveyAnswer,
  deleteSurveyAnswer,
  updateAppointment,
  type SurveyAnswerInput,
} from "../services/appointmentNote.service";

interface UseAppointmentNoteMutationsProps {
  appointmentId: string;
  clientId?: string;
  onEditComplete?: () => void;
}

export function useAppointmentNoteMutations({
  appointmentId,
  clientId,
  onEditComplete,
}: UseAppointmentNoteMutationsProps) {
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: SurveyAnswerInput) => createSurveyAnswer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId],
      });
      toast({
        title: "Success",
        description: "Note created successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({
      noteId,
      data,
    }: {
      noteId: string;
      data: Partial<SurveyAnswerInput>;
    }) => updateSurveyAnswer(noteId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId],
      });
      toast({
        title: "Success",
        description: "Note updated successfully",
      });
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: ({ noteId }: { noteId: string }) => deleteSurveyAnswer(noteId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId],
      });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      onEditComplete?.();
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: ({
      appointmentId,
      data,
    }: {
      appointmentId: string;
      data: { start_date: string; end_date: string };
    }) => updateAppointment(appointmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["appointment", appointmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ["clientAppointments", clientId, appointmentId],
      });
      toast({
        title: "Success",
        description: "Appointment updated successfully",
      });
      onEditComplete?.();
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  return {
    createMutation,
    updateMutation,
    deleteMutation,
    updateAppointmentMutation,
  };
}
