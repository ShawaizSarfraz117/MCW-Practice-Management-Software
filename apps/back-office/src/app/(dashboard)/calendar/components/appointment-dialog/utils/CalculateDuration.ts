import { differenceInDays } from "date-fns";

export function calculateDuration(
  startDate: Date | undefined,
  endDate: Date | undefined,
  startTime: string | undefined,
  endTime: string | undefined,
  allDay: boolean | undefined,
): string {
  if (!startDate || !endDate) return "0 mins";

  if (allDay) {
    const days = differenceInDays(endDate, startDate);
    return `${days} day${days !== 1 ? "s" : ""}`;
  }

  if (startTime && endTime) {
    // Parse times
    const [startTimeStr, startPeriod] = startTime.split(" ");
    const [endTimeStr, endPeriod] = endTime.split(" ");
    const [startHour, startMinute] = startTimeStr.split(":").map(Number);
    const [endHour, endMinute] = endTimeStr.split(":").map(Number);

    // Convert to 24-hour format
    let start24Hour = startHour;
    if (startPeriod === "PM" && startHour !== 12) start24Hour += 12;
    if (startPeriod === "AM" && startHour === 12) start24Hour = 0;

    let end24Hour = endHour;
    if (endPeriod === "PM" && endHour !== 12) end24Hour += 12;
    if (endPeriod === "AM" && endHour === 12) end24Hour = 0;

    // Calculate minutes
    const mins = (end24Hour - start24Hour) * 60 + (endMinute - startMinute);
    return `${mins} mins`;
  }

  return "0 mins";
}
