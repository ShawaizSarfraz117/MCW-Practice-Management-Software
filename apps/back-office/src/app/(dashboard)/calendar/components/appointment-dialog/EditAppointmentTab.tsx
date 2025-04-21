"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Video, Check } from "lucide-react";
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
import {
  appointmentStatusOptions,
  mappedClients,
} from "../../mock/appointmentData";

import CallIcon from "../../../../../../public/images/call-icon.svg";
import MessageIcon from "../../../../../../public/images/message-icon.svg";
import EmailIcon from "../../../../../../public/images/email-icon.svg";
import VideoIcon from "../../../../../../public/images/video-icon-white.svg";
import DeleteIcon from "../../../../../../public/images/delete-icon.svg";

interface RecurringInfo {
  period: string;
  frequency?: string;
  selectedDays?: string[];
  monthlyPattern?: string;
  endType?: string;
  endValue?: string | number;
}

export function EditAppointmentTab({
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
    servicesData,
    setLocationPage,
    isLoadingLocations,
    handleClientSelect,
    handleStatusChange,
    locationTotalPages,
    handleServiceSelect,
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

  const selectedClient = form.getFieldValue<string>("client");
  const selectedServices = form.getFieldValue<
    Array<{ serviceId: string; fee: number }>
  >("selectedServices") || [{ serviceId: "", fee: 0 }];

  const handleRecurringSettingsSave = (data: RecurringInfo) => {
    form.setFieldValue("recurring", true);
    form.setFieldValue("recurringInfo", data);
    forceUpdate();
  };

  return (
    <>
      <p className="text-[#0a96d4] text-[20px] font-bold leading-3 pt-6">
        {appointmentData?.Client?.legal_first_name +
          " " +
          appointmentData?.Client?.legal_last_name}
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

      <div className="flex gap-3 border-b pb-3">
        <div className="flex justify-center items-center w-full bg-[#11bd72] text-white gap-2 rounded-[5px] py-1.5 text-[13px]">
          <Image src={VideoIcon} alt="" height={20} />
          Start video appointment
        </div>
        <SearchSelect
          searchable={false}
          showPagination={false}
          className="border-0 bg-gray-200 w-[150px] rounded-[5px]"
          options={mappedClients}
          placeholder="Share link"
          value={selectedClient}
          onValueChange={handleClientSelect}
        />
      </div>
      <div className="border-b pb-3">
        <SearchSelect
          searchable={false}
          showPagination={false}
          icon={<Check className="h-4 w-4 text-green-700 font-bold" />}
          className="border-0 bg-green-100 w-[200px] rounded-[24px] px-3 py-1 font-medium text-green-700 focus:outline-none focus:ring-0"
          options={appointmentStatusOptions}
          placeholder="Select Status"
          value={form.getFieldValue("status")}
          onValueChange={handleStatusChange}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-sm mb-4">Appointment details</h2>

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

        <div className="pb-4 border-b">
          <div className="flex justify-between items-center">
            <p className="text-[13px] space-x-2">
              <span className="text-[#717171] font-[500]">Notes</span>
              <span className="text-[#0a96d4]">04/5/2025</span> |
              <span className="text-[#0a96d4]">02/27/2027</span>
            </p>
            <p className="text-[#0a96d4] text-[13px] cursor-pointer">
              Add Note
            </p>
          </div>
        </div>

        <div className="pb-4 border-b">
          <p className="text-[#717171] font-medium text-[14px]">Services</p>
          <div className="flex gap-3">
            <div className="w-full">
              <SearchSelect
                searchable={false}
                showPagination={false}
                className="border w-full rounded-[5px]"
                options={servicesData.map((service) => ({
                  label: service.type,
                  value: service.id,
                }))}
                placeholder="Select service"
                value={
                  appointmentData?.PracticeService?.id ||
                  selectedServices[0]?.serviceId
                }
                onValueChange={handleServiceSelect}
              />
            </div>
            <div className="flex justify-between border-gray-300 border w-[120px] items-center gap-2 rounded-[5px] py-1.5 px-2 text-[13px]">
              <span>Fee</span>
              <span>
                $
                {appointmentData?.PracticeService?.rate ||
                  appointmentData?.appointment_fee ||
                  selectedServices[0]?.fee ||
                  0}
              </span>
            </div>
          </div>
          <p className="text-[#0a96d4] font-medium text-[14px] p-2 cursor-pointer">
            Add service
          </p>
        </div>

        <div className="pb-4 border-b">
          <div className="flex justify-between items-center">
            <p className="font-medium text-[15px] text-[#717171]">Billing</p>
            <p className="text-[14px] text-[#717171]">Self-pay</p>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-[15px] text-[#717171]">Appointment Total</p>
            <p className="text-[14px] text-[#717171]">
              ${appointmentData?.appointment_fee}
            </p>
          </div>
        </div>

        <div className="pb-4">
          <p className="text-[14px] text-[#0a96d4] cursor-pointer">
            Create Invoice
          </p>
          <p className="text-[14px] text-[#717171] underline pt-3 ">
            Client Balance: $180
          </p>
        </div>

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
