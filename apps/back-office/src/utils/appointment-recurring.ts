import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import {
  BaseAppointmentData,
  RecurringRuleInfo,
  DAY_CODE_TO_INDEX,
  getAppointmentIncludes,
  addDefaultAppointmentTags,
} from "./appointment-helpers";

interface AppointmentWithIncludes {
  id: string;
  start_date: Date;
  end_date: Date;
  client_group_id: string | null;
  [key: string]: unknown;
}

export async function createWeeklyRecurringWithDays(
  baseAppointmentData: BaseAppointmentData,
  masterAppointment: AppointmentWithIncludes,
  ruleInfo: RecurringRuleInfo,
  recurringRule: string,
  originalStartDate: Date,
  originalEndDate: Date,
) {
  const recurringAppointments = [masterAppointment];
  const { byDays, count, interval } = ruleInfo;

  const startOfWeek = new Date(originalStartDate);
  startOfWeek.setDate(originalStartDate.getDate() - originalStartDate.getDay());

  let createdCount = 1;
  const maxWeeks = Math.ceil(count > 0 ? count : 52);

  for (let week = 0; week < maxWeeks; week++) {
    for (const dayCode of byDays) {
      if (count > 0 && createdCount >= count) break;

      const dayIndex = DAY_CODE_TO_INDEX[dayCode];
      if (dayIndex === undefined) continue;

      const appointmentDate = new Date(startOfWeek);
      appointmentDate.setDate(
        startOfWeek.getDate() + dayIndex + week * 7 * interval,
      );

      if (appointmentDate < originalStartDate) continue;

      if (
        appointmentDate.toISOString().split("T")[0] ===
        masterAppointment.start_date.toISOString().split("T")[0]
      ) {
        continue;
      }

      const appointmentEndDate = new Date(
        appointmentDate.getTime() +
          (originalEndDate.getTime() - originalStartDate.getTime()),
      );

      try {
        const recurringAppointment = await prisma.appointment.create({
          data: {
            ...baseAppointmentData,
            start_date: appointmentDate,
            end_date: appointmentEndDate,
            is_recurring: true,
            recurring_rule: recurringRule,
            recurring_appointment_id: masterAppointment.id,
          },
          include: getAppointmentIncludes(),
        });

        recurringAppointments.push(recurringAppointment);
        createdCount++;

        await addDefaultAppointmentTags(
          recurringAppointment.id,
          recurringAppointment.client_group_id,
        );
      } catch (error) {
        logger.error(
          `Failed to create recurring appointment for date ${appointmentDate.toISOString()}: ${error}`,
        );
      }
    }

    if (count > 0 && createdCount >= count) break;
  }

  return recurringAppointments;
}

export async function createStandardRecurring(
  baseAppointmentData: BaseAppointmentData,
  masterAppointment: AppointmentWithIncludes,
  ruleInfo: RecurringRuleInfo,
  recurringRule: string,
  startDate: Date,
  endDate: Date,
) {
  const recurringAppointments = [masterAppointment];
  const { freq, count, interval } = ruleInfo;

  const maxOccurrences = Math.min(count > 0 ? count - 1 : 52, 52);

  for (let i = 0; i < maxOccurrences; i++) {
    const nextDate = new Date(startDate);

    switch (freq) {
      case "WEEKLY":
        nextDate.setDate(nextDate.getDate() + (i + 1) * 7 * interval);
        break;
      case "MONTHLY":
        nextDate.setMonth(nextDate.getMonth() + (i + 1) * interval);
        break;
      case "YEARLY":
        nextDate.setFullYear(nextDate.getFullYear() + (i + 1) * interval);
        break;
      case "DAILY":
        nextDate.setDate(nextDate.getDate() + (i + 1) * interval);
        break;
    }

    // Calculate end date for this occurrence
    const nextEndDate = new Date(
      nextDate.getTime() + (endDate.getTime() - startDate.getTime()),
    );

    // Create the recurring appointment
    const recurringAppointment = await prisma.appointment.create({
      data: {
        ...baseAppointmentData,
        start_date: nextDate,
        end_date: nextEndDate,
        is_recurring: true,
        recurring_rule: recurringRule,
        recurring_appointment_id: masterAppointment.id,
      },
      include: getAppointmentIncludes(),
    });

    recurringAppointments.push(recurringAppointment);

    await addDefaultAppointmentTags(
      recurringAppointment.id,
      recurringAppointment.client_group_id,
    );
  }

  return recurringAppointments;
}

interface UpdateDataType {
  [key: string]: unknown;
}

interface AppointmentToUpdate {
  id: string;
  start_date: Date;
  end_date: Date;
}

export async function updateFutureRecurringAppointments(
  appointments: AppointmentToUpdate[],
  updateData: UpdateDataType,
  baseStartTime: Date,
  baseEndTime: Date,
  ruleInfo: RecurringRuleInfo,
) {
  const duration = baseEndTime.getTime() - baseStartTime.getTime();
  const { freq, interval, byDays, byMonthDay } = ruleInfo;

  if (freq === "WEEKLY" && byDays.length > 0) {
    const startOfWeek = new Date(baseStartTime);
    startOfWeek.setDate(baseStartTime.getDate() - baseStartTime.getDay());

    let appointmentIndex = 0;
    const appointmentDates: Date[] = [];

    for (let week = 0; appointmentIndex < appointments.length; week++) {
      for (const dayCode of byDays) {
        if (appointmentIndex >= appointments.length) break;

        const dayIndex = DAY_CODE_TO_INDEX[dayCode];
        if (dayIndex === undefined) continue;

        const appointmentDate = new Date(startOfWeek);
        appointmentDate.setDate(
          startOfWeek.getDate() + dayIndex + week * 7 * interval,
        );

        if (appointmentDate >= baseStartTime) {
          appointmentDates.push(new Date(appointmentDate));
          appointmentIndex++;
        }
      }
    }

    for (
      let i = 0;
      i < appointments.length && i < appointmentDates.length;
      i++
    ) {
      const newStartDate = new Date(appointmentDates[i]);
      newStartDate.setHours(baseStartTime.getHours());
      newStartDate.setMinutes(baseStartTime.getMinutes());
      newStartDate.setSeconds(0);
      newStartDate.setMilliseconds(0);

      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Remove recurring_appointment_id from updateData to prevent accidental removal
      const { recurring_appointment_id, ...cleanUpdateData } =
        updateData as Record<string, unknown>;

      await prisma.appointment.update({
        where: { id: appointments[i].id },
        data: {
          ...cleanUpdateData,
          start_date: newStartDate,
          end_date: newEndDate,
          recurring_rule: updateData.recurring_rule,
        },
      });
    }
  } else if (freq === "MONTHLY") {
    let monthOffset = 1;

    for (const futureAppt of appointments) {
      const newStartDate = new Date(baseStartTime);

      if (byMonthDay) {
        newStartDate.setMonth(newStartDate.getMonth() + monthOffset * interval);
        newStartDate.setDate(parseInt(byMonthDay));
      } else {
        newStartDate.setMonth(newStartDate.getMonth() + monthOffset * interval);
      }

      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Remove recurring_appointment_id from updateData to prevent accidental removal
      const { recurring_appointment_id, ...cleanUpdateData } =
        updateData as Record<string, unknown>;

      await prisma.appointment.update({
        where: { id: futureAppt.id },
        data: {
          ...cleanUpdateData,
          start_date: newStartDate,
          end_date: newEndDate,
          recurring_rule: updateData.recurring_rule,
        },
      });

      monthOffset++;
    }
  } else {
    let offsetMultiplier = 1;

    for (const futureAppt of appointments) {
      const newStartDate = new Date(baseStartTime);

      switch (freq) {
        case "DAILY":
          newStartDate.setDate(
            newStartDate.getDate() + offsetMultiplier * interval,
          );
          break;
        case "WEEKLY":
          newStartDate.setDate(
            newStartDate.getDate() + offsetMultiplier * 7 * interval,
          );
          break;
        case "YEARLY":
          newStartDate.setFullYear(
            newStartDate.getFullYear() + offsetMultiplier * interval,
          );
          break;
      }

      const newEndDate = new Date(newStartDate.getTime() + duration);

      // Remove recurring_appointment_id from updateData to prevent accidental removal
      const { recurring_appointment_id, ...cleanUpdateData } =
        updateData as Record<string, unknown>;

      await prisma.appointment.update({
        where: { id: futureAppt.id },
        data: {
          ...cleanUpdateData,
          start_date: newStartDate,
          end_date: newEndDate,
          recurring_rule: updateData.recurring_rule,
        },
      });

      offsetMultiplier++;
    }
  }
}

export async function updateRecurringByTimeChange(
  appointments: AppointmentToUpdate[],
  updateData: UpdateDataType,
  originalStartTime: Date,
  originalEndTime: Date,
  newStartTime: Date,
  newEndTime: Date,
) {
  const startHourChange =
    newStartTime.getHours() - originalStartTime.getHours();
  const startMinuteChange =
    newStartTime.getMinutes() - originalStartTime.getMinutes();
  const endHourChange = newEndTime.getHours() - originalEndTime.getHours();
  const endMinuteChange =
    newEndTime.getMinutes() - originalEndTime.getMinutes();

  const startDayChange = Math.floor(
    (newStartTime.getTime() - originalStartTime.getTime()) /
      (1000 * 60 * 60 * 24),
  );
  const endDayChange = Math.floor(
    (newEndTime.getTime() - originalEndTime.getTime()) / (1000 * 60 * 60 * 24),
  );

  for (const appt of appointments) {
    const futureStart = new Date(appt.start_date);
    const futureEnd = new Date(appt.end_date);

    if (startDayChange !== 0) {
      futureStart.setDate(futureStart.getDate() + startDayChange);
    }
    if (endDayChange !== 0) {
      futureEnd.setDate(futureEnd.getDate() + endDayChange);
    }

    futureStart.setHours(futureStart.getHours() + startHourChange);
    futureStart.setMinutes(futureStart.getMinutes() + startMinuteChange);
    futureEnd.setHours(futureEnd.getHours() + endHourChange);
    futureEnd.setMinutes(futureEnd.getMinutes() + endMinuteChange);

    // Remove recurring_appointment_id from updateData to prevent accidental removal
    const { recurring_appointment_id, ...safeUpdateData } =
      updateData as Record<string, unknown>;

    await prisma.appointment.update({
      where: { id: appt.id },
      data: {
        ...safeUpdateData,
        start_date: futureStart,
        end_date: futureEnd,
        recurring_rule: updateData.recurring_rule, // Ensure recurring rule is updated
      },
    });
  }
}
