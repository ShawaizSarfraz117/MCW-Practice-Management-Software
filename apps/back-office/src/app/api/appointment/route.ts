/* eslint-disable max-lines-per-function */
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { Prisma } from "@prisma/client";

// GET - Retrieve all appointments or a specific appointment by ID
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const clinicianId = searchParams.get("clinicianId");
    const clientGroupId = searchParams.get("clientGroupId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");

    if (id) {
      logger.info("Retrieving specific appointment");
      // Retrieve specific appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          ClientGroup: {
            include: {
              ClientGroupMembership: {
                include: {
                  Client: true,
                },
              },
            },
          },
          Clinician: true,
          Location: true,
          User: true,
          PracticeService: true,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      // For a single appointment, we still need to check if its group is unique overall
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
    } else {
      logger.info("Retrieving appointments with filters");
      // Construct where clause based on provided filters
      const whereClause: Prisma.AppointmentWhereInput = {};

      if (clinicianId) {
        whereClause.clinician_id = clinicianId;
      }

      if (clientGroupId) {
        whereClause.client_group_id = clientGroupId;
      }

      // Handle date range filtering
      if (startDate || endDate) {
        whereClause.start_date = {};

        if (startDate) {
          whereClause.start_date.gte = new Date(startDate);
        }

        if (endDate) {
          whereClause.start_date.lte = new Date(endDate);
        }
      }

      // Add invoice status filtering to the whereClause directly
      if (status && status !== "undefined") {
        whereClause.Invoice = {
          some: {
            status: status, // Filter directly on the invoice status field
          },
        };
      }

      // List appointments with filters
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          Invoice: {
            include: {
              Payment: true,
            },
          },
          ClientGroup: {
            include: {
              ClientGroupMembership: {
                select: {
                  client_id: true,
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
        },
        orderBy: {
          start_date: "asc",
        },
      });

      // 1. Extract unique non-null client_group_ids from the results
      const uniqueGroupIds = Array.from(
        new Set(
          appointments
            .map((a) => a.client_group_id)
            .filter((id): id is string => id !== null),
        ),
      );

      let groupCountMap = new Map<string, number>();

      // 2. If there are groups, count their total occurrences in the entire table
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

          // Convert result to a Map<client_group_id, count>
          groupCountMap = new Map(
            groupCounts.map((g) => [
              g.client_group_id!, // Non-null asserted as we filtered nulls and queried non-nulls
              g._count.client_group_id,
            ]),
          );
        } catch (groupCountError) {
          if (groupCountError instanceof Error) {
            logger.error(
              groupCountError,
              "Error counting client group occurrences:",
            );
          } else {
            logger.error(
              { error: groupCountError },
              "Unknown error counting client group occurrences:",
            );
          }
          // Proceed without the flag if counting fails
          groupCountMap = new Map<string, number>();
        }
      }

      // 3. Map results back to appointments, adding the flag
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
    }
  } catch (error) {
    // Log the main error (ensure it's handled correctly)
    if (error instanceof Error) {
      logger.error(error, "Error fetching appointments:");
    } else {
      logger.error({ error: error }, "Unknown error fetching appointments:");
    }
    // Use console.error as a fallback if logger fails or for visibility
    console.error("Error fetching appointments:", error);
    return NextResponse.json(
      { error: "Failed to fetch appointments" },
      { status: 500 },
    );
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate data structure
    if (!data || typeof data !== "object") {
      console.error("Invalid request data structure:", data);
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 },
      );
    }

    // Validate required fields based on type
    const isEventType = data.type === "event";

    // Required fields validation
    const missingFields = [];
    if (!data.title) missingFields.push("title");
    if (!data.start_date) missingFields.push("start date");
    if (!data.clinician_id) missingFields.push("clinician");
    if (!data.location_id) missingFields.push("location");
    if (!data.created_by) missingFields.push("created by");

    // Only validate client_group_id if this is a client appointment (not an event)
    if (!isEventType && !data.client_group_id) {
      missingFields.push("client");
    }

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

    // If client_group_id is provided, verify it exists
    if (data.client_group_id) {
      const clientGroup = await prisma.clientGroup.findUnique({
        where: { id: data.client_group_id },
      });

      if (!clientGroup) {
        console.error("Client group not found:", data.client_group_id);
        return NextResponse.json(
          {
            error: "Invalid client group",
            details: `Client group with ID ${data.client_group_id} not found`,
          },
          { status: 400 },
        );
      }
    }

    // Parse dates with timezone consideration
    const parseDate = (dateString: string) => {
      try {
        if (!dateString) {
          throw new Error("Date string is empty or undefined");
        }

        // Try to parse the date
        const date = new Date(dateString);

        // Validate the parsed date
        if (isNaN(date.getTime())) {
          console.error("Invalid date format:", dateString);
          throw new Error(`Invalid date format: ${dateString}`);
        }

        return date;
      } catch (error) {
        console.error(
          "Date parsing error:",
          error,
          "for date string:",
          dateString,
        );
        throw error;
      }
    };

    try {
      // Validate dates before proceeding
      const startDate = parseDate(data.start_date);
      const endDate = data.end_date
        ? parseDate(data.end_date)
        : parseDate(data.start_date);

      // Check appointment limit for the day (single appointment)
      const dayStart = new Date(startDate);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(startDate);
      dayEnd.setHours(23, 59, 59, 999);
      if (data.clinician_id) {
        // Get the limit for this clinician and day
        const limitRecord = await prisma.appointmentLimit.findFirst({
          where: {
            clinician_id: data.clinician_id,
            date: {
              gte: dayStart,
              lte: dayEnd,
            },
          },
        });
        if (limitRecord && limitRecord.max_limit > 0) {
          // Count existing appointments for this clinician on this day
          const apptCount = await prisma.appointment.count({
            where: {
              clinician_id: data.clinician_id,
              start_date: {
                gte: dayStart,
                lte: dayEnd,
              },
              status: { not: "CANCELLED" },
            },
          });
          if (apptCount >= limitRecord.max_limit) {
            return NextResponse.json(
              { error: "Appointment limit reached for this day." },
              { status: 400 },
            );
          }
        }
      }

      // Base appointment data
      const baseAppointmentData = {
        type: data.type || "APPOINTMENT",
        title: data.title,
        is_all_day: data.is_all_day || false,
        start_date: startDate,
        end_date: endDate,
        location_id: data.location_id,
        created_by: data.created_by,
        status: data.status || "SCHEDULED",
        client_group_id: data.client_group_id,
        clinician_id: data.clinician_id,
        service_id: data.service_id,
        appointment_fee: data.appointment_fee,
      };

      // Check if it's a recurring appointment
      if (data.is_recurring && data.recurring_rule) {
        try {
          // Parse the recurring rule
          const freq =
            data.recurring_rule.match(/FREQ=([^;]+)/)?.[1] || "WEEKLY";
          const count = parseInt(
            data.recurring_rule.match(/COUNT=([^;]+)/)?.[1] || "0",
          );
          const interval = parseInt(
            data.recurring_rule.match(/INTERVAL=([^;]+)/)?.[1] || "1",
          );
          const byDayMatch = data.recurring_rule.match(/BYDAY=([^;]+)/)?.[1];
          const byDays = byDayMatch ? byDayMatch.split(",") : [];

          // Create the master appointment with parsed dates
          const masterAppointment = await prisma.appointment.create({
            data: {
              ...baseAppointmentData,
              start_date: startDate,
              end_date: endDate,
              is_recurring: true,
              recurring_rule: data.recurring_rule,
            },
            include: {
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
            },
          });

          // Create recurring instances
          const recurringAppointments = [masterAppointment];

          // For WEEKLY frequency with BYDAY parameter
          if (freq === "WEEKLY" && byDays.length > 0) {
            // Map of day codes to day indices (0 = Sunday, 1 = Monday, etc.)
            const dayCodeToIndex: Record<string, number> = {
              SU: 0,
              MO: 1,
              TU: 2,
              WE: 3,
              TH: 4,
              FR: 5,
              SA: 6,
            };

            // Get the day of the week for the start date (0-6)
            const startDayOfWeek = startDate.getDay();

            // Calculate the start of the current week (Sunday)
            const startOfWeek = new Date(startDate);
            startOfWeek.setDate(startDate.getDate() - startDayOfWeek);

            // Count how many appointments we've created
            let createdCount = 0;

            // Create appointments for each specified day for several weeks
            for (
              let week = 0;
              week < Math.ceil(count > 0 ? count : 4);
              week++
            ) {
              // For each day specified in BYDAY
              for (const dayCode of byDays) {
                // Skip if we've reached the maximum count
                if (createdCount >= count) break;

                const dayIndex = dayCodeToIndex[dayCode];
                if (dayIndex === undefined) continue; // Invalid day code

                // Calculate the date for this appointment
                const appointmentDate = new Date(startOfWeek);
                appointmentDate.setDate(
                  startOfWeek.getDate() + dayIndex + week * 7 * interval,
                );

                // Skip if this date is before the start date
                if (appointmentDate < startDate) continue;

                // Skip if this is exactly the same as the master appointment's date
                if (
                  appointmentDate.toISOString().split("T")[0] ===
                    startDate.toISOString().split("T")[0] &&
                  dayIndex === startDayOfWeek &&
                  week === 0
                ) {
                  continue;
                }

                // Calculate end date for this occurrence
                const appointmentEndDate = new Date(
                  appointmentDate.getTime() +
                    (endDate.getTime() - startDate.getTime()),
                );

                try {
                  // Create the recurring appointment
                  const recurringAppointment = await prisma.appointment.create({
                    data: {
                      ...baseAppointmentData,
                      start_date: appointmentDate,
                      end_date: appointmentEndDate,
                      is_recurring: true,
                      recurring_rule: data.recurring_rule,
                      recurring_appointment_id: masterAppointment.id,
                    },
                    include: {
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
                    },
                  });

                  recurringAppointments.push(recurringAppointment);
                  createdCount++;
                } catch (error) {
                  console.error(
                    `Failed to create recurring appointment for date ${appointmentDate.toISOString()}:`,
                    error,
                  );
                }
              }
            }

            return NextResponse.json(recurringAppointments, { status: 201 });
          } else {
            // Handle standard recurrence (not using BYDAY with multiple days)
            // Calculate occurrences (max 10 for this implementation)
            const maxOccurrencesStandard = Math.min(
              count > 0 ? count - 1 : 9,
              9,
            );

            for (let i = 0; i < maxOccurrencesStandard; i++) {
              // Calculate the next occurrence date based on frequency
              const nextDate = new Date(startDate);

              if (freq === "WEEKLY") {
                nextDate.setDate(nextDate.getDate() + (i + 1) * 7 * interval);
              } else if (freq === "MONTHLY") {
                nextDate.setMonth(nextDate.getMonth() + (i + 1) * interval);
              } else if (freq === "YEARLY") {
                nextDate.setFullYear(
                  nextDate.getFullYear() + (i + 1) * interval,
                );
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
                  recurring_rule: data.recurring_rule,
                  recurring_appointment_id: masterAppointment.id,
                },
                include: {
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
                },
              });

              recurringAppointments.push(recurringAppointment);
            }

            return NextResponse.json(recurringAppointments, { status: 201 });
          }
        } catch (error) {
          console.error("Error processing recurring appointment:", error);
          return NextResponse.json(
            { error: "Failed to process recurring appointment" },
            { status: 500 },
          );
        }
      } else {
        // Not recurring, create a single appointment
        const newAppointment = await prisma.appointment.create({
          data: {
            ...baseAppointmentData,
            is_recurring: false,
            recurring_rule: null,
          },
          include: {
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
          },
        });

        return NextResponse.json(newAppointment, { status: 201 });
      }
    } catch (dateError) {
      console.error("Date validation error:", dateError);
      return NextResponse.json(
        {
          error: "Invalid date format",
          details:
            dateError instanceof Error
              ? dateError.message
              : "Unknown date error",
        },
        { status: 400 },
      );
    }
  } catch (error) {
    console.error("Top level error in appointment creation:", error);
    return NextResponse.json(
      {
        error: "Failed to create appointment",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}

// PUT - Update an existing appointment
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id: data.id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // Validate required fields
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

    // Prepare update data
    const updateData = {
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
      recurring_appointment_id:
        data.recurring_appointment_id === null
          ? null
          : data.recurring_appointment_id ||
            existingAppointment.recurring_appointment_id,
      service_id:
        data.service_id === null
          ? null
          : data.service_id || existingAppointment.service_id,
      appointment_fee:
        data.appointment_fee ?? existingAppointment.appointment_fee,
    };

    // Handle recurring appointments
    if (existingAppointment.is_recurring && data.updateOption) {
      const updateOption = data.updateOption; // 'this' or 'future'

      if (updateOption === "this") {
        // If updating a parent appointment with "this appointment only" option
        if (!existingAppointment.recurring_appointment_id) {
          // This is a parent appointment, find all children
          const childAppointments = await prisma.appointment.findMany({
            where: { recurring_appointment_id: data.id },
            orderBy: { start_date: "asc" },
          });

          if (childAppointments.length > 0) {
            // Get the first child to make it the new parent
            const newParent = childAppointments[0];
            const remainingChildren = childAppointments.slice(1);

            // Update the new parent to remove its recurring_appointment_id
            await prisma.appointment.update({
              where: { id: newParent.id },
              data: {
                recurring_appointment_id: null,
                recurring_rule: existingAppointment.recurring_rule,
              },
            });

            // Update all other children to point to the new parent
            if (remainingChildren.length > 0) {
              await prisma.appointment.updateMany({
                where: {
                  id: { in: remainingChildren.map((child) => child.id) },
                },
                data: { recurring_appointment_id: newParent.id },
              });
            }

            // Update the original parent as a standalone appointment
            updateData.is_recurring = false;
            updateData.recurring_rule = null;

            const updatedAppointment = await prisma.appointment.update({
              where: { id: data.id },
              data: updateData,
              include: {
                ClientGroup: {
                  select: {
                    id: true,
                    name: true,
                    type: true,
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
              },
            });

            return NextResponse.json({
              ...updatedAppointment,
              message: "Appointment updated and removed from recurring series",
            });
          }
        }

        // For child appointments or parents with no children, just update this one and make it non-recurring
        if (existingAppointment.recurring_appointment_id) {
          updateData.is_recurring = false;
          updateData.recurring_rule = null;
          updateData.recurring_appointment_id = null;
        }

        const updatedAppointment = await prisma.appointment.update({
          where: { id: data.id },
          data: updateData,
          include: {
            ClientGroup: {
              select: {
                id: true,
                name: true,
                type: true,
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
          },
        });

        return NextResponse.json({
          ...updatedAppointment,
          message: "Appointment updated and removed from recurring series",
        });
      } else if (updateOption === "future") {
        // Handle updating this and all future appointments
        const currentDate = new Date(existingAppointment.start_date);
        const isParent = !existingAppointment.recurring_appointment_id;
        const masterId =
          existingAppointment.recurring_appointment_id || data.id;

        if (isParent) {
          // This is the parent - update it and all future children
          // First update the parent
          const updatedParent = await prisma.appointment.update({
            where: { id: data.id },
            data: updateData,
            include: {
              ClientGroup: {
                select: {
                  id: true,
                  name: true,
                  type: true,
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
            },
          });

          // Then update all future child appointments
          await prisma.appointment.updateMany({
            where: {
              recurring_appointment_id: data.id,
              start_date: { gt: currentDate },
            },
            data: {
              type: updateData.type,
              title: updateData.title,
              is_all_day: updateData.is_all_day,
              location_id: updateData.location_id,
              status: updateData.status,
              client_group_id: updateData.client_group_id,
              clinician_id: updateData.clinician_id,
              service_id: updateData.service_id,
              appointment_fee: updateData.appointment_fee,
              // Don't update dates as they would disrupt the recurrence pattern
            },
          });

          return NextResponse.json({
            ...updatedParent,
            message: "This and all future appointments updated",
          });
        } else {
          // This is a child appointment
          // First, get the parent appointment
          const parentAppointment = await prisma.appointment.findUnique({
            where: { id: masterId },
          });

          if (!parentAppointment) {
            return NextResponse.json(
              { error: "Parent appointment not found" },
              { status: 404 },
            );
          }

          // Check if parent is before or after/equal to current appointment
          const parentDate = new Date(parentAppointment.start_date);

          if (parentDate >= currentDate) {
            // If parent is in the future too, update it
            await prisma.appointment.update({
              where: { id: masterId },
              data: {
                type: updateData.type,
                title: updateData.title,
                is_all_day: updateData.is_all_day,
                location_id: updateData.location_id,
                status: updateData.status,
                client_group_id: updateData.client_group_id,
                clinician_id: updateData.clinician_id,
                service_id: updateData.service_id,
                appointment_fee: updateData.appointment_fee,
              },
            });
          } else {
            // Parent is in the past, we need to split the series
            // First create a new parent from the current appointment
            const newParentData = {
              ...updateData,
              recurring_appointment_id: null,
              recurring_rule: parentAppointment.recurring_rule,
            };

            // Update this appointment to be the new parent
            const newParent = await prisma.appointment.update({
              where: { id: data.id },
              data: newParentData,
            });

            // Update all future appointments to point to this new parent
            await prisma.appointment.updateMany({
              where: {
                recurring_appointment_id: masterId,
                id: { not: data.id }, // exclude this appointment
                start_date: { gte: currentDate },
              },
              data: {
                recurring_appointment_id: data.id,
                type: updateData.type,
                title: updateData.title,
                is_all_day: updateData.is_all_day,
                location_id: updateData.location_id,
                status: updateData.status,
                client_group_id: updateData.client_group_id,
                clinician_id: updateData.clinician_id,
                service_id: updateData.service_id,
                appointment_fee: updateData.appointment_fee,
              },
            });

            // Return the updated appointment (new parent)
            return NextResponse.json({
              ...newParent,
              message:
                "Created new series with this and all future appointments",
            });
          }

          // Update the current appointment
          const updatedAppointment = await prisma.appointment.update({
            where: { id: data.id },
            data: updateData,
            include: {
              ClientGroup: {
                select: {
                  id: true,
                  name: true,
                  type: true,
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
            },
          });

          // Update all future appointments
          await prisma.appointment.updateMany({
            where: {
              recurring_appointment_id: masterId,
              id: { not: data.id }, // exclude this appointment
              start_date: { gt: currentDate },
            },
            data: {
              type: updateData.type,
              title: updateData.title,
              is_all_day: updateData.is_all_day,
              location_id: updateData.location_id,
              status: updateData.status,
              client_group_id: updateData.client_group_id,
              clinician_id: updateData.clinician_id,
              service_id: updateData.service_id,
              appointment_fee: updateData.appointment_fee,
            },
          });

          return NextResponse.json({
            ...updatedAppointment,
            message: "This and all future appointments updated",
          });
        }
      }
    }

    // For non-recurring appointments or no update option specified, just update this one
    const updatedAppointment = await prisma.appointment.update({
      where: { id: data.id },
      data: {
        type: data.type,
        title: data.title,
        is_all_day: data.is_all_day,
        start_date: data.start_date ? new Date(data.start_date) : undefined,
        end_date: data.end_date ? new Date(data.end_date) : undefined,
        location_id: data.location_id,
        status: data.status,
        client_group_id: data.client_group_id,
        clinician_id: data.clinician_id,
        is_recurring: data.is_recurring,
        recurring_rule: data.recurring_rule || data.recurring_pattern,
        service_id: data.service_id,
        appointment_fee: data.appointment_fee,
        recurring_appointment_id: data.recurring_appointment_id,
      },
      include: {
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
      },
    });

    return NextResponse.json(updatedAppointment);
  } catch (error) {
    console.error("Error updating appointment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to update appointment",
      },
      { status: 500 },
    );
  }
}

// DELETE - Cancel/delete an appointment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const deleteOption = searchParams.get("deleteOption"); // 'single', 'future', 'all'

    if (!id) {
      return NextResponse.json(
        { error: "Appointment ID is required" },
        { status: 400 },
      );
    }

    // Check if appointment exists
    const existingAppointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!existingAppointment) {
      return NextResponse.json(
        { error: "Appointment not found" },
        { status: 404 },
      );
    }

    // For non-recurring appointments or deleting just a single occurrence
    if (!existingAppointment.is_recurring || deleteOption === "single") {
      // Check if it's a parent appointment (no recurring_appointment_id) and is recurring
      if (
        existingAppointment.is_recurring &&
        !existingAppointment.recurring_appointment_id
      ) {
        // This is a parent appointment, find all children
        const childAppointments = await prisma.appointment.findMany({
          where: { recurring_appointment_id: id },
          orderBy: { start_date: "asc" },
        });

        if (childAppointments.length > 0) {
          // Get the first child to make it the new parent
          const newParent = childAppointments[0];
          const remainingChildren = childAppointments.slice(1);

          // Update the new parent to remove its recurring_appointment_id
          await prisma.appointment.update({
            where: { id: newParent.id },
            data: {
              recurring_appointment_id: null,
              // Copy any parent-specific recurring rules if needed
              recurring_rule: existingAppointment.recurring_rule,
            },
          });

          // Update all other children to point to the new parent
          if (remainingChildren.length > 0) {
            await prisma.appointment.updateMany({
              where: {
                id: { in: remainingChildren.map((child) => child.id) },
              },
              data: { recurring_appointment_id: newParent.id },
            });
          }

          // Now delete the original parent
          await prisma.appointment.delete({
            where: { id },
          });

          return NextResponse.json({
            message:
              "Appointment deleted successfully and recurring series updated",
          });
        }
      }

      // Either not a parent or has no children, delete normally
      await prisma.appointment.delete({
        where: { id },
      });

      return NextResponse.json({
        message: "Appointment deleted successfully",
      });
    }

    // Handle recurring appointments
    // Determine if this is a parent or child appointment
    const masterId = existingAppointment.recurring_appointment_id || id;
    const isParent = !existingAppointment.recurring_appointment_id;
    const currentDate = new Date(existingAppointment.start_date);

    if (deleteOption === "all") {
      // Delete all appointments in the series
      await prisma.appointment.deleteMany({
        where: {
          OR: [{ recurring_appointment_id: masterId }, { id: masterId }],
        },
      });

      return NextResponse.json({
        message: "All appointments in the series deleted successfully",
      });
    } else if (deleteOption === "future") {
      if (isParent) {
        // This is the parent appointment
        // Find all past child appointments (excluding the current/future ones)
        const pastChildren = await prisma.appointment.findMany({
          where: {
            recurring_appointment_id: id,
            start_date: { lt: currentDate },
          },
          orderBy: { start_date: "desc" }, // Most recent first
        });

        if (pastChildren.length > 0) {
          // There are past appointments to preserve
          // Promote the most recent past appointment as the new parent
          const newParent = pastChildren[0];
          const otherPastChildren = pastChildren.slice(1);

          // Update the new parent to remove its recurring_appointment_id
          await prisma.appointment.update({
            where: { id: newParent.id },
            data: {
              recurring_appointment_id: null,
              recurring_rule: existingAppointment.recurring_rule,
            },
          });

          // Update other past children to point to the new parent
          if (otherPastChildren.length > 0) {
            await prisma.appointment.updateMany({
              where: {
                id: { in: otherPastChildren.map((child) => child.id) },
              },
              data: { recurring_appointment_id: newParent.id },
            });
          }

          // Delete this appointment and all future appointments
          await prisma.appointment.deleteMany({
            where: {
              AND: [
                { recurring_appointment_id: id },
                { start_date: { gte: currentDate } },
              ],
            },
          });

          // Delete the parent appointment
          await prisma.appointment.delete({
            where: { id },
          });
        } else {
          // No past appointments, delete the entire series
          await prisma.appointment.deleteMany({
            where: {
              OR: [{ recurring_appointment_id: id }, { id }],
            },
          });
        }
      } else {
        // This is a child appointment
        // Delete this appointment and future ones in the series
        await prisma.appointment.deleteMany({
          where: {
            AND: [
              { recurring_appointment_id: masterId },
              { start_date: { gte: currentDate } },
            ],
          },
        });

        // Also delete the parent if this appointment date is the same or later than parent
        const parentAppointment = await prisma.appointment.findUnique({
          where: { id: masterId },
        });

        if (
          parentAppointment &&
          new Date(parentAppointment.start_date) <= currentDate
        ) {
          // Find past appointments before the parent
          const pastAppointments = await prisma.appointment.findMany({
            where: {
              recurring_appointment_id: masterId,
              start_date: { lt: new Date(parentAppointment.start_date) },
            },
            orderBy: { start_date: "desc" },
          });

          if (pastAppointments.length > 0) {
            // Promote the most recent past appointment as new parent
            const newParent = pastAppointments[0];
            const otherPastAppointments = pastAppointments.slice(1);

            await prisma.appointment.update({
              where: { id: newParent.id },
              data: {
                recurring_appointment_id: null,
                recurring_rule: parentAppointment.recurring_rule,
              },
            });

            if (otherPastAppointments.length > 0) {
              await prisma.appointment.updateMany({
                where: {
                  id: { in: otherPastAppointments.map((a) => a.id) },
                },
                data: { recurring_appointment_id: newParent.id },
              });
            }
          }

          // Delete the parent
          await prisma.appointment.delete({
            where: { id: masterId },
          });
        }
      }

      return NextResponse.json({
        message: "Future appointments deleted successfully",
      });
    }

    return NextResponse.json({
      message: "Appointments deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json(
      { error: "Failed to delete appointment" },
      { status: 500 },
    );
  }
}
