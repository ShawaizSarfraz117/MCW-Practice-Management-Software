"use client";

import { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@mcw/ui";
import { useForm } from "@tanstack/react-form";

import { AppointmentTab } from "./appointment-dialog/AppointmentTab";
import { EventTab } from "./appointment-dialog/EventTab";
import { useClinicianData } from "./appointment-dialog/hooks/useClinicianData";
import { useAppointmentData } from "./appointment-dialog/hooks/useAppointmentData";
import { FormProvider } from "./appointment-dialog/context/FormContext";
import { useFormTabs } from "./appointment-dialog/hooks/useFormTabs";
import { calculateDuration } from "./appointment-dialog/utils/CalculateDuration";
import {
  AppointmentDialogProps,
  FormInterface,
} from "./appointment-dialog/types";

// Helper function to adapt the form to our interface using type assertion
function adaptFormToInterface(originalForm: unknown): FormInterface {
  return originalForm as FormInterface;
}

export function AppointmentDialog({
  open,
  onOpenChange,
  selectedDate,
  onCreateClient,
  onDone,
  appointmentData,
  isViewMode = false,
}: AppointmentDialogProps) {
  const [duration, setDuration] = useState<string>("50 mins");
  const [generalError, setGeneralError] = useState<string | null>(null);
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
      setGeneralError(null);

      // Validate required fields
      const errors: Record<string, boolean> = {};
      let hasErrors = false;

      // Validate time fields format
      if (!value.startTime || !value.endTime) {
        setGeneralError("Time fields are required");
        return;
      }

      // Time format validation - accept both 12-hour and 24-hour formats
      const time24Regex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      const time12Regex = /^(0?[1-9]|1[0-2]):[0-5][0-9]\s(AM|PM)$/i;

      const isValidStartTime =
        time24Regex.test(value.startTime) || time12Regex.test(value.startTime);
      const isValidEndTime =
        time24Regex.test(value.endTime) || time12Regex.test(value.endTime);

      if (!isValidStartTime || !isValidEndTime) {
        setGeneralError("Invalid time format. Please select a valid time.");
        return;
      }

      // Tab-specific validation
      if (activeTab === "appointment") {
        if (!value.clientGroup) errors.client = true;
        if (!value.clinician) errors.clinician = true;
        if (!value.location) errors.location = true;
        if (
          value.selectedServices?.length > 0 &&
          !value.selectedServices[0].serviceId
        )
          errors.service = true;
      } else if (activeTab === "event") {
        if (!value.clinician) errors.clinician = true;
        if (!value.location) errors.location = true;
        if (!value.eventName) errors.eventName = true;
      }

      hasErrors = Object.values(errors).some(Boolean);

      if (hasErrors) {
        setValidationErrors(errors);
        setGeneralError("Please fill in all required fields marked with *");
        return;
      }

      // Dispatch event and close dialog
      window.dispatchEvent(
        new CustomEvent("appointmentFormSubmit", {
          detail: { formValues: value },
        }),
      );

      // Clear all states after successful submission
      setAppointmentFormValues({
        type: "appointment",
        eventName: "",
        clientType: "individual",
        clientGroup: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [{ serviceId: "", fee: 0 }],
        startDate: selectedDate || new Date(),
        endDate: selectedDate || new Date(),
        startTime: "12:00",
        endTime: "12:50",
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: true,
        notifyClients: true,
      });

      setEventFormValues({
        type: "event",
        eventName: "",
        clientType: "individual",
        clientGroup: "",
        clinician: effectiveClinicianId || "",
        selectedServices: [],
        startDate: selectedDate || new Date(),
        endDate: selectedDate || new Date(),
        startTime: "12:00",
        endTime: "12:50",
        location: "sp",
        recurring: false,
        allDay: false,
        cancelAppointments: false,
        notifyClients: false,
      });

      onOpenChange(false);
      if (onDone) onDone();
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
              <Tabs
                className="w-full"
                value={activeTab}
                onValueChange={(value) => {
                  if (activeTab === "appointment") {
                    setAppointmentFormValues(form.state.values);
                  } else if (activeTab === "event") {
                    setEventFormValues(form.state.values);
                  }

                  setActiveTab(value as "appointment" | "event" | "out");
                  form.setFieldValue("type", value as "appointment" | "event");

                  if (value === "event") {
                    form.reset(eventFormValues);
                  } else if (value === "appointment") {
                    form.reset(appointmentFormValues);
                  }

                  forceUpdate();
                }}
              >
                <TabsList className="h-12 w-full rounded-none bg-transparent p-0 border-b">
                  <TabsTrigger
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                    disabled={isViewMode && activeTab !== "appointment"}
                    value="appointment"
                  >
                    Appointment
                  </TabsTrigger>
                  <TabsTrigger
                    className="h-12 rounded-none border-b-2 border-transparent data-[state=active]:border-[#16A34A] data-[state=active]:bg-transparent data-[state=active]:text-[#16A34A] flex-1 text-sm font-normal"
                    disabled={isViewMode && activeTab !== "event"}
                    value="event"
                  >
                    Event
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="px-6 space-y-4">
                {activeTab === "appointment" ? (
                  <AppointmentTab
                    appointmentData={appointmentData}
                    selectedDate={selectedDate}
                    onCreateClient={onCreateClient}
                  />
                ) : (
                  <EventTab />
                )}
              </div>

              <DialogFooter className="px-6 py-4 border-t">
                {generalError && (
                  <p className="text-sm text-red-500 mr-auto">{generalError}</p>
                )}
                <Button
                  className="h-9 px-4 rounded-none hover:bg-transparent"
                  type="button"
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                >
                  {isViewMode ? "Close" : "Cancel"}
                </Button>
                {!isViewMode && (
                  <Button
                    className="h-9 px-4 bg-[#16A34A] hover:bg-[#16A34A]/90 rounded-none"
                    disabled={sessionStatus !== "authenticated"}
                    type="submit"
                  >
                    Done
                  </Button>
                )}
              </DialogFooter>
            </form>
          </FormProvider>
        )}
      </DialogContent>
    </Dialog>
  );
}
