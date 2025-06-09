import { prisma } from "@mcw/database";
import { NextResponse } from "next/server";
import {
  getAppointmentIncludes,
  parseRecurringRule,
  DAY_CODE_TO_INDEX,
} from "./appointment-helpers";

interface ExistingAppointment {
  id: string;
  recurring_appointment_id: string | null;
  recurring_rule: string | null;
  is_recurring: boolean;
  start_date: Date;
  [key: string]: unknown;
}

interface UpdateData {
  [key: string]: unknown;
}

export async function handleUpdateThisOnly(
  appointmentId: string,
  existingAppointment: ExistingAppointment,
  updateData: UpdateData,
) {
  if (!existingAppointment.recurring_appointment_id) {
    const childAppointments = await prisma.appointment.findMany({
      where: { recurring_appointment_id: appointmentId },
      orderBy: { start_date: "asc" },
    });

    if (childAppointments.length > 0) {
      const newParent = childAppointments[0];
      const remainingChildren = childAppointments.slice(1);

      await prisma.appointment.update({
        where: { id: newParent.id },
        data: {
          recurring_appointment_id: null,
          recurring_rule: existingAppointment.recurring_rule,
        },
      });

      if (remainingChildren.length > 0) {
        await prisma.appointment.updateMany({
          where: {
            id: { in: remainingChildren.map((child) => child.id) },
          },
          data: { recurring_appointment_id: newParent.id },
        });
      }

      updateData.is_recurring = false;
      updateData.recurring_rule = null;
    }
  } else {
    updateData.is_recurring = false;
    updateData.recurring_rule = null;
    updateData.recurring_appointment_id = null;
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: appointmentId },
    data: updateData,
    include: {
      ...getAppointmentIncludes(),
      AppointmentTag: {
        include: {
          Tag: true,
        },
      },
    },
  });

  return NextResponse.json({
    ...updatedAppointment,
    message: "Appointment updated and removed from recurring series",
  });
}

export async function handleUpdateFuture(
  appointmentId: string,
  existingAppointment: ExistingAppointment,
  updateData: UpdateData,
) {
  const isParent = !existingAppointment.recurring_appointment_id;
  const { recurring_appointment_id, ...cleanUpdateData } = updateData;

  if (isParent) {
    const updatedParent = await prisma.appointment.update({
      where: { id: appointmentId },
      data: cleanUpdateData,
      include: {
        ...getAppointmentIncludes(),
        AppointmentTag: {
          include: {
            Tag: true,
          },
        },
      },
    });

    const childAppointments = await prisma.appointment.findMany({
      where: {
        recurring_appointment_id: appointmentId,
      },
      orderBy: {
        start_date: "asc",
      },
    });

    const newRule = updateData.recurring_rule as string | null;
    if (newRule && newRule !== existingAppointment.recurring_rule) {
      const ruleInfo = parseRecurringRule(newRule);
      const duration =
        new Date(updatedParent.end_date).getTime() -
        new Date(updatedParent.start_date).getTime();

      if (ruleInfo.freq === "WEEKLY" && ruleInfo.byDays.length > 0) {
        const parentStartDate = new Date(updatedParent.start_date);
        const parentDayIndex = parentStartDate.getDay();

        let parentPositionInPattern = -1;
        for (let i = 0; i < ruleInfo.byDays.length; i++) {
          if (DAY_CODE_TO_INDEX[ruleInfo.byDays[i]] === parentDayIndex) {
            parentPositionInPattern = i;
            break;
          }
        }

        if (parentPositionInPattern === -1) {
          const firstDayIndex = DAY_CODE_TO_INDEX[ruleInfo.byDays[0]];
          const daysToAdd = (firstDayIndex - parentDayIndex + 7) % 7 || 7;
          const newParentStart = new Date(parentStartDate);
          newParentStart.setDate(newParentStart.getDate() + daysToAdd);
          const newParentEnd = new Date(newParentStart.getTime() + duration);

          await prisma.appointment.update({
            where: { id: appointmentId },
            data: {
              start_date: newParentStart,
              end_date: newParentEnd,
            },
          });

          parentStartDate.setTime(newParentStart.getTime());
          parentPositionInPattern = 0;
        }

        let lastDate = new Date(parentStartDate);
        // const currentPatternIndex = parentPositionInPattern;

        for (const child of childAppointments) {
          let found = false;
          const searchDate = new Date(lastDate);

          while (!found) {
            searchDate.setDate(searchDate.getDate() + 1);

            const dayIndex = searchDate.getDay();
            const dayCode = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
              dayIndex
            ];

            if (ruleInfo.byDays.includes(dayCode)) {
              const weeksDiff = Math.floor(
                (searchDate.getTime() - parentStartDate.getTime()) /
                  (7 * 24 * 60 * 60 * 1000),
              );

              if (weeksDiff % ruleInfo.interval === 0) {
                found = true;
                lastDate = new Date(searchDate);
              }
            }
          }

          const newStartDate = new Date(lastDate);
          newStartDate.setHours(parentStartDate.getHours());
          newStartDate.setMinutes(parentStartDate.getMinutes());
          newStartDate.setSeconds(0);
          newStartDate.setMilliseconds(0);

          const newEndDate = new Date(newStartDate.getTime() + duration);

          await prisma.appointment.update({
            where: { id: child.id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });
        }
      } else {
        const parentStart = new Date(updatedParent.start_date);

        for (let i = 0; i < childAppointments.length; i++) {
          const newStartDate = new Date(parentStart);

          switch (ruleInfo.freq) {
            case "DAILY":
              newStartDate.setDate(
                newStartDate.getDate() + (i + 1) * ruleInfo.interval,
              );
              break;
            case "WEEKLY":
              newStartDate.setDate(
                newStartDate.getDate() + (i + 1) * 7 * ruleInfo.interval,
              );
              break;
            case "MONTHLY":
              newStartDate.setMonth(
                newStartDate.getMonth() + (i + 1) * ruleInfo.interval,
              );
              break;
            case "YEARLY":
              newStartDate.setFullYear(
                newStartDate.getFullYear() + (i + 1) * ruleInfo.interval,
              );
              break;
          }

          const newEndDate = new Date(newStartDate.getTime() + duration);

          await prisma.appointment.update({
            where: { id: childAppointments[i].id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });
        }
      }
    } else {
      for (const child of childAppointments) {
        const timeDiff =
          new Date(updateData.start_date as Date).getTime() -
          new Date(existingAppointment.start_date).getTime();

        if (timeDiff !== 0) {
          const newStartDate = new Date(child.start_date);
          newStartDate.setTime(newStartDate.getTime() + timeDiff);
          const newEndDate = new Date(child.end_date);
          newEndDate.setTime(newEndDate.getTime() + timeDiff);

          await prisma.appointment.update({
            where: { id: child.id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });
        } else {
          await prisma.appointment.update({
            where: { id: child.id },
            data: cleanUpdateData,
          });
        }
      }
    }

    return NextResponse.json({
      ...updatedParent,
      message: "This and all future appointments updated",
    });
  } else {
    const parentId = existingAppointment.recurring_appointment_id;
    if (!parentId) {
      throw new Error("Invalid recurring appointment structure");
    }

    const parentAppointment = await prisma.appointment.findUnique({
      where: { id: parentId },
    });

    if (!parentAppointment) {
      throw new Error("Parent appointment not found");
    }

    const updatedChild = await prisma.appointment.update({
      where: { id: appointmentId },
      data: cleanUpdateData,
      include: {
        ...getAppointmentIncludes(),
        AppointmentTag: {
          include: {
            Tag: true,
          },
        },
      },
    });

    const futureSiblings = await prisma.appointment.findMany({
      where: {
        recurring_appointment_id: parentId,
        start_date: { gt: existingAppointment.start_date },
      },
      orderBy: {
        start_date: "asc",
      },
    });

    const parentNeedsUpdate =
      parentAppointment.start_date > existingAppointment.start_date;

    const newRule = updateData.recurring_rule as string | null;
    if (newRule && newRule !== existingAppointment.recurring_rule) {
      if (parentNeedsUpdate) {
        await prisma.appointment.update({
          where: { id: parentId },
          data: { recurring_rule: newRule },
        });
      }

      const ruleInfo = parseRecurringRule(newRule);
      const duration =
        new Date(updatedChild.end_date).getTime() -
        new Date(updatedChild.start_date).getTime();
      let lastDate = new Date(updatedChild.start_date);

      // Update all future siblings
      for (const sibling of futureSiblings) {
        if (ruleInfo.freq === "WEEKLY" && ruleInfo.byDays.length > 0) {
          // For weekly with specific days, find the next occurrence
          let found = false;
          const searchDate = new Date(lastDate);

          while (!found) {
            searchDate.setDate(searchDate.getDate() + 1);
            const dayIndex = searchDate.getDay();
            const dayCode = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"][
              dayIndex
            ];

            if (ruleInfo.byDays.includes(dayCode)) {
              const weeksDiff = Math.floor(
                (searchDate.getTime() - updatedChild.start_date.getTime()) /
                  (7 * 24 * 60 * 60 * 1000),
              );

              if (weeksDiff % ruleInfo.interval === 0) {
                found = true;
                lastDate = new Date(searchDate);
              }
            }
          }

          const newStartDate = new Date(lastDate);
          newStartDate.setHours(updatedChild.start_date.getHours());
          newStartDate.setMinutes(updatedChild.start_date.getMinutes());
          newStartDate.setSeconds(0);
          newStartDate.setMilliseconds(0);

          const newEndDate = new Date(newStartDate.getTime() + duration);

          await prisma.appointment.update({
            where: { id: sibling.id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });
        } else {
          // For other patterns, calculate from last date
          const newStartDate = new Date(lastDate);

          switch (ruleInfo.freq) {
            case "DAILY":
              newStartDate.setDate(newStartDate.getDate() + ruleInfo.interval);
              break;
            case "WEEKLY":
              newStartDate.setDate(
                newStartDate.getDate() + 7 * ruleInfo.interval,
              );
              break;
            case "MONTHLY":
              newStartDate.setMonth(
                newStartDate.getMonth() + ruleInfo.interval,
              );
              break;
            case "YEARLY":
              newStartDate.setFullYear(
                newStartDate.getFullYear() + ruleInfo.interval,
              );
              break;
          }

          const newEndDate = new Date(newStartDate.getTime() + duration);

          await prisma.appointment.update({
            where: { id: sibling.id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });

          lastDate = new Date(newStartDate);
        }
      }
    } else {
      // No recurring rule change, just propagate the changes
      const timeDiff =
        new Date(updateData.start_date as Date).getTime() -
        new Date(existingAppointment.start_date).getTime();

      for (const sibling of futureSiblings) {
        if (timeDiff !== 0) {
          const newStartDate = new Date(sibling.start_date);
          newStartDate.setTime(newStartDate.getTime() + timeDiff);
          const newEndDate = new Date(sibling.end_date);
          newEndDate.setTime(newEndDate.getTime() + timeDiff);

          await prisma.appointment.update({
            where: { id: sibling.id },
            data: {
              ...cleanUpdateData,
              start_date: newStartDate,
              end_date: newEndDate,
            },
          });
        } else {
          await prisma.appointment.update({
            where: { id: sibling.id },
            data: cleanUpdateData,
          });
        }
      }
    }

    return NextResponse.json({
      ...updatedChild,
      message: "This and all future appointments updated",
    });
  }
}

export async function handleDeleteSingle(
  appointmentId: string,
  existingAppointment: ExistingAppointment,
) {
  if (
    existingAppointment.is_recurring &&
    !existingAppointment.recurring_appointment_id
  ) {
    const childAppointments = await prisma.appointment.findMany({
      where: { recurring_appointment_id: appointmentId },
      orderBy: { start_date: "asc" },
    });

    if (childAppointments.length > 0) {
      const newParent = childAppointments[0];
      const remainingChildren = childAppointments.slice(1);

      await prisma.appointment.update({
        where: { id: newParent.id },
        data: {
          recurring_appointment_id: null,
          recurring_rule: existingAppointment.recurring_rule,
        },
      });

      if (remainingChildren.length > 0) {
        await prisma.appointment.updateMany({
          where: {
            id: { in: remainingChildren.map((child) => child.id) },
          },
          data: { recurring_appointment_id: newParent.id },
        });
      }
    }
  }

  await prisma.appointmentTag.deleteMany({
    where: { appointment_id: appointmentId },
  });

  await prisma.appointment.delete({
    where: { id: appointmentId },
  });

  return NextResponse.json({
    message: "Appointment deleted successfully",
  });
}

export async function handleDeleteAll(masterId: string) {
  const appointmentsToDelete = await prisma.appointment.findMany({
    where: {
      OR: [{ recurring_appointment_id: masterId }, { id: masterId }],
    },
    select: { id: true },
  });

  const appointmentIds = appointmentsToDelete.map((apt) => apt.id);

  await prisma.appointmentTag.deleteMany({
    where: {
      appointment_id: { in: appointmentIds },
    },
  });

  await prisma.appointment.deleteMany({
    where: {
      id: { in: appointmentIds },
    },
  });

  return NextResponse.json({
    message: "All appointments in the series deleted successfully",
  });
}

export async function handleDeleteFuture(
  appointmentId: string,
  masterId: string,
  isParent: boolean,
  currentDate: Date,
  existingAppointment: ExistingAppointment,
) {
  if (isParent) {
    const pastChildren = await prisma.appointment.findMany({
      where: {
        recurring_appointment_id: appointmentId,
        start_date: { lt: currentDate },
      },
      orderBy: { start_date: "desc" },
    });

    if (pastChildren.length > 0) {
      const newParent = pastChildren[0];
      const otherPastChildren = pastChildren.slice(1);

      await prisma.appointment.update({
        where: { id: newParent.id },
        data: {
          recurring_appointment_id: null,
          recurring_rule: existingAppointment.recurring_rule,
        },
      });

      if (otherPastChildren.length > 0) {
        await prisma.appointment.updateMany({
          where: {
            id: { in: otherPastChildren.map((child) => child.id) },
          },
          data: { recurring_appointment_id: newParent.id },
        });
      }
    }

    const futureAppointments = await prisma.appointment.findMany({
      where: {
        OR: [
          {
            recurring_appointment_id: appointmentId,
            start_date: { gte: currentDate },
          },
          { id: appointmentId },
        ],
      },
      select: { id: true },
    });

    const appointmentIdsToDelete = futureAppointments.map((apt) => apt.id);

    await prisma.appointmentTag.deleteMany({
      where: {
        appointment_id: { in: appointmentIdsToDelete },
      },
    });

    await prisma.appointment.deleteMany({
      where: {
        id: { in: appointmentIdsToDelete },
      },
    });
  } else {
    const futureAppointments = await prisma.appointment.findMany({
      where: {
        recurring_appointment_id: masterId,
        start_date: { gte: currentDate },
      },
      select: { id: true },
    });

    const appointmentIdsToDelete = futureAppointments.map((apt) => apt.id);

    await prisma.appointmentTag.deleteMany({
      where: {
        appointment_id: { in: appointmentIdsToDelete },
      },
    });

    await prisma.appointment.deleteMany({
      where: {
        id: { in: appointmentIdsToDelete },
      },
    });
  }

  return NextResponse.json({
    message: "Future appointments deleted successfully",
  });
}
