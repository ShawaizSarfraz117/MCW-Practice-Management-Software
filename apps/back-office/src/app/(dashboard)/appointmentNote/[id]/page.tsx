"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Toaster } from "@mcw/ui";

import { ProgressNoteSection } from "./components/ProgressNoteSection";
import { PsychotherapyNoteSection } from "./components/PsychotherapyNoteSection";
import { AppointmentSidebar } from "./components/AppointmentSidebar";
import { AppointmentNoteHeader } from "./components/AppointmentNoteHeader";
import { EditAppointmentDialog } from "./components/EditAppointmentDialog";
import { AppointmentNoteErrorState } from "./components/AppointmentNoteErrorStates";
import { useAppointmentData } from "./hooks/useAppointmentData";
import { useAppointmentNoteMutations } from "./hooks/useAppointmentNoteMutations";
import { useNoteHandlers } from "./hooks/useNoteHandlers";
import { useAppointmentTemplates } from "./hooks/useAppointmentTemplates";

export default function AppointmentNotePage() {
  const params = useParams();
  const appointmentId =
    typeof params.id === "string"
      ? params.id
      : Array.isArray(params.id)
        ? params.id[0]
        : "";

  // UI state
  const [activeTab, setActiveTab] = useState("appointment-info");
  const [selectedNote, setSelectedNote] = useState("");
  const [showPsychotherapyNote, setShowPsychotherapyNote] = useState(false);
  const [showEditProgressNote, setShowEditProgressNote] = useState(false);
  const [showEditAppointment, setShowEditAppointment] = useState(false);

  // Get templates
  const {
    isLoadingTemplates,
    progressNotes,
    selectedTemplate,
    psychoTemplate,
  } = useAppointmentTemplates(selectedNote);

  // Fetch appointment data
  const {
    appointment,
    isLoadingAppointment,
    clientAppointments,
    isLoadingClientAppointments,
    progressNote,
    isLoadingProgressNote,
    progressNoteError,
    psychoNote,
    isLoadingPsychoNote,
  } = useAppointmentData({
    appointmentId,
    clientId: undefined, // Will be set after appointment loads
    selectedTemplateId: selectedTemplate?.id,
    psychoTemplateId: psychoTemplate?.id,
  });

  // Get client info
  const clientInfo =
    appointment?.ClientGroup?.ClientGroupMembership?.[0]?.Client;
  const clientId = clientInfo?.id;

  // Set up mutations
  const {
    createMutation,
    updateMutation,
    deleteMutation,
    updateAppointmentMutation,
  } = useAppointmentNoteMutations({
    appointmentId,
    clientId,
    onEditComplete: () => {
      setShowEditProgressNote(false);
      setShowPsychotherapyNote(false);
      setShowEditAppointment(false);
    },
  });

  // Set up handlers
  const {
    handleSaveProgressNote,
    handleSavePsychotherapyNote,
    handleCancelProgressNote,
    handleCancelPsychotherapyNote,
    handleDeleteProgressNote,
    handleDeletePsychotherapyNote,
    handleSaveAppointment,
  } = useNoteHandlers({
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
  });

  // Set default selected note
  useEffect(() => {
    if (progressNotes.length > 0 && !selectedNote) {
      setSelectedNote(progressNotes[0].id);
    }
  }, [progressNotes, selectedNote]);

  // Show loading/error states
  if (isLoadingAppointment || isLoadingTemplates) {
    return <AppointmentNoteErrorState type="loading" />;
  }

  if (
    progressNoteError &&
    progressNoteError.message !== "Failed to fetch note"
  ) {
    return <AppointmentNoteErrorState error={progressNoteError} type="error" />;
  }

  if (!appointment) {
    return <AppointmentNoteErrorState type="notFound" />;
  }

  if (!clientId) {
    return (
      <AppointmentNoteErrorState appointment={appointment} type="noClient" />
    );
  }

  return (
    <>
      <Toaster />
      <div className="min-h-screen bg-gray-50">
        <AppointmentNoteHeader clientInfo={clientInfo} />

        <div className="flex">
          <div className="flex-1 p-6">
            <div className="max-w-5xl">
              <ProgressNoteSection
                createMutationStatus={createMutation.status}
                handleCancelProgressNote={handleCancelProgressNote}
                handleDeleteProgressNote={handleDeleteProgressNote}
                handleSaveProgressNote={handleSaveProgressNote}
                isLoadingProgressNote={isLoadingProgressNote}
                isLoadingTemplates={isLoadingTemplates}
                progressNote={progressNote}
                progressNotes={progressNotes}
                selectedNote={selectedNote}
                selectedTemplate={selectedTemplate}
                setSelectedNote={setSelectedNote}
                setShowEditProgressNote={setShowEditProgressNote}
                showEditProgressNote={showEditProgressNote}
                updateMutationStatus={updateMutation.status}
              />

              <PsychotherapyNoteSection
                createMutationStatus={createMutation.status}
                handleCancelPsychotherapyNote={handleCancelPsychotherapyNote}
                handleDeletePsychotherapyNote={handleDeletePsychotherapyNote}
                handleSavePsychotherapyNote={handleSavePsychotherapyNote}
                isLoadingPsychoNote={isLoadingPsychoNote}
                psychoNote={psychoNote}
                psychoTemplate={psychoTemplate}
                setShowPsychotherapyNote={setShowPsychotherapyNote}
                showPsychotherapyNote={showPsychotherapyNote}
                updateMutationStatus={updateMutation.status}
              />
            </div>
          </div>

          <AppointmentSidebar
            activeTab={activeTab}
            appointment={appointment}
            clientAppointments={clientAppointments}
            clientId={clientId}
            isLoadingClientAppointments={isLoadingClientAppointments}
            setActiveTab={setActiveTab}
            onEditClick={() => setShowEditAppointment(true)}
          />
        </div>

        <EditAppointmentDialog
          appointment={appointment}
          isSaving={updateAppointmentMutation.status === "pending"}
          open={showEditAppointment}
          onOpenChange={setShowEditAppointment}
          onSave={handleSaveAppointment}
        />
      </div>
    </>
  );
}
