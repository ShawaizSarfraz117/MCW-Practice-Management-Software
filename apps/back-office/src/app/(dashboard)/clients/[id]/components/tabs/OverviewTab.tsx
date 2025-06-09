import { Button } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { fetchAppointments } from "@/(dashboard)/clients/services/client.service";
import { useQuery } from "@tanstack/react-query";
import { DatePicker } from "@mcw/ui";
import { TimePicker } from "@mcw/ui";
import Loading from "@/components/Loading";
import { format } from "date-fns";
import { useParams, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@mcw/ui";

import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

// Type definitions
type Appointment = {
  id: string;
  start_date: Date | string;
  appointment_fee: number | string;
  type?: string;
  title?: string;
};

// Chart Note Editor Component
function ChartNoteEditor() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 0, 8), // Jan 8, 2025
  );
  const [editorContent, setEditorContent] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("5:07 PM");

  return (
    <div className="mb-6 p-4 border border-[#e5e7eb] rounded-lg">
      <div className="mb-6">
        <ReactQuill
          formats={["bold", "italic", "underline", "list", "bullet", "link"]}
          modules={{
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link"],
              ["clean"],
            ],
          }}
          placeholder="Add Chart Note: include notes from a call with a client or copy & paste the contents of a document"
          style={{
            height: "120px",
            marginBottom: "50px",
          }}
          theme="snow"
          value={editorContent}
          onChange={setEditorContent}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <DatePicker
            className="w-[10%] sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
            value={selectedDate}
            onChange={setSelectedDate}
          />
          <TimePicker
            className="w-[10%] sm:w-[120px] h-9 bg-white border-[#e5e7eb]"
            value={selectedTime}
            onChange={setSelectedTime}
          />
        </div>
        <button className="text-blue-500 hover:underline ml-4">
          + Add Note
        </button>
      </div>
    </div>
  );
}

// Date Range and Filter Controls Component
function DateRangeFilterControls({
  filterType,
  setFilterType,
}: {
  filterType: string;
  setFilterType: (value: string) => void;
}) {
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedDateRangeDisplay, setSelectedDateRangeDisplay] =
    useState<string>("All time");
  const [customDateRange, setCustomDateRange] = useState<string>("");

  return (
    <div className="flex flex-col sm:flex-row gap-2 relative">
      <div
        className="w-auto h-9 bg-white border-[#e5e7eb] border rounded cursor-pointer flex items-center px-3 text-sm whitespace-nowrap"
        onClick={() => setDateRangePickerOpen(true)}
      >
        {selectedDateRangeDisplay === "Custom Range"
          ? customDateRange
          : selectedDateRangeDisplay}
      </div>
      <DateRangePicker
        isOpen={dateRangePickerOpen}
        onApply={(_startDate, _endDate, displayOption) => {
          setSelectedDateRangeDisplay(displayOption);
          if (displayOption === "Custom Range") {
            setCustomDateRange(`${_startDate} - ${_endDate}`);
          }
          setDateRangePickerOpen(false);
        }}
        onCancel={() => setDateRangePickerOpen(false)}
        onClose={() => setDateRangePickerOpen(false)}
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
  );
}

// Navigation Dropdown Component
function NavigationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const params = useParams();

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button className="bg-[#2d8467] hover:bg-[#236c53] flex items-center gap-1">
          New
          <ChevronDown
            className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/diagnosisAndTreatmentPlan`)
          }
        >
          Diagnosis and treatment plan
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() =>
            router.push(`/clients/${params.id}/goodFaithEstimate`)
          }
        >
          Good faith estimate
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/mentalStatusExam`)}
        >
          Mental Status Exam
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/scoredMeasure`)}
        >
          Scored Measure
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => router.push(`/clients/${params.id}/otherDocuments`)}
        >
          Other document
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function OverviewTab() {
  const [selectedDate] = useState<Date | undefined>(
    new Date(2025, 0, 8), // Jan 8, 2025
  );
  const params = useParams();
  const [filterType, setFilterType] = useState("all");

  const { data, isLoading } = useQuery({
    queryKey: ["appointments", selectedDate, params.id],
    queryFn: () =>
      fetchAppointments({
        searchParams: {
          clientGroupId: params.id,
          startDate: selectedDate?.toISOString(),
          endDate: selectedDate?.toISOString(),
        },
      }),
  });

  // Type assertion
  const appointments = data as Appointment[] | undefined;

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      <ChartNoteEditor />

      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <DateRangeFilterControls
          filterType={filterType}
          setFilterType={setFilterType}
        />
        <NavigationDropdown />
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
                  <div className="text-sm text-gray-500">
                    {appointment.type}
                  </div>
                  <button className="text-blue-500 hover:underline text-sm mt-1">
                    + Progress Note
                  </button>
                </div>
                <div className="text-sm text-gray-500">
                  {format(new Date(appointment.start_date), "HH:mm")}
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
