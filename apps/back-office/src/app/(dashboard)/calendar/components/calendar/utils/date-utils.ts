import { format } from "date-fns";

// Helper function to format ISO datetime
export const getISODateTime = (
  date: Date,
  timeStr: string,
  isAllDay: boolean = false,
): string => {
  // Parse the time components from the timeStr (e.g., "6:30 PM")
  try {
    // Get the date part (YYYY-MM-DD) from the date object
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;

    let hours = 0;
    let minutes = 0;
    let seconds = 0;

    // For all-day events, use specific times
    if (isAllDay) {
      // If this is an end date for an all-day event, set it to 11:59:59 PM
      if (timeStr === "end") {
        hours = 23;
        minutes = 59;
        seconds = 59;
      }
      // Otherwise, start date for an all-day event uses 00:00:00
    } else if (timeStr) {
      // Parse time string (e.g., "6:30 PM")
      const [time, ampm] = timeStr.split(" ");
      const [hourStr, minuteStr] = time.split(":");

      hours = parseInt(hourStr);
      minutes = parseInt(minuteStr);

      // Convert to 24-hour format
      if (ampm === "PM" && hours < 12) hours += 12;
      if (ampm === "AM" && hours === 12) hours = 0;
    }

    // Create a new date object with the combined date and time
    // This ensures we're not affected by timezone conversions in toISOString()
    const combinedDate = new Date(
      `${dateStr}T${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
    );

    // Return the ISO string but adjust it to maintain the local time the user selected
    // We need to adjust for the timezone offset to ensure the time is stored correctly
    const tzOffset = combinedDate.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = new Date(
      combinedDate.getTime() - tzOffset,
    ).toISOString();

    return localISOTime;
  } catch (err) {
    console.error("Error formatting date:", err);
    return new Date().toISOString();
  }
};

// Helper function to get formatted header date
export const getHeaderDateFormat = (view: string, date: Date): string => {
  switch (view) {
    case "resourceTimeGridDay":
    case "timeGridDay":
      return format(date, "EEEE, MMMM d, yyyy");
    case "resourceTimeGridWeek":
    case "timeGridWeek":
      return format(date, "MMMM yyyy");
    case "dayGridMonth":
      return format(date, "MMMM yyyy");
    default:
      return format(date, "MMMM yyyy");
  }
};
