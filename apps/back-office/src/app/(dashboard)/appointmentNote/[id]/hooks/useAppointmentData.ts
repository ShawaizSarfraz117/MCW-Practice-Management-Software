import { useQuery } from "@tanstack/react-query";
import {
  fetchAppointmentDetails,
  fetchClientAppointments,
  fetchSurveyAnswer,
} from "../services/appointmentNote.service";

interface UseAppointmentDataProps {
  appointmentId: string;
  clientId?: string;
  selectedTemplateId?: string;
  psychoTemplateId?: string;
}

export function useAppointmentData({
  appointmentId,
  clientId,
  selectedTemplateId,
  psychoTemplateId,
}: UseAppointmentDataProps) {
  // Fetch appointment details
  const appointmentQuery = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointmentDetails(appointmentId),
    enabled: !!appointmentId,
  });

  // Get client ID from appointment data
  const fetchedClientId =
    appointmentQuery.data?.ClientGroup?.ClientGroupMembership?.[0]?.Client?.id;
  const actualClientId = clientId || fetchedClientId;

  // Fetch client appointments
  const clientAppointmentsQuery = useQuery({
    queryKey: ["clientAppointments", actualClientId, appointmentId],
    queryFn: () => fetchClientAppointments(actualClientId!, appointmentId),
    enabled: !!actualClientId && !!appointmentId,
  });

  // Fetch progress note
  const progressNoteQuery = useQuery({
    queryKey: ["surveyAnswer", appointmentId, selectedTemplateId],
    queryFn: () => fetchSurveyAnswer(appointmentId, selectedTemplateId),
    enabled: !!appointmentId && !!selectedTemplateId,
  });

  // Fetch psychotherapy note
  const psychoNoteQuery = useQuery({
    queryKey: ["surveyAnswer", appointmentId, psychoTemplateId],
    queryFn: () => fetchSurveyAnswer(appointmentId, psychoTemplateId),
    enabled: !!appointmentId && !!psychoTemplateId,
  });

  return {
    appointment: appointmentQuery.data,
    isLoadingAppointment: appointmentQuery.isLoading,
    clientAppointments: clientAppointmentsQuery.data,
    isLoadingClientAppointments: clientAppointmentsQuery.isLoading,
    progressNote: progressNoteQuery.data,
    isLoadingProgressNote: progressNoteQuery.isLoading,
    progressNoteError: progressNoteQuery.error,
    psychoNote: psychoNoteQuery.data,
    isLoadingPsychoNote: psychoNoteQuery.isLoading,
  };
}
