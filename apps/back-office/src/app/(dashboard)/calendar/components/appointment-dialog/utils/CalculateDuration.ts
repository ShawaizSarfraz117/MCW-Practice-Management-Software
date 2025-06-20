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
    const days = differenceInDays(endDate, startDate) + 1;
    return `${days} day${days !== 1 ? "s" : ""}`;
  }

  if (startTime && endTime) {
    const convertTo24Hour = (
      time12h: string,
    ): { hour: number; minute: number } => {
      const time24HourRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
      const time12HourRegex = /^(\d{1,2}):([0-5][0-9])\s*(AM|PM)$/i;

      if (time24HourRegex.test(time12h)) {
        const [hour, minute] = time12h.split(":").map(Number);
        return { hour, minute };
      } else if (time12HourRegex.test(time12h)) {
        // 12-hour format
        const match = time12h.match(time12HourRegex);
        if (!match) return { hour: 0, minute: 0 };

        let hour = parseInt(match[1], 10);
        const minute = parseInt(match[2], 10);
        const period = match[3].toUpperCase();

        // Convert to 24-hour format
        if (period === "PM" && hour !== 12) hour += 12;
        if (period === "AM" && hour === 12) hour = 0;

        return { hour, minute };
      }

      return { hour: 0, minute: 0 };
    };

    const start = convertTo24Hour(startTime);
    const end = convertTo24Hour(endTime);

    // Calculate total minutes
    const totalMins =
      (end.hour - start.hour) * 60 + (end.minute - start.minute);

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
