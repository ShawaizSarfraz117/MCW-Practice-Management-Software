import { Prisma } from "@prisma/client";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { AppointmentTagName } from "@/types/entities/appointment";

export interface RecurringRuleInfo {
  freq: string;
  count: number;
  interval: number;
  byDays: string[];
  byMonthDay?: string;
  until?: string;
}

export interface BaseAppointmentData {
  type: string;
  title: string;
  is_all_day: boolean;
  start_date: Date;
  end_date: Date;
  location_id: string;
  created_by: string;
  status: string;
  client_group_id?: string | null;
  clinician_id: string;
  service_id?: string | null;
  appointment_fee?: number;
}

export const DAY_CODE_TO_INDEX: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6,
};

export const INDEX_TO_DAY_CODE: string[] = [
  "SU",
  "MO",
  "TU",
  "WE",
  "TH",
  "FR",
  "SA",
];

export function parseRecurringRule(recurringRule: string): RecurringRuleInfo {
  const freq = recurringRule.match(/FREQ=([^;]+)/)?.[1] || "WEEKLY";
  const count = parseInt(recurringRule.match(/COUNT=([^;]+)/)?.[1] || "0");
  const interval = parseInt(
    recurringRule.match(/INTERVAL=([^;]+)/)?.[1] || "1",
  );
  const byDayMatch = recurringRule.match(/BYDAY=([^;]+)/)?.[1];
  const byDays = byDayMatch ? byDayMatch.split(",") : [];
  const byMonthDay = recurringRule.match(/BYMONTHDAY=([^;]+)/)?.[1];
  const until = recurringRule.match(/UNTIL=([^;]+)/)?.[1];

  return { freq, count, interval, byDays, byMonthDay, until };
}

export async function addDefaultAppointmentTags(
  appointmentId: string,
  clientGroupId: string | null,
) {
  try {
    const tags = await prisma.tag.findMany();

    const unpaidTag = tags.find(
      (t) => t.name === AppointmentTagName.APPOINTMENT_UNPAID,
    );
    const noNoteTag = tags.find((t) => t.name === AppointmentTagName.NO_NOTE);
    const newClientTag = tags.find(
      (t) => t.name === AppointmentTagName.NEW_CLIENT,
    );

    const tagsToAdd = [];

    if (unpaidTag) {
      tagsToAdd.push({ appointment_id: appointmentId, tag_id: unpaidTag.id });
    }

    if (noNoteTag) {
      tagsToAdd.push({ appointment_id: appointmentId, tag_id: noNoteTag.id });
    }

    if (clientGroupId && newClientTag) {
      const appointmentCount = await prisma.appointment.count({
        where: {
          client_group_id: clientGroupId,
          id: { not: appointmentId },
        },
      });

      if (appointmentCount === 0) {
        tagsToAdd.push({
          appointment_id: appointmentId,
          tag_id: newClientTag.id,
        });
      }
    }

    if (tagsToAdd.length > 0) {
      await prisma.appointmentTag.createMany({
        data: tagsToAdd,
      });
    }
  } catch (error) {
    logger.error(
      `Failed to add default tags to appointment ${appointmentId}: ${error}`,
    );
  }
}

export async function checkAppointmentLimit(
  clinicianId: string,
  startDate: Date,
): Promise<boolean> {
  const dayStart = new Date(startDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(startDate);
  dayEnd.setHours(23, 59, 59, 999);

  const limitRecord = await prisma.appointmentLimit.findFirst({
    where: {
      clinician_id: clinicianId,
      date: {
        gte: dayStart,
        lte: dayEnd,
      },
    },
  });

  if (limitRecord && limitRecord.max_limit > 0) {
    const apptCount = await prisma.appointment.count({
      where: {
        clinician_id: clinicianId,
        start_date: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: { not: "CANCELLED" },
      },
    });

    return apptCount >= limitRecord.max_limit;
  }

  return false;
}

export function adjustDateForRecurringPattern(
  startDate: Date,
  endDate: Date,
  byDays: string[],
): { adjustedStartDate: Date; adjustedEndDate: Date } {
  const startDayIndex = startDate.getDay();
  const startDayCode = INDEX_TO_DAY_CODE[startDayIndex];

  if (byDays.includes(startDayCode)) {
    return { adjustedStartDate: startDate, adjustedEndDate: endDate };
  }

  for (let i = 1; i <= 7; i++) {
    const checkDate = new Date(startDate);
    checkDate.setDate(checkDate.getDate() + i);
    const checkDayIndex = checkDate.getDay();
    const checkDayCode = INDEX_TO_DAY_CODE[checkDayIndex];

    if (byDays.includes(checkDayCode)) {
      const duration = endDate.getTime() - startDate.getTime();
      const adjustedStartDate = checkDate;
      const adjustedEndDate = new Date(checkDate.getTime() + duration);
      return { adjustedStartDate, adjustedEndDate };
    }
  }

  return { adjustedStartDate: startDate, adjustedEndDate: endDate };
}

export function getAppointmentIncludes() {
  return {
    ClientGroup: {
      include: {
        ClientGroupMembership: {
          include: {
            Client: true,
          },
        },
      },
    },
    Clinician: {
      select: {
        id: true,
        first_name: true,
        last_name: true,
      },
    },
    Location: {
      select: {
        id: true,
        name: true,
        address: true,
      },
    },
    AppointmentTag: {
      include: {
        Tag: true,
      },
    },
  };
}

export function calculateNextOccurrenceDate(
  baseDate: Date,
  freq: string,
  interval: number,
  occurrence: number,
): Date {
  const nextDate = new Date(baseDate);

  switch (freq) {
    case "DAILY":
      nextDate.setDate(nextDate.getDate() + occurrence * interval);
      break;
    case "WEEKLY":
      nextDate.setDate(nextDate.getDate() + occurrence * 7 * interval);
      break;
    case "MONTHLY":
      nextDate.setMonth(nextDate.getMonth() + occurrence * interval);
      break;
    case "YEARLY":
      nextDate.setFullYear(nextDate.getFullYear() + occurrence * interval);
      break;
  }

  return nextDate;
}

export function validateAppointmentData(
  data: Record<string, unknown>,
): string[] {
  const missingFields = [];
  const isEventType = data.type === "event";

  if (!data.title) missingFields.push("title");
  if (!data.start_date) missingFields.push("start date");
  if (!data.clinician_id) missingFields.push("clinician");
  if (!data.location_id) missingFields.push("location");
  if (!data.created_by && !data.clinician_id)
    missingFields.push("created by or clinician");

  if (!isEventType && !data.client_group_id) {
    missingFields.push("client");
  }

  return missingFields;
}

export function createAppointmentWhereClause(params: {
  clinicianId?: string | null;
  clientGroupId?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status?: string | null;
}): Prisma.AppointmentWhereInput {
  const whereClause: Prisma.AppointmentWhereInput = {};

  if (params.clinicianId) {
    whereClause.clinician_id = params.clinicianId;
  }

  if (params.clientGroupId) {
    whereClause.client_group_id = params.clientGroupId;
  }

  if (params.startDate || params.endDate) {
    whereClause.start_date = {};

    if (params.startDate) {
      whereClause.start_date.gte = new Date(params.startDate);
    }

    if (params.endDate) {
      whereClause.start_date.lte = new Date(params.endDate);
    }
  }

  if (params.status && params.status !== "undefined") {
    whereClause.Invoice = {
      some: {
        status: params.status,
      },
    };
  }

  return whereClause;
}
