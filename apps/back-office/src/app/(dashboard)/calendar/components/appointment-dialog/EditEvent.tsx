"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Video } from "lucide-react";
import { SearchSelect, Button } from "@mcw/ui";
import { cn } from "@mcw/utils";

import { AppointmentTabProps } from "./types";
import { ValidationError } from "./components/ValidationError";
import { useFormContext } from "./context/FormContext";
import { DateTimeControls } from "./components/FormControls";
import { EditConfirmationModal } from "./EditConfirmationModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { RecurringSettings } from "./components/RecurringSettings";
import { RecurringHeader } from "./components/RecurringHeader";
import { useAppointmentUpdate } from "./hooks/useAppointmentUpdate";
import { useAppointmentDelete } from "../../hooks/useAppointmentDelete";
import { parseRecurringRule } from "../../utils/recurringRuleUtils";

import CallIcon from "../../../../../../public/images/call-icon.svg";
import MessageIcon from "../../../../../../public/images/message-icon.svg";
import EmailIcon from "../../../../../../public/images/email-icon.svg";
import DeleteIcon from "../../../../../../public/images/delete-icon.svg";

interface RecurringInfo {
  period: string;
  endType?: string;
  frequency?: string;
  selectedDays?: string[];
  monthlyPattern?: string;
  endValue?: string | number;
}

export function EditEvent({
  appointmentData,
  selectedDate: _selectedDate,
  onDone,
}: AppointmentTabProps) {
  const {
    form,
    isAdmin,
    forceUpdate,
    isClinician,
    shouldFetchData,
    setGeneralError,
    validationErrors,
    effectiveClinicianId,
    setValidationErrors,
  } = useFormContext();

  const [isConfirmationOpen, setIsConfirmationOpen] = useState(false);
  const [isRecurringExpanded, setIsRecurringExpanded] = useState(false);

  useEffect(() => {
    if (appointmentData?.status) {
      form.setFieldValue("status", appointmentData.status);
    }
  }, [appointmentData]);

  const {
    locationPage,
    setLocationPage,
    isLoadingLocations,
    locationTotalPages,
    handleUpdateConfirm,
    handleLocationChange,
    setLocationSearchTerm,
    paginatedLocationOptions,
  } = useAppointmentUpdate({
    form,
    onDone,
    isAdmin,
    forceUpdate,
    isClinician,
    setGeneralError,
    appointmentData,
    shouldFetchData,
    validationErrors,
    setValidationErrors,
    effectiveClinicianId,
    setIsConfirmationOpen,
  });

  const {
    isDeleteModalOpen,
    handleDeleteConfirm,
    selectedDeleteOption,
    setIsDeleteModalOpen,
    setSelectedDeleteOption,
  } = useAppointmentDelete({
    onDone,
    setGeneralError,
    appointmentId: appointmentData?.id,
  });

  const handleRecurringSettingsSave = (data: RecurringInfo) => {
    form.setFieldValue("recurring", true);
    form.setFieldValue("recurringInfo", data);
    forceUpdate();
  };

  return (
    <>
      <p className="text-[#0a96d4] text-[20px] font-bold leading-3 pt-6">
        {appointmentData?.title}
      </p>

      <div className="flex items-center gap-3 border-b pb-3">
        <div className="bg-[lightgray] text-gray-500 rounded-[20px] px-3 py-[2px] text-[13px]">
          Adult
        </div>
        <div className="bg-green-200 text-green-700 rounded-[20px] px-3 py-[2px] text-[13px]">
          Active
        </div>
        <Image src={CallIcon} alt="" height={18} />
        <Image src={MessageIcon} alt="" height={20} />
        <Image src={EmailIcon} alt="" height={20} />
      </div>

      <div className="space-y-4">
        <div>
          <span className="text-[#717171] text-[14px] pb-2">Event Name</span>
          <input
            type="text"
            className="w-full border border-gray-200 rounded-[5px] px-3 py-2"
            value={
              form.getFieldValue("eventName") || appointmentData?.title || ""
            }
            onChange={(e) => {
              form.setFieldValue("eventName", e.target.value);
              forceUpdate();
            }}
          />
        </div>

        <h2 className="text-sm mb-4">Event details</h2>

        <div className="space-y-4">
          <DateTimeControls id="appointment-date-time" />

          <div>
            <span className="text-[#717171] text-[14px] pb-2">Clinician</span>
            <div className="bg-gray-200 flex gap-2 items-center py-2 px-2 rounded-[5px] text-[12px]">
              <div className="h-[20px] w-[20px] rounded-full bg-gray-500 text-white text-[11px] flex justify-center items-center">
                {appointmentData?.Clinician?.first_name?.[0]?.toUpperCase() ||
                  "" +
                    appointmentData?.Clinician?.last_name?.[0]?.toUpperCase() ||
                  ""}
              </div>
              {appointmentData?.Clinician?.first_name +
                " " +
                appointmentData?.Clinician?.last_name}
            </div>
          </div>

          <div>
            <span className="text-[#717171] text-[14px] pb-2">Location</span>
            <SearchSelect
              searchable
              showPagination
              className={cn(
                "border-gray-200",
                validationErrors.location && "border-red-500",
              )}
              currentPage={locationPage}
              icon={<Video className="h-4 w-4 text-gray-500" />}
              options={paginatedLocationOptions}
              placeholder={
                isLoadingLocations
                  ? "Loading locations..."
                  : "Search Locations *"
              }
              totalPages={locationTotalPages}
              value={form.getFieldValue<string>("location")}
              onPageChange={setLocationPage}
              onSearch={setLocationSearchTerm}
              onValueChange={handleLocationChange}
            />
            <ValidationError
              message="Location is required"
              show={!!validationErrors.location}
            />
          </div>
        </div>

        {appointmentData?.is_recurring === true && (
          <div className="pb-4 border-b">
            <RecurringHeader
              isExpanded={isRecurringExpanded}
              onToggle={() => setIsRecurringExpanded(!isRecurringExpanded)}
              recurringRule={appointmentData.recurring_rule}
            />
            {isRecurringExpanded && (
              <RecurringSettings
                recurringData={
                  parseRecurringRule(appointmentData?.recurring_rule) || {
                    period: "WEEKLY",
                    frequency: "1",
                    selectedDays: ["MO"],
                    monthlyPattern: "onDateOfMonth",
                    endType: "After",
                    endValue: "7",
                  }
                }
                onSave={handleRecurringSettingsSave}
              />
            )}
          </div>
        )}

        <div className="flex justify-between items-center pb-5">
          <div
            className="h-[40px] w-[40px] bg-gray-100 flex justify-center items-center rounded-[5px] cursor-pointer hover:bg-gray-200"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Image src={DeleteIcon} alt="" />
          </div>
          <Button
            className="py-2 px-3 bg-[#0a96d4] rounded-[5px] text-white"
            onClick={() => setIsConfirmationOpen(true)}
          >
            Update
          </Button>
        </div>
      </div>

      <EditConfirmationModal
        appointmentData={appointmentData}
        open={isConfirmationOpen}
        onOpenChange={setIsConfirmationOpen}
        onConfirm={handleUpdateConfirm}
      />

      <DeleteConfirmationModal
        appointmentData={appointmentData}
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleDeleteConfirm}
        selectedOption={selectedDeleteOption}
        onOptionChange={setSelectedDeleteOption}
      />
    </>
  );
}
