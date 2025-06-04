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
    // Parse times in 24-hour format
    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    // Calculate total minutes
    const totalMins = (endHour - startHour) * 60 + (endMinute - startMinute);

    // Handle negative duration (shouldn't happen but just in case)
    if (totalMins <= 0) return "0 mins";

    // Format as hours and minutes
    const hours = Math.floor(totalMins / 60);
    const minutes = totalMins % 60;

    if (hours === 0) {
      return `${minutes} mins`;
    } else if (minutes === 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""}`;
    } else {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} mins`;
    }
  }

  return "0 mins";
}
