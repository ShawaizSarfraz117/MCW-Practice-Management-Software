import { useState, useRef, useEffect } from "react";
import { Button, Input } from "@mcw/ui";
import { DateRangeCalendar } from "./DateRangeCalendar";

type DisplayMonth = {
  month: number;
  year: number;
};

type DateRangePickerProps = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (startDate: string, endDate: string, displayOption: string) => void;
  onCancel?: () => void;
  initialStartDate?: string;
  initialEndDate?: string;
};

const timeRangeOptions = [
  { label: "All time", value: "all_time" },
  { label: "Last 30 days", value: "last_30_days" },
  { label: "This Month", value: "this_month" },
  { label: "Last Month", value: "last_month" },
  { label: "This Year", value: "this_year" },
  { label: "Last Year", value: "last_year" },
  { label: "Custom Range", value: "custom_range" },
];

// Format the date as MM/DD/YYYY
const formatDate = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = date.getFullYear();
  return `${month}/${day}/${year}`;
};

// Get days in month
const getDaysInMonth = (year: number, month: number) => {
  return new Date(year, month + 1, 0).getDate();
};

// Get the day of week the month starts on (0 = Sunday, 1 = Monday, etc.)
const getMonthStartDay = (year: number, month: number) => {
  return new Date(year, month, 1).getDay();
};

export default function DateRangePicker({
  isOpen,
  onClose,
  onApply,
  onCancel,
  initialStartDate,
  initialEndDate,
}: DateRangePickerProps) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const currentDay = today.getDate();

  const [displayMonths, setDisplayMonths] = useState<DisplayMonth[]>([
    {
      month: currentMonth - 1 < 0 ? 11 : currentMonth - 1,
      year: currentMonth - 1 < 0 ? currentYear - 1 : currentYear,
    },
    { month: currentMonth, year: currentYear },
  ]);

  const [fromDate, setFromDate] = useState(
    initialStartDate || formatDate(today),
  );
  const [toDate, setToDate] = useState(initialEndDate || formatDate(today));
  const [selectedOption, setSelectedOption] = useState("All time");
  const [selectedStartDate, setSelectedStartDate] = useState<Date | null>(null);
  const [selectedEndDate, setSelectedEndDate] = useState<Date | null>(null);
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  const datePickerRef = useRef<HTMLDivElement>(null);

  const handleTimeOptionSelect = (option: string) => {
    setSelectedOption(option);
    const now = new Date();
    let from = new Date();
    let to = new Date(now);

    switch (option) {
      case "All time":
        from = new Date(2000, 0, 1);
        break;
      case "Last 30 days":
        from = new Date();
        from.setDate(from.getDate() - 30);
        break;
      case "This Month":
        from = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case "Last Month":
        from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        to = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "This Year":
        from = new Date(now.getFullYear(), 0, 1);
        break;
      case "Last Year":
        from = new Date(now.getFullYear() - 1, 0, 1);
        to = new Date(now.getFullYear() - 1, 11, 31);
        break;
      case "Custom Range":
        return;
    }

    setFromDate(formatDate(from));
    setToDate(formatDate(to));
    setSelectedStartDate(from);
    setSelectedEndDate(to);
  };

  const navigateMonth = (monthIndex: number, direction: "prev" | "next") => {
    setDisplayMonths((prevMonths) => {
      const newMonths = [...prevMonths];
      let { month, year } = newMonths[monthIndex];

      if (direction === "prev") {
        month = month - 1;
        if (month < 0) {
          month = 11;
          year = year - 1;
        }
      } else {
        month = month + 1;
        if (month > 11) {
          month = 0;
          year = year + 1;
        }
      }

      newMonths[monthIndex] = { month, year };

      if (monthIndex === 0) {
        const secondMonth = month + 1 > 11 ? 0 : month + 1;
        const secondYear = month + 1 > 11 ? year + 1 : year;
        newMonths[1] = { month: secondMonth, year: secondYear };
      } else if (monthIndex === 1) {
        const firstMonth = month - 1 < 0 ? 11 : month - 1;
        const firstYear = month - 1 < 0 ? year - 1 : year;
        newMonths[0] = { month: firstMonth, year: firstYear };
      }

      return newMonths;
    });
  };

  const getCalendarMonths = () => {
    return displayMonths.map(({ month, year }) => {
      const monthName = new Date(year, month, 1).toLocaleString("default", {
        month: "short",
      });
      return {
        name: `${monthName} ${year}`,
        days: Array.from(
          { length: getDaysInMonth(year, month) },
          (_, i) => i + 1,
        ),
        startOffset: getMonthStartDay(year, month),
        year,
        month,
      };
    });
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    }
    if (isOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, onClose]);

  const applyDateRange = () => {
    if (selectedStartDate && selectedEndDate) {
      setFromDate(formatDate(selectedStartDate));
      setToDate(formatDate(selectedEndDate));
    } else if (selectedStartDate) {
      setFromDate(formatDate(selectedStartDate));
      setToDate(formatDate(selectedStartDate));
    }
    onApply(fromDate, toDate, selectedOption);
  };

  const getDateStatus = (year: number, month: number, day: number) => {
    const currentDate = new Date(year, month, day);
    const isCurrentDay =
      currentDay === day && currentMonth === month && currentYear === year;
    let isSelectedStart = false;
    let isSelectedEnd = false;
    let isInRange = false;

    if (selectedStartDate) {
      isSelectedStart =
        currentDate.getFullYear() === selectedStartDate.getFullYear() &&
        currentDate.getMonth() === selectedStartDate.getMonth() &&
        currentDate.getDate() === selectedStartDate.getDate();

      if (selectedEndDate) {
        isSelectedEnd =
          currentDate.getFullYear() === selectedEndDate.getFullYear() &&
          currentDate.getMonth() === selectedEndDate.getMonth() &&
          currentDate.getDate() === selectedEndDate.getDate();
        isInRange =
          currentDate >= selectedStartDate && currentDate <= selectedEndDate;
      } else if (hoverDate) {
        const hoverEnd =
          hoverDate > selectedStartDate ? hoverDate : selectedStartDate;
        const hoverStart =
          hoverDate > selectedStartDate ? selectedStartDate : hoverDate;
        isInRange = currentDate >= hoverStart && currentDate <= hoverEnd;
      }
    }

    return { isCurrentDay, isSelectedStart, isSelectedEnd, isInRange };
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    const selectedDate = new Date(year, month, day);

    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(selectedDate);
      setSelectedEndDate(null);
      setHoverDate(null);
      setFromDate(formatDate(selectedDate));
      setToDate(formatDate(selectedDate));
      setSelectedOption("Custom Range");
    } else {
      if (selectedDate < selectedStartDate) {
        setSelectedEndDate(selectedStartDate);
        setSelectedStartDate(selectedDate);
      } else {
        setSelectedEndDate(selectedDate);
      }
      setFromDate(
        formatDate(
          selectedStartDate < selectedDate ? selectedStartDate : selectedDate,
        ),
      );
      setToDate(
        formatDate(
          selectedStartDate < selectedDate ? selectedDate : selectedStartDate,
        ),
      );
    }
  };

  const handleDateHover = (year: number, month: number, day: number) => {
    if (selectedStartDate && !selectedEndDate) {
      setHoverDate(new Date(year, month, day));
    }
  };

  const handleCancel = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setHoverDate(null);
    setFromDate(formatDate(today));
    setToDate(formatDate(today));
    setSelectedOption("All time");
    if (onCancel) onCancel();
    onClose();
  };

  if (!isOpen) return null;

  const calendarMonths = getCalendarMonths();

  return (
    <div
      ref={datePickerRef}
      className="absolute top-full p-3 left-0 mt-1 w-[800px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-md shadow-lg z-10"
    >
      <div className="flex flex-col">
        <div className="flex flex-row mb-4">
          <div className="w-[200px] min-w-[150px] p-3 border-r border-gray-200">
            <div className="flex flex-col gap-2">
              {timeRangeOptions.map((option) => (
                <button
                  key={option.value}
                  className={`w-full px-3 py-2 text-left rounded-md transition-colors ${
                    selectedOption === option.label
                      ? "bg-[#2D8467] text-white"
                      : "hover:bg-[#D1E4DE] text-[#707070]"
                  }`}
                  onClick={() => handleTimeOptionSelect(option.label)}
                >
                  <span className="text-[12px] font-normal leading-tight">
                    {option.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <DateRangeCalendar
            months={calendarMonths}
            currentMonth={currentMonth}
            onNavigateMonth={navigateMonth}
            onDateSelect={handleDateSelect}
            onDateHover={handleDateHover}
            getDateStatus={getDateStatus}
          />
        </div>

        <hr className="border-t border-gray-200 mb-4" />

        <div className="flex flex-col sm:flex-row px-4 mb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center mb-2 sm:mb-0">
              <span className="text-[12px] font-medium text-[#4B5563] mr-2">
                FROM
              </span>
              <Input
                className="h-8 w-36 text-[10.5px]"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-[12px] font-medium text-[#4B5563] mr-2">
                TO
              </span>
              <Input
                className="h-8 w-36 text-[10.5px]"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              className="bg-[#2D8467] hover:bg-[#236e53] h-8 text-[12px] px-4"
              onClick={applyDateRange}
            >
              Apply
            </Button>
            <Button
              variant="ghost"
              className="h-8 text-[12px] px-4 text-[#4B5563]"
              onClick={handleCancel}
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
