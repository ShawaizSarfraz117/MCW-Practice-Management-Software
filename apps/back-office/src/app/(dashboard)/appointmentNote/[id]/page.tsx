"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  Button,
  Toaster,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useTemplates, Template } from "./../hooks/useTemplates";
import { MoreHorizontal, FileText, Video } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { showErrorToast } from "@mcw/utils";

import { TemplateType } from "@/types/templateTypes";
import { ProgressNoteSection } from "./components/ProgressNoteSection";
import { PsychotherapyNoteSection } from "./components/PsychotherapyNoteSection";
import { AppointmentSidebar } from "./components/AppointmentSidebar";

type SurveyAnswerInput = {
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

// API utilities
async function fetchSurveyAnswer(appointmentId: string, templateId?: string) {
  const url = templateId
    ? `/api/appointmentNote?appointment_id=${appointmentId}&template_id=${templateId}`
    : `/api/appointmentNote?appointment_id=${appointmentId}`;

  console.log("Fetching from URL:", url);
  const res = await fetch(url);
  console.log("Response status:", res.status, res.statusText);

  if (!res.ok) {
    const errorText = await res.text();
    console.log("Error response:", errorText);
    throw new Error(`Failed to fetch note: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  console.log("API response data:", data);
  return data;
}

async function createSurveyAnswer(data: SurveyAnswerInput) {
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
async function updateSurveyAnswer(
  id: string,
  data: Partial<SurveyAnswerInput>,
) {
  const res = await fetch("/api/appointmentNote", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...data }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update note");
  }
  return res.json();
}

async function deleteSurveyAnswer(id: string) {
  const res = await fetch(`/api/appointmentNote?id=${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete note");
  }
  return res.json();
}

// Fetch appointment details
async function fetchAppointmentDetails(appointmentId: string) {
  const res = await fetch(`/api/appointment?appointment_id=${appointmentId}`);
  if (!res.ok) throw new Error("Failed to fetch appointment");
  const appointments = await res.json();
  return appointments.find((apt: { id: string }) => apt.id === appointmentId);
}

// Update appointment details
async function updateAppointment(
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

// Fetch client appointments
async function fetchClientAppointments(
  clientId: string,
  currentAppointmentId: string,
) {
  const res = await fetch(
    `/api/client/${clientId}/appointments?current_appointment_id=${currentAppointmentId}`,
  );
  if (!res.ok) throw new Error("Failed to fetch client appointments");
  return res.json();
}

export default function AppointmentNotePage() {
  const params = useParams();
  const queryClient = useQueryClient();
  const appointmentId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";
  const { data: templatesData, isLoading: isLoadingTemplates } = useTemplates({
    is_active: true,
  });

  // Fetch appointment details
  const { data: appointment, isLoading: isLoadingAppointment } = useQuery({
    queryKey: ["appointment", appointmentId],
    queryFn: () => fetchAppointmentDetails(appointmentId),
    enabled: !!appointmentId,
  });

  // Get client ID from appointment
  const clientInfo =
    appointment?.ClientGroup?.ClientGroupMembership?.[0]?.Client;
  const clientId = clientInfo?.id;

  // Fetch client appointments
  const { data: clientAppointments, isLoading: isLoadingClientAppointments } =
    useQuery({
      queryKey: ["clientAppointments", clientId, appointmentId],
      queryFn: () => fetchClientAppointments(clientId!, appointmentId),
      enabled: !!clientId && !!appointmentId,
    });

  const getProgressNotes = () => {
    if (!templatesData?.data) return [];
    return templatesData.data.filter(
      (template: Template) => template.type === TemplateType.PROGRESS_NOTES,
    );
  };

  // UI state
  const [activeTab, setActiveTab] = useState("appointment-info");
  const [selectedNote, setSelectedNote] = useState("");
  const [showPsychotherapyNote, setShowPsychotherapyNote] = useState(false);
  const [showEditProgressNote, setShowEditProgressNote] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [appointmentTime, setAppointmentTime] = useState("");
  const [appointmentDuration, setAppointmentDuration] = useState("60");
  const progressNotes: Template[] = !isLoadingTemplates
    ? getProgressNotes()
    : [];

  // Set default to first template when progressNotes is loaded
  useEffect(() => {
    if (progressNotes.length > 0 && !selectedNote) {
      setSelectedNote(progressNotes[0].name);
    }
  }, [progressNotes, selectedNote]);

  // Debug appointment data
  useEffect(() => {
    if (appointment) {
      console.log("Appointment data structure:", appointment);
      console.log("Clinician:", appointment.Clinician);
      console.log("Location:", appointment.Location);
      console.log(
        "Service/PracticeService:",
        appointment.Service,
        appointment.PracticeService,
      );
    }
  }, [appointment]);

  // Get the selected template object for Progress Notes
  const selectedTemplate = progressNotes.find(
    (template) => template.name === selectedNote,
  );

  // Fetch note for the selected Progress Note template
  const {
    data: progressNote,
    isLoading: isLoadingProgressNote,
    error: progressNoteError,
  } = useQuery({
    queryKey: ["surveyAnswer", appointmentId, selectedTemplate?.id],
    queryFn: () =>
      selectedTemplate
        ? fetchSurveyAnswer(appointmentId, selectedTemplate.id)
        : null,
    enabled: !!appointmentId && !!selectedTemplate,
  });

  // Find psychotherapy template (you might want to make this configurable)
  const psychoTemplate = progressNotes.find(
    (template) => template.name === "Physco",
  );

  console.log("Debug - psychoTemplate found:", psychoTemplate);
  console.log("Debug - appointmentId:", appointment);
  console.log("Debug - progressNotes:", progressNotes);

  // Fetch note for the Psychotherapy template
  const { data: psychoNote, isLoading: isLoadingPsychoNote } = useQuery({
    queryKey: ["surveyAnswer", appointmentId, psychoTemplate?.id],
    queryFn: () => {
      console.log("Fetching psychotherapy note with:", {
        appointmentId,
        templateId: psychoTemplate?.id,
      });
      return psychoTemplate
        ? fetchSurveyAnswer(appointmentId, psychoTemplate.id)
        : null;
    },
    enabled: !!appointmentId && !!psychoTemplate,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: createSurveyAnswer,
    onSuccess: (_data, variables) => {
      // Invalidate both the specific template query and the general appointment query
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId, variables.template_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId],
      });
      toast({
        title: "Success",
        description: "Note saved successfully",
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
      // Invalidate appointment queries
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
      // Invalidate appointment queries
      queryClient.invalidateQueries({
        queryKey: ["surveyAnswer", appointmentId],
      });
      toast({
        title: "Success",
        description: "Note deleted successfully",
      });
      // Reset edit states
      setShowEditProgressNote(false);
      setShowPsychotherapyNote(false);
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
      setShowEditAppointment(false);
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });
  console.log("clientInfo", clientInfo);
  // Handlers
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
    setShowPsychotherapyNote(false);
  };

  const handleCancelPsychotherapyNote = () => {
    setShowPsychotherapyNote(false);
  };

  const handleCancelProgressNote = () => {
    setShowEditProgressNote(false);
  };

  const handleDeleteProgressNote = () => {
    if (!progressNote || !selectedTemplate) return;

    deleteMutation.mutate({
      noteId: progressNote.id,
    });
  };

  const handleDeletePsychotherapyNote = () => {
    if (!psychoNote || !psychoTemplate) return;

    deleteMutation.mutate({
      noteId: psychoNote.id,
    });
  };

  const handleSaveAppointment = () => {
    if (!appointmentDate || !appointmentTime || !appointmentDuration) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    // Parse the date and time
    const [year, month, day] = appointmentDate.split("-").map(Number);
    const [hours, minutes] = appointmentTime.split(":").map(Number);

    // Create start date
    const startDate = new Date(year, month - 1, day, hours, minutes);

    // Calculate end date based on duration
    const endDate = new Date(
      startDate.getTime() + parseInt(appointmentDuration) * 60000,
    );

    updateAppointmentMutation.mutate({
      appointmentId,
      data: {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
      },
    });
  };

  // Show loading/error
  if (isLoadingAppointment || isLoadingTemplates) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }
  if (
    progressNoteError &&
    progressNoteError.message !== "Failed to fetch note"
  ) {
    return (
      <div className="p-8 text-center text-red-500">
        Error: {progressNoteError.message}
      </div>
    );
  }
  if (!appointment) {
    return (
      <div className="p-8 text-center text-red-500">Appointment not found</div>
    );
  }
  if (!clientId) {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          Client information not found for this appointment
        </div>
        <div className="text-sm text-gray-600">
          Please check the appointment configuration or contact support.
        </div>
        <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(appointment, null, 2)}
        </pre>
      </div>
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-semibold text-gray-900">
                {clientInfo
                  ? `${clientInfo.legal_first_name} ${clientInfo.legal_last_name}`
                  : "Client"}
              </h1>
              <span className="text-gray-500">
                {clientInfo?.date_of_birth
                  ? new Date(clientInfo.date_of_birth).toLocaleDateString()
                  : "DOB not available"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <FileText className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Video className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex">
          {/* Main Content Area */}
          <div className="flex-1 p-6">
            <div className="max-w-5xl">
              {/* Progress Note Section */}
              <ProgressNoteSection
                progressNotes={progressNotes}
                selectedNote={selectedNote}
                setSelectedNote={setSelectedNote}
                selectedTemplate={selectedTemplate}
                progressNote={progressNote}
                isLoadingProgressNote={isLoadingProgressNote}
                showEditProgressNote={showEditProgressNote}
                setShowEditProgressNote={setShowEditProgressNote}
                handleSaveProgressNote={handleSaveProgressNote}
                handleCancelProgressNote={handleCancelProgressNote}
                handleDeleteProgressNote={handleDeleteProgressNote}
                createMutationStatus={createMutation.status}
                updateMutationStatus={updateMutation.status}
              />

              {/* Psychotherapy Note Section */}
              <PsychotherapyNoteSection
                psychoTemplate={psychoTemplate}
                psychoNote={psychoNote}
                isLoadingPsychoNote={isLoadingPsychoNote}
                showPsychotherapyNote={showPsychotherapyNote}
                setShowPsychotherapyNote={setShowPsychotherapyNote}
                handleSavePsychotherapyNote={handleSavePsychotherapyNote}
                handleCancelPsychotherapyNote={handleCancelPsychotherapyNote}
                handleDeletePsychotherapyNote={handleDeletePsychotherapyNote}
                createMutationStatus={createMutation.status}
                updateMutationStatus={updateMutation.status}
              />
            </div>
          </div>

          {/* Right Sidebar */}
          <AppointmentSidebar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            appointment={appointment}
            clientAppointments={clientAppointments}
            isLoadingClientAppointments={isLoadingClientAppointments}
            clientId={clientId}
            onEditClick={() => {
              // Initialize form values from appointment data
              if (appointment?.start_date) {
                const startDate = new Date(appointment.start_date);
                const endDate = appointment?.end_date
                  ? new Date(appointment.end_date)
                  : startDate;

                // Format date as YYYY-MM-DD for input
                const dateStr = startDate.toISOString().split("T")[0];
                setAppointmentDate(dateStr);

                // Format time as HH:MM for input
                const hours = startDate.getHours().toString().padStart(2, "0");
                const minutes = startDate
                  .getMinutes()
                  .toString()
                  .padStart(2, "0");
                setAppointmentTime(`${hours}:${minutes}`);

                // Calculate duration in minutes
                const durationMs = endDate.getTime() - startDate.getTime();
                const durationMins = Math.round(durationMs / 60000);
                setAppointmentDuration(durationMins.toString());
              }
              setShowEditAppointment(true);
            }}
          />
        </div>

        {/* Edit Appointment Dialog */}
        <Dialog
          open={showEditAppointment}
          onOpenChange={setShowEditAppointment}
        >
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Appointment</DialogTitle>
              <DialogDescription>
                Update the appointment date, time, and duration.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={appointmentDate}
                  onChange={(e) => setAppointmentDate(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={appointmentTime}
                  onChange={(e) => setAppointmentTime(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <Select
                  value={appointmentDuration}
                  onValueChange={setAppointmentDuration}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                    <SelectItem value="90">90 minutes</SelectItem>
                    <SelectItem value="120">120 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowEditAppointment(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveAppointment}
                disabled={updateAppointmentMutation.status === "pending"}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {updateAppointmentMutation.status === "pending"
                  ? "Saving..."
                  : "Save changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
