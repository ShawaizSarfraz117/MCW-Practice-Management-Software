import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  getDay,
  isBefore,
  setHours,
  setMinutes,
  addDays,
} from "date-fns";
import { TimezoneModal } from "./TimezoneModal";

interface TimeSlot {
  time: string;
  period: "Morning" | "Afternoon" | "Evening";
  dateTime: Date;
}

const periods = ["Morning", "Afternoon", "Evening"] as const;

// Helper function to generate time slots
function generateTimeSlots(selectedDate: Date, timezone: string): TimeSlot[] {
  const now = new Date();
  const endTime = setHours(setMinutes(new Date(), 30), 21); // 9:30 PM
  const slots: TimeSlot[] = [];

  // Create slots in 30-minute intervals
  const current = new Date(selectedDate);
  current.setHours(6, 0, 0, 0); // Start at 6 AM

  while (current <= endTime) {
    const hour = current.getHours();
    let period: "Morning" | "Afternoon" | "Evening";

    if (hour < 12) {
      period = "Morning";
    } else if (hour < 17) {
      period = "Afternoon";
    } else {
      period = "Evening";
    }

    // Only add future time slots for today, or all slots for future dates
    if (!isToday(selectedDate) || !isBefore(current, now)) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: timezone,
      });

      slots.push({
        time: formatter.format(current).toUpperCase(),
        period,
        dateTime: new Date(current),
      });
    }

    // Add 30 minutes
    current.setMinutes(current.getMinutes() + 30);
  }

  return slots;
}

interface AppointmentSchedulingProps {
  onSelect: (dateTime: string) => void;
}

export function AppointmentScheduling({
  onSelect,
}: AppointmentSchedulingProps) {
  const today = new Date();
  const maxSelectableDate = addDays(today, 5); // Only allow selecting up to 5 days from today
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonth, setCurrentMonth] = useState<Date>(today);
  const [isTimezoneModalOpen, setIsTimezoneModalOpen] = useState(false);
  const [currentTimezone, setCurrentTimezone] = useState("PKT");

  // Generate time slots based on selected date and timezone
  const timeSlots = useMemo(() => {
    const tzMap: Record<string, string> = {
      PKT: "Asia/Karachi",
      IST: "Asia/Kolkata",
      GMT: "Europe/London",
      EST: "America/New_York",
      PST: "America/Los_Angeles",
    };
    return generateTimeSlots(
      selectedDate,
      tzMap[currentTimezone] || "Asia/Karachi",
    );
  }, [selectedDate, currentTimezone]);

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = monthStart;
  const endDate = monthEnd;

  const dateFormat = "MMMM yyyy";
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  // Calculate padding days for the start of the month
  const startDay = getDay(monthStart);
  const prevMonthPadding = Array(startDay).fill(null);

  // Calculate padding days for the end of the month to complete the grid
  const totalDaysNeeded = 35; // 5 weeks
  const nextMonthPadding = Array(
    Math.max(0, totalDaysNeeded - (days.length + startDay)),
  ).fill(null);

  const allDays = [...prevMonthPadding, ...days, ...nextMonthPadding];

  const handleTimezoneUpdate = (timezone: string) => {
    setCurrentTimezone(timezone);
  };

  const handleTimeSelect = (slot: TimeSlot) => {
    if (onSelect) {
      const formattedDate = format(selectedDate, "EEE, MMM d, yyyy");
      onSelect(`${formattedDate} ${slot.time} ${currentTimezone}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-8">
        {/* Calendar Section */}
        <div className="flex-1">
          <div className="bg-white border rounded">
            <div className="flex items-center justify-between p-4 border-b">
              <button
                className="text-gray-600"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.setMonth(currentMonth.getMonth() - 1),
                    ),
                  )
                }
                disabled={isBefore(monthStart, today)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={`h-5 w-5 ${isBefore(monthStart, today) ? "text-gray-300" : ""}`}
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="text-gray-900 font-medium">
                {format(currentMonth, dateFormat)}
              </span>
              <button
                className="text-gray-600"
                onClick={() =>
                  setCurrentMonth(
                    new Date(
                      currentMonth.setMonth(currentMonth.getMonth() + 1),
                    ),
                  )
                }
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>

            <div className="p-4">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["S", "M", "T", "W", "T", "F", "S"].map((day) => (
                  <div key={day} className="text-center text-sm text-gray-600">
                    {day}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-2">
                {allDays.map((date, i) => {
                  if (!date) {
                    return (
                      <div
                        key={i}
                        className="p-2 text-center text-sm text-gray-300"
                      />
                    );
                  }

                  const _isToday = isToday(date);
                  const isSelected =
                    selectedDate &&
                    date.toDateString() === selectedDate.toDateString();
                  const isCurrentMonth = isSameMonth(date, currentMonth);
                  const isPastDate = isBefore(date, today) && !isToday(date);
                  const isFutureDisabled = isBefore(maxSelectableDate, date);
                  const isDisabled =
                    !isCurrentMonth || isPastDate || isFutureDisabled;

                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(date)}
                      className={`
                        p-2 text-center text-sm rounded relative
                        ${!isCurrentMonth || isPastDate || isFutureDisabled ? "text-gray-300 cursor-not-allowed" : "text-gray-700"}
                        ${_isToday ? "font-medium" : ""}
                        ${isSelected ? "bg-green-700 text-white" : ""}
                        ${!isDisabled ? "hover:bg-gray-100" : ""}
                      `}
                      disabled={isDisabled}
                    >
                      {format(date, "d")}
                      {_isToday && (
                        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-gray-400"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M5 2a1 1 0 011 1v1h8V3a1 1 0 112 0v1h1a2 2 0 012 2v11a2 2 0 01-2 2H3a2 2 0 01-2-2V6a2 2 0 012-2h1V3a1 1 0 011-1zm11 14V6H4v10h12z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Time Slots Section */}
        <div className="flex-1">
          <div className="text-center mb-8">
            <h3 className="text-lg font-medium">
              Availability on {format(selectedDate, "EEE, MMM d, yyyy")}
            </h3>
            <div className="text-sm text-gray-600 mt-1">
              Viewing in {currentTimezone}
              <button
                className="text-green-700 hover:text-green-800 ml-1 font-medium"
                onClick={() => setIsTimezoneModalOpen(true)}
              >
                Change
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8">
            {periods.map((period) => (
              <div key={period} className="space-y-4">
                <h4 className="text-gray-900 font-medium">{period}</h4>
                <div className="space-y-2">
                  {timeSlots
                    .filter((slot) => slot.period === period)
                    .map((slot) => (
                      <div key={slot.time} className="flex justify-center">
                        <button
                          onClick={() => handleTimeSelect(slot)}
                          className="bg-green-100 hover:bg-green-700 hover:text-white text-green-700 py-2 rounded-full text-sm w-full"
                        >
                          {slot.time}
                        </button>
                      </div>
                    ))}
                  {timeSlots.filter((slot) => slot.period === period).length ===
                    0 && (
                    <div className="text-gray-500 py-2 text-center">--</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <TimezoneModal
        isOpen={isTimezoneModalOpen}
        onClose={() => setIsTimezoneModalOpen(false)}
        onUpdate={handleTimezoneUpdate}
        currentTimezone={currentTimezone}
      />
    </div>
  );
}
