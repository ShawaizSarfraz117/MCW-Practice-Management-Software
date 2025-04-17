import { Button } from "@mcw/ui";
import { Textarea } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { Bold, Italic, List, ListOrdered, LinkIcon } from "lucide-react";
import { useState } from "react";
import { fetchAppointments } from "@/(dashboard)/clients/services/client.service";
import { useQuery } from "@tanstack/react-query";
import { DateRangePicker } from "@mcw/ui";
import { DateRange } from "react-day-picker";
import Loading from "@/components/Loading";
import { format } from "date-fns";

// Type definitions
type Appointment = {
  id: string;
  start_date: Date | string;
  appointment_fee: number | string;
  type?: string;
  title?: string;
};

export default function OverviewTab() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(2025, 0, 8), // Jan 8, 2025
    to: new Date(2025, 8, 6), // Feb 6, 2025
  });

  const [filterType, setFilterType] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", dateRange],
    queryFn: () =>
      fetchAppointments({
        searchParams: {
          startDate: dateRange?.from?.toISOString(),
          endDate: dateRange?.to?.toISOString(),
        },
      }),
  });

  // Type assertion
  const appointments = data as Appointment[] | undefined;

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Text Editor */}
      <div className="mb-6">
        <div className="flex gap-2 sm:gap-4 mb-2 overflow-x-auto">
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <Bold className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <Italic className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <List className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          className="min-h-[100px] border-[#e5e7eb] resize-none"
          placeholder="Add Chart Note: include notes from a call with a client or copy & paste the contents of a document"
        />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        02/06/2025 5:07 pm
        <button className="text-blue-500 hover:underline ml-4">
          + Add Note
        </button>
      </div>

      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <DateRangePicker
            className="w-full sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
            value={dateRange}
            onChange={setDateRange}
          />
          <Select defaultValue={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="All Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="appointments">Appointments</SelectItem>
              <SelectItem value="measures">Measures</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
      </div>

      {/* Timeline */}
      {isLoading ? (
        <Loading message="Loading timeline..." />
      ) : (
        <div className="space-y-6">
          {appointments && appointments.length > 0 ? (
            appointments.map((appointment) => (
              <div key={appointment.id} className="flex justify-between">
                <div>
                  <div className="text-sm text-gray-500">
                    {format(
                      new Date(appointment.start_date),
                      "MMM d",
                    ).toUpperCase()}
                  </div>
                  <div className="font-medium">
                    {appointment.title ||
                      `Appointment #${appointment.id.slice(-1)}`}
                  </div>
                  <div className="text-sm text-gray-500">GAD-7</div>
                  <button className="text-blue-500 hover:underline text-sm mt-1">
                    + Progress Note
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(appointment.start_date), "h:mm a")}
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-500 text-center py-4">
              No appointments found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
