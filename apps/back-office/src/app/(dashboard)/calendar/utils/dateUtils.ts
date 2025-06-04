import { AppointmentFormData } from "../components/appointment-dialog/types";

export function validateDateTimeFields(
  startDate: Date | null,
  endDate: Date | null,
  startTime: string | null,
  endTime: string | null,
): void {
  if (!startDate || !endDate || !startTime || !endTime) {
    throw new Error("Required date and time fields are missing");
  }

  if (!(startDate instanceof Date) || !(endDate instanceof Date)) {
    throw new Error("Invalid date values");
  }
}

export function parseTimeString(timeString: string): {
  hours: number;
  minutes: number;
  period: string;
} {
  const [time, period] = timeString.split(" ");
  const [hours, minutes] = time.split(":");

  if (!hours || !minutes || !period) {
    throw new Error("Invalid time format");
  }

  return {
    hours: parseInt(hours),
    minutes: parseInt(minutes),
    period,
  };
}

export function convertTo24Hour(hours: number, period: string): number {
  let convertedHours = hours;

  if (period === "PM" && hours !== 12) convertedHours += 12;
  if (period === "AM" && hours === 12) convertedHours = 0;

  return convertedHours;
}

export function createDateTimeWithOffset(
  date: Date,
  hours: number,
  minutes: number,
): string {
  const dateTime = new Date(date);
  dateTime.setHours(hours, minutes, 0, 0);

  const tzOffset = dateTime.getTimezoneOffset() * 60000;
  return new Date(dateTime.getTime() - tzOffset).toISOString();
}

export function processAppointmentDates(formData: AppointmentFormData): {
  startDateUTC: string;
  endDateUTC: string;
} {
  validateDateTimeFields(
    formData.startDate as Date,
    formData.endDate as Date,
    formData.startTime as string,
    formData.endTime as string,
  );

  const startTime = parseTimeString(formData.startTime as string);
  const endTime = parseTimeString(formData.endTime as string);

  const startHour = convertTo24Hour(startTime.hours, startTime.period);
  const endHour = convertTo24Hour(endTime.hours, endTime.period);

  return {
    startDateUTC: createDateTimeWithOffset(
      formData.startDate as Date,
      startHour,
      startTime.minutes,
    ),
    endDateUTC: createDateTimeWithOffset(
      formData.endDate as Date,
      endHour,
      endTime.minutes,
    ),
  };
}
