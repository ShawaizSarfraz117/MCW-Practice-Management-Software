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

    // Create new appointment
    const newAppointment = await prisma.appointment.create({
      data: {
        type: data.type,
        title: data.title,
        is_all_day: data.is_all_day || false,
        start_date: new Date(data.start_date),
        end_date: new Date(data.end_date || data.start_date),
        location_id: data.location_id,
        created_by: data.created_by,
        status: data.status || "SCHEDULED",
        client_id: data.client_id,
        clinician_id: data.clinician_id,
        is_recurring: data.is_recurring || false,
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

    return NextResponse.json(newAppointment, { status: 201 });
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
