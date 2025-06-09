import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { withErrorHandling } from "@mcw/utils";
import { AppointmentType } from "@mcw/types";
import {
  validateAppointmentData,
  createAppointmentWhereClause,
  checkAppointmentLimit,
  parseRecurringRule,
  adjustDateForRecurringPattern,
  getAppointmentIncludes,
  addDefaultAppointmentTags,
  BaseAppointmentData,
} from "@/utils/appointment-helpers";
import {
  createWeeklyRecurringWithDays,
  createStandardRecurring,
} from "@/utils/appointment-recurring";
import {
  handleUpdateThisOnly,
  handleUpdateFuture,
  handleDeleteSingle,
  handleDeleteAll,
  handleDeleteFuture,
} from "@/utils/appointment-handlers";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (id) {
    logger.info("Retrieving specific appointment");

    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        ...getAppointmentIncludes(),
        User: true,
        PracticeService: true,
        Invoice: {
          include: {
            Payment: true,
          },
        },
      },
    });

    if (!appointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    let isFirstForGroup = false;
    if (appointment.client_group_id) {
      const count = await prisma.appointment.count({
        where: { client_group_id: appointment.client_group_id },
      });
      isFirstForGroup = count === 1;
    }

    return NextResponse.json({
      ...appointment,
      isFirstAppointmentForGroup: isFirstForGroup,
    });
  }

  logger.info("Retrieving appointments with filters");

  const whereClause = createAppointmentWhereClause({
    clinicianId: searchParams.get("clinicianId"),
    clientGroupId: searchParams.get("clientGroupId"),
    startDate: searchParams.get("startDate"),
    endDate: searchParams.get("endDate"),
    status: searchParams.get("status"),
  });

  const appointments = await prisma.appointment.findMany({
    where: whereClause,
    include: {
      ...getAppointmentIncludes(),
      Invoice: {
        include: {
          Payment: true,
        },
      },
    },
    orderBy: {
      start_date: "asc",
    },
  });

  const uniqueGroupIds = Array.from(
    new Set(
      appointments
        .map((a) => a.client_group_id)
        .filter((id): id is string => id !== null),
    ),
  );

  let groupCountMap = new Map<string, number>();

  if (uniqueGroupIds.length > 0) {
    try {
      const groupCounts = await prisma.appointment.groupBy({
        by: ["client_group_id"],
        where: {
          client_group_id: {
            in: uniqueGroupIds,
          },
        },
        _count: {
          client_group_id: true,
        },
      });

      groupCountMap = new Map(
        groupCounts.map((g) => [g.client_group_id!, g._count.client_group_id]),
      );
    } catch (groupCountError) {
      logger.error(
        `Error counting client group occurrences: ${groupCountError instanceof Error ? groupCountError.message : String(groupCountError)}`,
      );
    }
  }

  const appointmentsWithFlag = appointments.map((a) => {
    const isFirst = a.client_group_id
      ? groupCountMap.get(a.client_group_id) === 1
      : false;
    return {
      ...a,
      isFirstAppointmentForGroup: isFirst,
    };
  });

  return NextResponse.json(appointmentsWithFlag);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const data = await request.json();

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Invalid request data" },
      { status: 400 },
    );
  }

  const missingFields = validateAppointmentData(data);
  if (missingFields.length > 0) {
    return NextResponse.json(
      {
        error: "Missing required fields",
        missingFields: missingFields,
        receivedData: data,
      },
      { status: 400 },
    );
  }

  if (data.client_group_id) {
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: data.client_group_id },
    });

    if (!clientGroup) {
      return NextResponse.json(
        {
          error: "Invalid client group",
          details: `Client group with ID ${data.client_group_id} not found`,
        },
        { status: 400 },
      );
    }
  }

  const startDate = new Date(data.start_date);
  const endDate = data.end_date
    ? new Date(data.end_date)
    : new Date(data.start_date);

  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  if (data.clinician_id) {
    const limitReached = await checkAppointmentLimit(
      data.clinician_id,
      startDate,
    );
    if (limitReached) {
      return NextResponse.json(
        { error: "Appointment limit reached for this day." },
        { status: 400 },
      );
    }
  }

  const baseAppointmentData: BaseAppointmentData = {
    type: data.type || "APPOINTMENT",
    title: data.title,
    is_all_day: data.is_all_day || false,
    start_date: startDate,
    end_date: endDate,
    location_id: data.location_id,
    created_by: data.created_by || data.clinician_id,
    status: data.status || "SCHEDULED",
    client_group_id: data.client_group_id,
    clinician_id: data.clinician_id,
    service_id: data.service_id,
    appointment_fee: data.appointment_fee,
  };

  if (data.is_recurring && data.recurring_rule) {
    const ruleInfo = parseRecurringRule(data.recurring_rule);

    let adjustedStartDate = startDate;
    let adjustedEndDate = endDate;

    if (ruleInfo.freq === "WEEKLY" && ruleInfo.byDays.length > 0) {
      const adjusted = adjustDateForRecurringPattern(
        startDate,
        endDate,
        ruleInfo.byDays,
      );
      adjustedStartDate = adjusted.adjustedStartDate;
      adjustedEndDate = adjusted.adjustedEndDate;
    }

    const masterAppointment = await prisma.appointment.create({
      data: {
        ...baseAppointmentData,
        start_date: adjustedStartDate,
        end_date: adjustedEndDate,
        is_recurring: true,
        recurring_rule: data.recurring_rule,
      },
      include: getAppointmentIncludes(),
    });

    // Only add default tags for appointment type, not for events
    if (masterAppointment.type === AppointmentType.APPOINTMENT) {
      await addDefaultAppointmentTags(
        masterAppointment.id,
        masterAppointment.client_group_id,
      );
    }

    let allAppointments;

    if (ruleInfo.freq === "WEEKLY" && ruleInfo.byDays.length > 0) {
      allAppointments = await createWeeklyRecurringWithDays(
        baseAppointmentData,
        masterAppointment,
        ruleInfo,
        data.recurring_rule,
        startDate,
        endDate,
      );
    } else {
      allAppointments = await createStandardRecurring(
        baseAppointmentData,
        masterAppointment,
        ruleInfo,
        data.recurring_rule,
        startDate,
        endDate,
      );
    }

    const appointmentIds = allAppointments.map((apt) => apt.id);
    const appointmentsWithTags = await prisma.appointment.findMany({
      where: { id: { in: appointmentIds } },
      include: {
        ...getAppointmentIncludes(),
        AppointmentTag: {
          include: {
            Tag: true,
          },
        },
      },
      orderBy: {
        start_date: "asc",
      },
    });

    return NextResponse.json(appointmentsWithTags, { status: 201 });
  }

  const newAppointment = await prisma.appointment.create({
    data: {
      ...baseAppointmentData,
      is_recurring: false,
      recurring_rule: null,
    },
    include: getAppointmentIncludes(),
  });

  // Only add default tags for appointment type, not for events
  if (newAppointment.type === AppointmentType.APPOINTMENT) {
    await addDefaultAppointmentTags(
      newAppointment.id,
      newAppointment.client_group_id,
    );
  }

  const appointmentWithTags = await prisma.appointment.findUnique({
    where: { id: newAppointment.id },
    include: {
      ...getAppointmentIncludes(),
      AppointmentTag: {
        include: {
          Tag: true,
        },
      },
    },
  });

  return NextResponse.json(appointmentWithTags, { status: 201 });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const data = await request.json();

  if (!data.id) {
    return NextResponse.json(
      { error: "Appointment ID is required" },
      { status: 400 },
    );
  }

  const existingAppointment = await prisma.appointment.findUnique({
    where: { id: data.id },
  });

  if (!existingAppointment) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }

  if (!data.location_id) {
    return NextResponse.json(
      { error: "Location is required" },
      { status: 400 },
    );
  }

  if (!data.start_date || !data.end_date) {
    return NextResponse.json(
      { error: "Start date and end date are required" },
      { status: 400 },
    );
  }

  interface UpdateData {
    type: string;
    title: string;
    is_all_day: boolean;
    start_date: Date;
    end_date: Date;
    location_id: string;
    status: string;
    client_group_id: string | null;
    clinician_id: string;
    is_recurring: boolean;
    recurring_rule: string | null;
    service_id: string | null;
    appointment_fee: number;
    [key: string]: unknown;
  }

  const updateData: UpdateData = {
    type: data.type || existingAppointment.type,
    title: data.title || existingAppointment.title,
    is_all_day: data.is_all_day ?? existingAppointment.is_all_day,
    start_date: new Date(data.start_date),
    end_date: new Date(data.end_date),
    location_id: data.location_id,
    status: data.status || existingAppointment.status,
    client_group_id:
      data.client_group_id === null
        ? null
        : data.client_group_id || existingAppointment.client_group_id,
    clinician_id: data.clinician_id || existingAppointment.clinician_id,
    is_recurring: data.is_recurring ?? existingAppointment.is_recurring,
    recurring_rule:
      data.recurring_rule === null
        ? null
        : data.recurring_rule || existingAppointment.recurring_rule,
    service_id:
      data.service_id === null
        ? null
        : data.service_id || existingAppointment.service_id,
    appointment_fee:
      data.appointment_fee ?? existingAppointment.appointment_fee,
  };

  if (existingAppointment.is_recurring && data.updateOption) {
    const updateOption = data.updateOption;

    if (updateOption === "this") {
      return handleUpdateThisOnly(data.id, existingAppointment, updateData);
    } else if (updateOption === "future") {
      return handleUpdateFuture(data.id, existingAppointment, updateData);
    }
  }

  const finalUpdateData = { ...updateData };

  if (existingAppointment.is_recurring) {
    delete finalUpdateData.recurring_appointment_id;

    if (data.recurring_rule !== undefined) {
      finalUpdateData.recurring_rule = data.recurring_rule;
    } else if (data.recurring_pattern !== undefined) {
      finalUpdateData.recurring_rule = data.recurring_pattern;
    }
  }

  const updatedAppointment = await prisma.appointment.update({
    where: { id: data.id },
    data: finalUpdateData,
    include: {
      ...getAppointmentIncludes(),
      AppointmentTag: {
        include: {
          Tag: true,
        },
      },
    },
  });

  return NextResponse.json(updatedAppointment);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");
  const deleteOption = searchParams.get("deleteOption");

  if (!id) {
    return NextResponse.json(
      { error: "Appointment ID is required" },
      { status: 400 },
    );
  }

  const existingAppointment = await prisma.appointment.findUnique({
    where: { id },
  });

  if (!existingAppointment) {
    return NextResponse.json(
      { error: "Appointment not found" },
      { status: 404 },
    );
  }

  const attachedInvoices = await prisma.invoice.findMany({
    where: { appointment_id: id },
    select: { id: true },
  });

  if (attachedInvoices.length > 0) {
    return NextResponse.json(
      {
        error: "Cannot delete appointment with attached invoices",
        hasInvoices: true,
      },
      { status: 409 },
    );
  }

  if (!existingAppointment.is_recurring || deleteOption === "single") {
    return handleDeleteSingle(id, existingAppointment);
  }

  const masterId = existingAppointment.recurring_appointment_id || id;
  const isParent = !existingAppointment.recurring_appointment_id;
  const currentDate = new Date(existingAppointment.start_date);

  if (deleteOption === "all") {
    return handleDeleteAll(masterId);
  } else if (deleteOption === "future") {
    return handleDeleteFuture(
      id,
      masterId,
      isParent,
      currentDate,
      existingAppointment,
    );
  }

  return NextResponse.json({
    message: "Appointments deleted successfully",
  });
});
