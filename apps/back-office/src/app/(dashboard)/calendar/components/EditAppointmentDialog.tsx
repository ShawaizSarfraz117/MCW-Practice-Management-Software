"use client";

import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@mcw/ui";
import { useForm } from "@tanstack/react-form";

import { useClinicianData } from "./appointment-dialog/hooks/useClinicianData";
import { useAppointmentData } from "./appointment-dialog/hooks/useAppointmentData";
import { FormProvider } from "./appointment-dialog/context/FormContext";
import { useFormTabs } from "./appointment-dialog/hooks/useFormTabs";
import { calculateDuration } from "./appointment-dialog/utils/CalculateDuration";

import {
  AppointmentDialogProps,
  FormInterface,
} from "./appointment-dialog/types";
import { EditAppointmentTab } from "./appointment-dialog/EditAppointmentTab";
import { EditEvent } from "./appointment-dialog/EditEvent";

function adaptFormToInterface(originalForm: unknown): FormInterface {
  return originalForm as FormInterface;
}

export function EditAppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateClient,
  onDone,
  appointmentData,
  isViewMode = false,
}: AppointmentDialogProps) {
  const [duration, setDuration] = useState<string>("50 mins");
  const [_generalError, setGeneralError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState({});

  // Use custom hooks
  const {
    clinicianId: effectiveClinicianId,
    isAdmin,
    isClinician,
    isLoading: isLoadingClinicianData,
    shouldFetchData,
    sessionStatus,
  } = useClinicianData();

  const {
    activeTab,
    setActiveTab,
    appointmentFormValues,
    setAppointmentFormValues,
    eventFormValues,
    setEventFormValues,
    forceUpdate,
  } = useFormTabs(effectiveClinicianId, selectedDate);

  // Initialize form
  const form = useForm({
    defaultValues:
      activeTab === "appointment" ? appointmentFormValues : eventFormValues,
    onSubmit: async ({ value }) => {
      // Reset validation errors
      setValidationErrors({});

      // Only validate time format if time fields are provided
      if (value.startTime || value.endTime) {
        const timeRegex = /^(1[0-2]|0?[1-9]):[0-5][0-9] (AM|PM)$/;
        if (
          !timeRegex.test(value.startTime) ||
          !timeRegex.test(value.endTime)
        ) {
          return;
        }
      }
    },
  });

  const allDay = form.getFieldValue("allDay");
  const startDate = form.getFieldValue("startDate");
  const endDate = form.getFieldValue("endDate");
  const startTime = form.getFieldValue("startTime");
  const endTime = form.getFieldValue("endTime");

  // Update duration when times change
  useEffect(() => {
    setDuration(
      calculateDuration(startDate, endDate, startTime, endTime, allDay),
    );
  }, [startDate, endDate, startTime, endTime, allDay]);

  // Set initial values and handle appointment data in view mode
  useAppointmentData({
    open,
    selectedDate,
    effectiveClinicianId,
    isViewMode,
    appointmentData,
    setAppointmentFormValues,
    setEventFormValues,
    setActiveTab,
    form: adaptFormToInterface(form),
  });

  // Prevent dialog from closing when interacting with date pickers
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "Escape" &&
        (document.activeElement?.classList.contains("rdp-button") ||
          document.activeElement?.closest(".rdp") ||
          document.activeElement?.closest("[data-timepicker]"))
      ) {
        e.stopPropagation();
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [open]);

  return (
    <Dialog
      modal={false}
      open={open}
      onOpenChange={(newOpen) => {
        if (!newOpen) {
          // Reset form based on active tab
          if (activeTab === "appointment") {
            form.reset(appointmentFormValues);
          } else if (activeTab === "event") {
            form.reset(eventFormValues);
          }
        }
        onOpenChange(newOpen);
      }}
    >
      <DialogContent className="p-0 gap-0 w-[464px] max-h-[90vh] overflow-auto rounded-none">
        {isLoadingClinicianData ||
        (isClinician &&
          !effectiveClinicianId &&
          sessionStatus === "authenticated") ? (
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-t-2 border-[#16A34A] mx-auto mb-4" />
              <p className="text-gray-500">Loading user data...</p>
            </div>
          </div>
        ) : (
          <FormProvider
            duration={duration}
            effectiveClinicianId={effectiveClinicianId}
            forceUpdate={forceUpdate}
            form={adaptFormToInterface(form)}
            isAdmin={isAdmin}
            isClinician={isClinician}
            setGeneralError={setGeneralError}
            setValidationErrors={setValidationErrors}
            shouldFetchData={shouldFetchData}
            validationErrors={validationErrors}
          >
            <form
              className="space-y-4"
              onPointerDownCapture={(e) => {
                if (
                  e.target &&
                  ((e.target as HTMLElement).classList.contains("rdp-button") ||
                    (e.target as HTMLElement).closest(".rdp") ||
                    (e.target as HTMLElement).closest("[data-timepicker]"))
                ) {
                  e.stopPropagation();
                }
              }}
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <div className="px-6 space-y-4">
                {activeTab === "appointment" ? (
                  <EditAppointmentTab
                    appointmentData={appointmentData}
                    selectedDate={selectedDate}
                    onCreateClient={onCreateClient}
                    onDone={onDone}
                  />
                ) : (
                  <EditEvent
                    appointmentData={appointmentData}
                    selectedDate={selectedDate}
                  />
                )}
              </div>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
