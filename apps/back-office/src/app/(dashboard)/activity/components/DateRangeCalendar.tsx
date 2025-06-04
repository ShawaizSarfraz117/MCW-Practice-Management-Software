import { ChevronLeft, ChevronRight } from "lucide-react";

type CalendarMonth = {
  name: string;
  days: number[];
  startOffset: number;
  year: number;
  month: number;
};

type DateRangeCalendarProps = {
  months: CalendarMonth[];
  currentMonth: number;
  onNavigateMonth: (monthIndex: number, direction: "prev" | "next") => void;
  onDateSelect: (year: number, month: number, day: number) => void;
  onDateHover: (year: number, month: number, day: number) => void;
  getDateStatus: (
    year: number,
    month: number,
    day: number,
  ) => {
    isCurrentDay: boolean;
    isSelectedStart: boolean;
    isSelectedEnd: boolean;
    isInRange: boolean;
  };
};

export function DateRangeCalendar({
  months,
  currentMonth,
  onNavigateMonth,
  onDateSelect,
  onDateHover,
  getDateStatus,
}: DateRangeCalendarProps) {
  return (
    <div className="flex-1 p-4 overflow-x-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 min-w-[500px]">
        {months.map((month, monthIndex) => (
          <div key={monthIndex} className="rounded-md">
            <div className="flex items-center justify-between p-2 border-b">
              <button
                className="p-1 hover:bg-gray-100 rounded-full"
                onClick={() => onNavigateMonth(monthIndex, "prev")}
              >
                <ChevronLeft className="h-4 w-4 text-[#4B5563]" />
              </button>
              <span className="font-medium text-[13.5px] text-black">
                {month.name}
              </span>
              <button
                className="p-1 hover:bg-gray-100 rounded-full"
                onClick={() => onNavigateMonth(monthIndex, "next")}
              >
                <ChevronRight className="h-4 w-4 text-[#4B5563]" />
              </button>
            </div>
            <div className="p-2">
              <div className="grid grid-cols-7 gap-1 mb-1">
                {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day, i) => (
                  <div
                    key={i}
                    className="text-center text-[10.5px] text-[#4B5563] font-medium py-2"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-3">
                {Array.from({ length: month.startOffset }).map((_, i) => (
                  <div key={`empty-${i}`} className="h-10 w-10"></div>
                ))}

                {month.days.map((day) => {
                  const dateStatus = getDateStatus(
                    month.year,
                    month.month,
                    day,
                  );
                  let className =
                    "h-8 w-8 rounded-md flex items-center justify-center text-[12px]";

                  if (dateStatus.isSelectedStart || dateStatus.isSelectedEnd) {
                    className += " bg-[#2D8467] text-white";
                  } else if (dateStatus.isInRange) {
                    className += " bg-[#D1E4DE] text-black";
                  } else if (dateStatus.isCurrentDay) {
                    className += " bg-[#2D8467] text-white";
                  } else {
                    className +=
                      month.month !== currentMonth
                        ? " text-[#9CA3AF] hover:bg-[#D1E4DE]"
                        : " text-black hover:bg-[#D1E4DE]";
                  }

                  return (
                    <button
                      key={`day-${day}`}
                      className={className}
                      onClick={() => onDateSelect(month.year, month.month, day)}
                      onMouseEnter={() =>
                        onDateHover(month.year, month.month, day)
                      }
                      aria-selected={
                        dateStatus.isSelectedStart || dateStatus.isSelectedEnd
                      }
                    >
                      {day}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
