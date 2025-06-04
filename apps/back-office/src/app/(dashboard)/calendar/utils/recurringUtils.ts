interface RecurringInfo {
  period: string;
  frequency?: string;
  selectedDays?: string[];
  monthlyPattern?: string;
  endType?: string;
  endValue?: string | number;
}

export function constructRecurringRule(
  recurringInfo: RecurringInfo,
  startDate: Date,
): string {
  const parts = [`FREQ=${recurringInfo.period}`];

  // Add interval (frequency)
  if (recurringInfo.frequency && parseInt(recurringInfo.frequency) > 1) {
    parts.push(`INTERVAL=${recurringInfo.frequency}`);
  }

  // Add weekdays for weekly recurrence
  if (
    recurringInfo.period === "WEEKLY" &&
    recurringInfo.selectedDays &&
    recurringInfo.selectedDays.length > 0
  ) {
    parts.push(`BYDAY=${recurringInfo.selectedDays.join(",")}`);
  }

  // Add monthly pattern if specified
  if (recurringInfo.period === "MONTHLY" && recurringInfo.monthlyPattern) {
    if (recurringInfo.monthlyPattern === "onDateOfMonth") {
      // Use BYMONTHDAY for same day each month
      const dayOfMonth = startDate.getDate();
      parts.push(`BYMONTHDAY=${dayOfMonth}`);
    } else if (recurringInfo.monthlyPattern === "onWeekDayOfMonth") {
      // Use BYDAY with ordinal for same weekday each month
      const dayOfWeek = startDate.getDay();
      const weekNumber = Math.ceil(startDate.getDate() / 7);
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      parts.push(`BYDAY=${weekNumber}${days[dayOfWeek]}`);
    } else if (recurringInfo.monthlyPattern === "onLastWeekDayOfMonth") {
      // Use BYDAY with -1 for last weekday of month
      const dayOfWeek = startDate.getDay();
      const days = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
      parts.push(`BYDAY=-1${days[dayOfWeek]}`);
    }
  }

  // Add end condition
  if (recurringInfo.endType === "After" && recurringInfo.endValue) {
    parts.push(`COUNT=${recurringInfo.endValue}`);
  } else if (recurringInfo.endType === "On Date" && recurringInfo.endValue) {
    // Format the end date as YYYYMMDD for UNTIL
    const endDate = new Date(recurringInfo.endValue);
    const year = endDate.getFullYear();
    const month = String(endDate.getMonth() + 1).padStart(2, "0");
    const day = String(endDate.getDate()).padStart(2, "0");
    parts.push(`UNTIL=${year}${month}${day}T235959Z`);
  }

  return parts.join(";");
}
