/* eslint-disable max-lines-per-function */
"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@mcw/ui";
import { Dialog, DialogContent } from "@mcw/ui";
import { DateRangePicker } from "@mcw/ui";
import { DateRange } from "react-day-picker";
import { useFetchAppointments } from "@/(dashboard)/clients/services/client.service";
import { format } from "date-fns";
import Loading from "@/components/Loading";
// import { useQueryClient } from "@tanstack/react-query";

interface SuperbillModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

type Appointment = {
  id: string;
  start_date: Date | string;
  title: string;
  appointment_fee: number | string;
  service_id?: string;
  client_group_id?: string;
  write_off?: number;
  clinician_id?: string;
};

export function SuperbillModal({
  open,
  onOpenChange,
  clientId,
}: SuperbillModalProps) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 3, 4), // Apr 4, 2025
    to: new Date(2025, 4, 3), // May 3, 2025
  });
  const [selectedAppointments, setSelectedAppointments] = useState<string[]>(
    [],
  );
  const [isSubmitting, _setIsSubmitting] = useState(false);
  // const queryClient = useQueryClient();

  const { data, isLoading } = useFetchAppointments(
    ["superbillAppointments", dateRange, clientId],
    {
      clientGroupId: clientId,
      startDate: dateRange?.from?.toISOString(),
      endDate: dateRange?.to?.toISOString(),
    },
  );

  const appointments = data as Appointment[] | undefined;

  const handleAppointmentSelection = (
    appointmentId: string,
    checked: boolean,
  ) => {
    if (checked) {
      setSelectedAppointments([...selectedAppointments, appointmentId]);
    } else {
      setSelectedAppointments(
        selectedAppointments.filter((id) => id !== appointmentId),
      );
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && appointments) {
      setSelectedAppointments(appointments.map((app) => app.id));
    } else {
      setSelectedAppointments([]);
    }
  };

  const handleCreateSuperbill = async () => {
    if (selectedAppointments.length === 0 || !appointments) return;

    // setIsSubmitting(true);
    //   const selectedAppointmentsData = appointments
    //     .filter((app) => selectedAppointments.includes(app.id))
    //     .map((app) => ({
    //       id: app.id,
    //       fee: app.appointment_fee,
    //     }));

    //   const firstAppointment = appointments.find(
    //     (app) => app.id === selectedAppointments[0],
    //   );

    //   if (!firstAppointment) {
    //     throw new Error("No appointment found");
    //   }

    //   const payload = {
    //     body: {
    //       client_group_id: clientId,
    //       clinician_id: firstAppointment.clinician_id || null,
    //       invoice_type: "SUPERBILL",
    //       appointments: selectedAppointmentsData,
    //     },
    //   };

    //   const [_result, error] = await createInvoice(payload);

    //   if (error) {
    //     throw error;
    //   }

    //   toast({
    //     description: "Superbill created successfully",
    //     variant: "success",
    //   });

    //   queryClient.invalidateQueries({
    //     queryKey: ["appointments"],
    //   });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-full w-full h-screen p-0 m-0 rounded-none [&>button]:hidden">
        <div className="flex flex-col h-full overflow-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center">
              <Button
                className="mr-2"
                size="icon"
                variant="ghost"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-5 w-5" />
              </Button>
              <h2 className="text-xl font-medium">Create Superbill</h2>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 flex flex-col h-full">
            {/* Selection criteria section */}
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">
                Select Appointments to include in Superbill
              </h3>
              <div className="flex items-center">
                <span className="mr-2">Adjust Date Range:</span>
                <DateRangePicker
                  className="w-[280px] h-9 bg-white border-[#e5e7eb]"
                  value={dateRange}
                  onChange={setDateRange}
                />
              </div>
            </div>

            {/* Appointments table */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-20">
                  <Loading message="Loading appointments..." />
                </div>
              ) : appointments && appointments.length > 0 ? (
                <div className="border border-[#e5e7eb] rounded-md bg-white overflow-hidden">
                  {/* Table Header */}
                  <div className="grid grid-cols-5 px-4 py-3 bg-gray-50 border-b border-[#e5e7eb]">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        className="mr-2 h-4 w-4"
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        checked={
                          appointments.length > 0 &&
                          selectedAppointments.length === appointments.length
                        }
                      />
                      <span className="font-medium">Date</span>
                    </div>
                    <div className="font-medium">Details</div>
                    <div className="font-medium">Type</div>
                    <div className="font-medium">Amount</div>
                    <div></div>
                  </div>

                  {/* Table Rows */}
                  {appointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="grid grid-cols-5 px-4 py-3 border-b border-[#e5e7eb] last:border-b-0"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          className="mr-2 h-4 w-4"
                          onChange={(e) =>
                            handleAppointmentSelection(
                              appointment.id,
                              e.target.checked,
                            )
                          }
                          checked={selectedAppointments.includes(
                            appointment.id,
                          )}
                        />
                        <span>
                          {format(new Date(appointment.start_date), "MMM dd")}
                        </span>
                      </div>
                      <div>{appointment.title}</div>
                      <div>Self-pay</div>
                      <div>${appointment.appointment_fee}</div>
                      <div></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border border-[#e5e7eb] rounded-md bg-white p-4 text-center">
                  No appointments found for the selected date range
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button
                variant="outline"
                className="mr-2"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#2d8467] hover:bg-[#236c53]"
                onClick={handleCreateSuperbill}
                disabled={selectedAppointments.length === 0 || isSubmitting}
              >
                {isSubmitting ? "Creating..." : "Create Superbill"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
