import { NextRequest, NextResponse } from "next/server";

import {
  prisma,
  Appointment,
  PracticeService,
  Clinician,
  Location,
} from "@mcw/database";
import { withErrorHandling } from "@mcw/utils";
import { getBackOfficeSession } from "@/utils/helpers";

type AppointmentWithRelations = Appointment & {
  service: PracticeService | null;
  clinician: Clinician | null;
  location: Location | null;
};

type ClientAppointmentsResponse = {
  previous: AppointmentWithRelations[];
  next: AppointmentWithRelations[];
  current: AppointmentWithRelations | null;
};

export const GET = withErrorHandling(
  async (request: NextRequest, { params }: { params: { id: string } }) => {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const clientId = params.id;
    const searchParams = request.nextUrl.searchParams;
    const currentAppointmentId = searchParams.get("current_appointment_id");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!clientId) {
      return NextResponse.json(
        { error: "Client ID is required" },
        { status: 400 },
      );
    }

    // Get all appointments for this client
    const appointments = await prisma.appointment.findMany({
      where: {
        ClientGroup: {
          ClientGroupMembership: {
            some: {
              client_id: clientId,
            },
          },
        },
      },
      include: {
        service: true,
        clinician: true,
        location: true,
      },
      orderBy: {
        start_date: "desc",
      },
    });

    // If current appointment ID is provided, separate previous and next
    if (currentAppointmentId) {
      const currentAppointment = appointments.find(
        (apt) => apt.id === currentAppointmentId,
      );

      if (!currentAppointment) {
        return NextResponse.json({
          previous: [],
          next: [],
          current: null,
        });
      }

      const currentDate = new Date(currentAppointment.start_date);

      // Get previous appointments (before current date)
      const previous = appointments
        .filter((apt) => new Date(apt.start_date) < currentDate)
        .slice(0, limit);

      // Get next appointments (after current date)
      const next = appointments
        .filter((apt) => new Date(apt.start_date) > currentDate)
        .sort(
          (a, b) =>
            new Date(a.start_date).getTime() - new Date(b.start_date).getTime(),
        )
        .slice(0, limit);

      const response: ClientAppointmentsResponse = {
        previous,
        next,
        current: currentAppointment,
      };

      return NextResponse.json(response);
    }

    // Return all appointments
    return NextResponse.json(appointments);
  },
);
