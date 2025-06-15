import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { DocumentType } from "@mcw/types";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

interface DateRangeFilterControlsProps {
  filterType: DocumentType | "all";
  setFilterType: (value: DocumentType | "all") => void;
  startDate?: Date;
  endDate?: Date;
  onDateRangeChange: (start?: Date, end?: Date) => void;
}

export default function DateRangeFilterControls({
  filterType,
  setFilterType,
  onDateRangeChange,
}: DateRangeFilterControlsProps) {
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

          // Parse dates and call the handler
          const start = _startDate ? new Date(_startDate) : undefined;
          const end = _endDate ? new Date(_endDate) : undefined;
          onDateRangeChange(start, end);

          setDateRangePickerOpen(false);
        }}
        onCancel={() => setDateRangePickerOpen(false)}
        onClose={() => setDateRangePickerOpen(false)}
      />
      <Select value={filterType} onValueChange={setFilterType}>
        <SelectTrigger className="w-full sm:w-[250px] h-9 bg-white border-[#e5e7eb]">
          <SelectValue placeholder="All Items" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Items</SelectItem>
          <SelectItem value="appointments">Appointments</SelectItem>
          <SelectItem value="chart_notes">Chart notes</SelectItem>
          <SelectItem value="diagnosis_and_treatment_plans">
            Diagnosis and treatment plans
          </SelectItem>
          <SelectItem value="good_faith_estimate">
            Good faith estimate
          </SelectItem>
          <SelectItem value="mental_status_exams">
            Mental status exams
          </SelectItem>
          <SelectItem value="questionnaires">Questionnaires</SelectItem>
          <SelectItem value="scored_measures">Scored measures</SelectItem>
          <SelectItem value="other_documents">Other documents</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
