/* eslint-disable max-lines-per-function */
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Video, Check, X } from "lucide-react";
import { SearchSelect, Button, toast } from "@mcw/ui";
import { cn } from "@mcw/utils";
import { useRouter } from "next/navigation";
import { createInvoice } from "@/(dashboard)/clients/services/client.service";

import { AppointmentTabProps, AppointmentData } from "./types";
import { ValidationError } from "./components/ValidationError";
import { useFormContext } from "./context/FormContext";
import { DateTimeControls } from "./components/FormControls";
import { EditConfirmationModal } from "./EditConfirmationModal";
import { DeleteConfirmationModal } from "./components/DeleteConfirmationModal";
import { RecurringSettings } from "./components/RecurringSettings";
import { RecurringHeader } from "./components/RecurringHeader";
import { useAppointmentUpdate } from "./hooks/useAppointmentUpdate";
import { useAppointmentDelete } from "@/(dashboard)/calendar/hooks/useAppointmentDelete";
import { parseRecurringRule } from "@/(dashboard)/calendar/utils/recurringRuleUtils";
import { appointmentStatusOptions } from "@/(dashboard)/calendar/mock/appointmentData";
import { BillingSection } from "./components/BillingSection";
import { ServicesSection } from "./components/ServicesSection";
import { NotesSection } from "./components/NotesSection";

import CallIcon from "@/assets/images/call-icon.svg";
import MessageIcon from "@/assets/images/message-icon.svg";
import EmailIcon from "@/assets/images/email-icon.svg";
// import VideoIcon from "@/assets/images/video-icon-white.svg";
import DeleteIcon from "@/assets/images/delete-icon.svg";

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
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);
  const [clientBalance, setClientBalance] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    if (appointmentData?.status) {
      form.setFieldValue("status", appointmentData.status);
    }
  }, [appointmentData]);

  // Fetch client balance
  useEffect(() => {
    const fetchClientBalance = async () => {
      const clientGroupId =
        (appointmentData as AppointmentData & { client_group_id?: string })
          ?.client_group_id || appointmentData?.ClientGroup?.id;
      if (!clientGroupId) return;

      try {
        // Fetch invoices for the client group
        const response = await fetch(
          `/api/invoice?clientGroupId=${clientGroupId}`,
        );
        if (response.ok) {
          const invoices = await response.json();

          // Calculate balance similar to ClientBillingCard
          const totalInvoiceAmount = invoices.reduce(
            (sum: number, invoice: { amount: number | string }) =>
              sum + Number(invoice.amount),
            0,
          );

          const totalPaymentsAmount = invoices.reduce(
            (
              sum: number,
              invoice: { Payment?: Array<{ amount: number | string }> },
            ) => {
              const invoicePayments =
                invoice.Payment?.reduce(
                  (paymentSum: number, payment: { amount: number | string }) =>
                    paymentSum + Number(payment.amount),
                  0,
                ) || 0;
              return sum + invoicePayments;
            },
            0,
          );

          const remainingBalance = totalInvoiceAmount - totalPaymentsAmount;
          setClientBalance(remainingBalance);
        }
      } catch (error) {
        console.error("Error fetching client balance:", error);
      }
    };

    if (appointmentData) {
      fetchClientBalance();
    }
  }, [appointmentData]);

  const {
    locationPage,
    servicesData,
    setLocationPage,
    isLoadingLocations,
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

  const selectedServices = form.getFieldValue<
    Array<{ serviceId: string; fee: number }>
  >("selectedServices") || [{ serviceId: "", fee: 0 }];

  const handleRecurringSettingsSave = (data: RecurringInfo) => {
    form.setFieldValue("recurring", true);
    form.setFieldValue("recurringInfo", data);
    forceUpdate();
  };

  const handleCreateInvoice = async () => {
    if (!appointmentData?.id) return;

    // Extract client_group_id from the appointmentData
    const clientGroupId =
      (appointmentData as AppointmentData & { client_group_id?: string })
        .client_group_id || appointmentData.ClientGroup?.id;

    if (!clientGroupId) {
      toast({
        description:
          "Cannot create invoice: No client group associated with this appointment",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingInvoice(true);
    try {
      const [invoice, error] = await createInvoice({
        body: {
          appointment_id: appointmentData.id,
          client_group_id: clientGroupId,
          clinician_id: appointmentData.clinician_id || null,
          amount: appointmentData.appointment_fee || 0,
          invoice_type:
            appointmentData.Invoice &&
            Array.isArray(appointmentData.Invoice) &&
            appointmentData.Invoice.length > 0
              ? "adjustment"
              : "invoice",
        },
      });

      if (!error && invoice) {
        toast({
          description: "Invoice created successfully",
          variant: "success",
        });

        // Dispatch a custom event to refresh appointments
        window.dispatchEvent(
          new CustomEvent("appointmentUpdated", {
            detail: { appointment: { ...appointmentData, Invoice: [invoice] } },
          }),
        );

        // Navigate to the client billing tab with the invoice
        setTimeout(() => {
          router.push(
            `/clients/${clientGroupId}?tab=billing&type=invoice&invoiceId=${invoice.id}`,
          );
        }, 500);
      } else {
        toast({
          description: "Failed to create invoice",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      toast({
        description: "Failed to create invoice",
        variant: "destructive",
      });
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  const handleAddPayment = () => {
    if (!appointmentData?.id) return;

    const clientGroupId =
      (appointmentData as AppointmentData & { client_group_id?: string })
        .client_group_id || appointmentData.ClientGroup?.id;

    if (!clientGroupId) {
      toast({
        description:
          "Cannot add payment: No client group associated with this appointment",
        variant: "destructive",
      });
      return;
    }

    // Navigate to the client page with payment modal
    router.push(
      `/clients/${clientGroupId}?tab=billing&type=payment&appointmentId=${appointmentData.id}`,
    );
  };

  return (
    <>
      <p className="text-[#0a96d4] text-[20px] font-bold leading-3 pt-6">
        {appointmentData?.ClientGroup?.name}
      </p>
      <div className="flex items-center gap-3 border-b pb-3">
        <div className="bg-[lightgray] text-gray-500 rounded-[20px] px-3 py-[2px] text-[13px]">
          Adult
        </div>
        <div className="bg-green-200 text-green-700 rounded-[20px] px-3 py-[2px] text-[13px]">
          Active
        </div>
        <Image alt="" height={18} src={CallIcon} />
        <Image alt="" height={20} src={MessageIcon} />
        <Image alt="" height={20} src={EmailIcon} />
      </div>

      {/* <div className="flex gap-3 border-b pb-3">
        <div className="flex justify-center items-center w-full bg-[#11bd72] text-white gap-2 rounded-[5px] py-1.5 text-[13px]">
          <Image alt="" height={20} src={VideoIcon} />
          Start video appointment
        </div>
        <SearchSelect
          className="border-0 bg-gray-200 w-[150px] rounded-[5px]"
          options={mappedClients}
          placeholder="Share link"
          searchable={false}
          showPagination={false}
          value={selectedClient}
          onValueChange={handleClientSelect}
        />
      </div> */}
      <div className="border-b pb-3">
        <SearchSelect
          className={cn(
            "border-0 w-[200px] rounded-[24px] px-3 py-1 font-medium focus:outline-none focus:ring-0",
            form.getFieldValue("status") === "SHOW" &&
              "bg-green-100 text-green-700",
            form.getFieldValue("status") === "SCHEDULED" &&
              "bg-green-100 text-green-700",
            form.getFieldValue("status") === "NO_SHOW" &&
              "bg-red-100 text-red-700",
            form.getFieldValue("status") === "LATE_CANCELED" &&
              "bg-red-100 text-red-700",
            form.getFieldValue("status") === "CANCELLED" &&
              "bg-amber-100 text-amber-700",
            form.getFieldValue("status") === "CLINICIAN_CANCELED" &&
              "bg-amber-100 text-amber-700",
          )}
          icon={
            form.getFieldValue("status") === "NO_SHOW" ||
            form.getFieldValue("status") === "LATE_CANCELED" ||
            form.getFieldValue("status") === "CANCELLED" ||
            form.getFieldValue("status") === "CLINICIAN_CANCELED" ? (
              <X
                className={cn(
                  "h-4 w-4 font-bold",
                  form.getFieldValue("status") === "NO_SHOW" && "text-red-700",
                  form.getFieldValue("status") === "LATE_CANCELED" &&
                    "text-red-700",
                  form.getFieldValue("status") === "CANCELLED" &&
                    "text-amber-700",
                  form.getFieldValue("status") === "CLINICIAN_CANCELED" &&
                    "text-amber-700",
                )}
              />
            ) : (
              <Check
                className={cn(
                  "h-4 w-4 font-bold",
                  form.getFieldValue("status") === "SHOW" && "text-green-700",
                  form.getFieldValue("status") === "SCHEDULED" &&
                    "text-green-700",
                )}
              />
            )
          }
          options={appointmentStatusOptions}
          placeholder="Select Status"
          searchable={false}
          showPagination={false}
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
              recurringRule={appointmentData.recurring_rule}
              onToggle={() => setIsRecurringExpanded(!isRecurringExpanded)}
            />
            {isRecurringExpanded && (
              <RecurringSettings
                recurringData={
                  parseRecurringRule(appointmentData?.recurring_rule || "") || {
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

        <NotesSection
          appointmentData={appointmentData}
          onAddNote={() => {
            // TODO: Implement add note functionality
            console.log("Add note clicked", appointmentData?.id);
            router.push(`/appointmentNote/${appointmentData?.id}`);
          }}
        />

        <ServicesSection
          appointmentData={appointmentData}
          selectedServices={selectedServices}
          servicesData={servicesData}
          onServiceSelect={handleServiceSelect}
        />

        <BillingSection
          appointmentData={appointmentData}
          appointmentFee={appointmentData?.appointment_fee}
          clientBalance={clientBalance}
          isCreatingInvoice={isCreatingInvoice}
          onAddPayment={handleAddPayment}
          onCreateInvoice={handleCreateInvoice}
        />

        <div className="flex justify-between items-center pb-5">
          <div
            className="h-[40px] w-[40px] bg-gray-100 flex justify-center items-center rounded-[5px] cursor-pointer hover:bg-gray-200"
            onClick={() => setIsDeleteModalOpen(true)}
          >
            <Image alt="" src={DeleteIcon} />
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
        status={form.getFieldValue("status")}
        onConfirm={handleUpdateConfirm}
        onOpenChange={setIsConfirmationOpen}
      />

      <DeleteConfirmationModal
        appointmentData={appointmentData}
        open={isDeleteModalOpen}
        selectedOption={selectedDeleteOption}
        onConfirm={handleDeleteConfirm}
        onOpenChange={setIsDeleteModalOpen}
        onOptionChange={setSelectedDeleteOption}
      />
    </>
  );
}
