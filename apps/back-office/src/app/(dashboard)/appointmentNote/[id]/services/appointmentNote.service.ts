// API service for appointment notes
export type SurveyAnswerInput = {
  template_id: string;
  client_id: string;
  content: string;
  status: string;
  frequency?: string | null;
  completed_at?: string | null;
  assigned_at?: string | null;
  expiry_date?: string | null;
  is_intake?: boolean;
  appointment_id?: string | null;
  is_signed?: boolean;
  is_locked?: boolean;
};

export async function fetchSurveyAnswer(
  appointmentId: string,
  templateId?: string,
) {
  const url = templateId
    ? `/api/appointmentNote?appointment_id=${appointmentId}&template_id=${templateId}`
    : `/api/appointmentNote?appointment_id=${appointmentId}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch survey answer");
  return res.json();
}

export async function createSurveyAnswer(data: SurveyAnswerInput) {
  const res = await fetch("/api/appointmentNote", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create note");
  }
  return res.json();
}

export async function updateSurveyAnswer(
  noteId: string,
  data: Partial<SurveyAnswerInput>,
) {
  const res = await fetch("/api/appointmentNote", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id: noteId, ...data }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update note");
  }
  return res.json();
}

export async function deleteSurveyAnswer(noteId: string) {
  const res = await fetch(`/api/appointmentNote?id=${noteId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete note");
  }
  return res.json();
}

export async function fetchAppointmentDetails(appointmentId: string) {
  const res = await fetch(`/api/appointment?appointment_id=${appointmentId}`);
  if (!res.ok) throw new Error("Failed to fetch appointment");
  const appointments = await res.json();
  return appointments.find((apt: { id: string }) => apt.id === appointmentId);
}

export async function updateAppointment(
  appointmentId: string,
  data: {
    start_date: string;
    end_date: string;
  },
) {
  const res = await fetch(`/api/appointment/${appointmentId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update appointment");
  }
  return res.json();
}

export async function fetchClientAppointments(
  clientId: string,
  currentAppointmentId: string,
) {
  const res = await fetch(
    `/api/client/${clientId}/appointments?current_appointment_id=${currentAppointmentId}`,
  );
  if (!res.ok) throw new Error("Failed to fetch client appointments");
  return res.json();
}
