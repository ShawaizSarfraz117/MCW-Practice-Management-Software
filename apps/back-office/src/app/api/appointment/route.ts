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
    const clientId = searchParams.get("clientId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (id) {
      logger.info("Retrieving specific appointment");
      // Retrieve specific appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id },
        include: {
          Client: true,
          Clinician: true,
          Location: true,
          User: true,
        },
      });

      if (!appointment) {
        return NextResponse.json(
          { error: "Appointment not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(appointment);
    } else {
      logger.info("Retrieving appointments with filters");
      // Construct where clause based on provided filters
      const whereClause: Prisma.AppointmentWhereInput = {};

      if (clinicianId) {
        whereClause.clinician_id = clinicianId;
      }

      if (clientId) {
        whereClause.client_id = clientId;
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

      // List appointments with filters
      const appointments = await prisma.appointment.findMany({
        where: whereClause,
        include: {
          Invoice: {
            include: {
              Payment: true,
            },
          },
          Client: {
            select: {
              id: true,
              legal_first_name: true,
              legal_last_name: true,
              preferred_name: true,
              is_active: true,
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

      return NextResponse.json(appointments);
    }
  } catch (error) {
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
    console.log("data", data);

    // Validate required fields based on type
    const isEventType = data.type === "event";

    // Skip client_id validation for event type appointments
    if (
      !data.title ||
      !data.start_date ||
      (!isEventType && !data.client_id) ||
      !data.clinician_id ||
      !data.location_id ||
      !data.created_by
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Base appointment data
    const baseAppointmentData = {
      type: data.type,
      title: data.title,
      is_all_day: data.is_all_day || false,
      location_id: data.location_id,
      created_by: data.created_by,
      status: data.status || "SCHEDULED",
      client_id: data.client_id,
      clinician_id: data.clinician_id,
      service_id: data.service_id,
      appointment_fee: data.appointment_fee,
    };

    // Check if it's a recurring appointment
    if (data.is_recurring && data.recurring_rule) {
      // Log the recurring rule
      console.log(
        `Processing recurring appointment with rule: ${data.recurring_rule}`,
      );

      // Parse the recurring rule
      const freq = data.recurring_rule.match(/FREQ=([^;]+)/)?.[1] || "WEEKLY";
      const count = parseInt(
        data.recurring_rule.match(/COUNT=([^;]+)/)?.[1] || "0",
      );
      const interval = parseInt(
        data.recurring_rule.match(/INTERVAL=([^;]+)/)?.[1] || "1",
      );

      // Parse BYDAY for weekly recurrence with multiple days
      const byDayMatch = data.recurring_rule.match(/BYDAY=([^;]+)/)?.[1];
      const byDays = byDayMatch ? byDayMatch.split(",") : [];

      // Create the master appointment
      const masterAppointment = await prisma.appointment.create({
        data: {
          ...baseAppointmentData,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date || data.start_date),
          is_recurring: true,
          recurring_rule: data.recurring_rule,
        },
        include: {
          Client: {
            select: {
              id: true,
              legal_first_name: true,
              legal_last_name: true,
              preferred_name: true,
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
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date || data.start_date);
      const duration = endDate.getTime() - startDate.getTime();

      // Define number of occurrences
      const defaultCount = 4; // Default to 4 weeks if no count specified
      const maxOccurrences = count > 0 ? count : defaultCount;

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
          week < Math.ceil(maxOccurrences / byDays.length);
          week++
        ) {
          // For each day specified in BYDAY
          for (const dayCode of byDays) {
            // Skip if we've reached the maximum count
            if (createdCount >= maxOccurrences) break;

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
              appointmentDate.getTime() + duration,
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
                  Client: {
                    select: {
                      id: true,
                      legal_first_name: true,
                      legal_last_name: true,
                      preferred_name: true,
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
        const maxOccurrencesStandard = Math.min(count > 0 ? count - 1 : 9, 9);

        for (let i = 0; i < maxOccurrencesStandard; i++) {
          // Calculate the next occurrence date based on frequency
          const nextDate = new Date(startDate);

          if (freq === "WEEKLY") {
            nextDate.setDate(nextDate.getDate() + (i + 1) * 7 * interval);
          } else if (freq === "MONTHLY") {
            nextDate.setMonth(nextDate.getMonth() + (i + 1) * interval);
          } else if (freq === "YEARLY") {
            nextDate.setFullYear(nextDate.getFullYear() + (i + 1) * interval);
          }

          // Calculate end date for this occurrence
          const nextEndDate = new Date(nextDate.getTime() + duration);

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
              Client: {
                select: {
                  id: true,
                  legal_first_name: true,
                  legal_last_name: true,
                  preferred_name: true,
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
    } else {
      // Not recurring, create a single appointment
      const newAppointment = await prisma.appointment.create({
        data: {
          ...baseAppointmentData,
          start_date: new Date(data.start_date),
          end_date: new Date(data.end_date || data.start_date),
          is_recurring: false,
          recurring_rule: null,
        },
        include: {
          Client: {
            select: {
              id: true,
              legal_first_name: true,
              legal_last_name: true,
              preferred_name: true,
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
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json(
      { error: "Failed to create appointment" },
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

    // Update appointment
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
        client_id: data.client_id,
        clinician_id: data.clinician_id,
        is_recurring: data.is_recurring,
        recurring_rule: data.recurring_rule || data.recurring_pattern,
        service_id: data.service_id,
        appointment_fee: data.appointment_fee,
        recurring_appointment_id: data.recurring_appointment_id,
      },
      include: {
        Client: {
          select: {
            id: true,
            legal_first_name: true,
            legal_last_name: true,
            preferred_name: true,
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
      { error: "Failed to update appointment" },
      { status: 500 },
    );
  }
}

// DELETE - Cancel/delete an appointment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const _cancelReason = searchParams.get("cancelReason");

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

    // Update appointment status to CANCELLED
    const cancelledAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: "CANCELLED",
      },
    });

    return NextResponse.json({
      message: "Appointment cancelled successfully",
      appointment: cancelledAppointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error);
    return NextResponse.json(
      { error: "Failed to cancel appointment" },
      { status: 500 },
    );
  }
}
