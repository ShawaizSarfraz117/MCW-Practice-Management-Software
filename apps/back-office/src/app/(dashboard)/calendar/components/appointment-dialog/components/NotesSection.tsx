"use client";

import { useState, useEffect } from "react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

interface NotesSectionProps {
  appointmentData:
    | {
        id?: string;
        start_date?: string;
        client_group_id?: string;
        ClientGroup?: { id: string };
      }
    | undefined;
  onAddNote?: () => void;
}

interface AppointmentInfo {
  id: string;
  start_date: string;
  title: string;
}

export function NotesSection({
  appointmentData,
  onAddNote,
}: NotesSectionProps) {
  const [previousAppointment, setPreviousAppointment] =
    useState<AppointmentInfo | null>(null);
  const [nextAppointment, setNextAppointment] =
    useState<AppointmentInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const {
    data: notesData,
    isLoading: isLoadingNotes,
    error,
  } = useQuery({
    queryKey: ["appointmentNotes", appointmentData?.id],
    queryFn: async () => {
      if (!appointmentData?.id) return null;
      const response = await fetch(
        `/api/appointmentNote?appointment_id=${appointmentData.id}`,
      );
      if (!response.ok) throw new Error("Failed to fetch notes");
      return response.json();
    },
    enabled: !!appointmentData?.id,
  });

  const hasNotes = Array.isArray(notesData) && notesData.length > 0;

  useEffect(() => {
    const fetchAdjacentAppointments = async () => {
      if (!appointmentData?.id || !appointmentData?.start_date) return;

      const clientGroupId =
        appointmentData?.client_group_id || appointmentData?.ClientGroup?.id;
      if (!clientGroupId) return;

      setIsLoading(true);
      try {
        // Fetch all appointments for this client group
        const response = await fetch(
          `/api/appointment?clientGroupId=${clientGroupId}`,
        );
        if (!response.ok) return;

        const appointments = await response.json();

        // Sort appointments by date
        const sortedAppointments = appointments
          .filter((apt: AppointmentInfo) => apt.id !== appointmentData.id) // Exclude current appointment
          .sort(
            (a: AppointmentInfo, b: AppointmentInfo) =>
              new Date(a.start_date).getTime() -
              new Date(b.start_date).getTime(),
          );

        const currentDate = new Date(appointmentData.start_date);

        // Find previous appointment (most recent one before current)
        const previous = sortedAppointments
          .filter(
            (apt: AppointmentInfo) => new Date(apt.start_date) < currentDate,
          )
          .pop(); // Get the last one (most recent)

        // Find next appointment (earliest one after current)
        const next = sortedAppointments.find(
          (apt: AppointmentInfo) => new Date(apt.start_date) > currentDate,
        );

        setPreviousAppointment(previous || null);
        setNextAppointment(next || null);
      } catch (error) {
        console.error("Error fetching adjacent appointments:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdjacentAppointments();
  }, [appointmentData]);

  const formatAppointmentDate = (dateString: string) => {
    try {
      return format(new Date(dateString), "MM/dd/yyyy");
    } catch {
      return "Invalid date";
    }
  };

  const handleViewNotes = () => {
    if (appointmentData?.id) {
      router.push(`/appointmentNote/${appointmentData.id}`);
    }
  };

  return (
    <div className="pb-4 border-b">
      <div className="flex justify-between items-center">
        <p className="text-[13px] space-x-2">
          <span className="text-[#717171] font-[500]">Notes</span>
          {isLoading ? (
            <span className="text-[#717171] text-xs">Loading...</span>
          ) : previousAppointment || nextAppointment ? (
            <>
              {previousAppointment && (
                <span
                  className="text-[#0a96d4]"
                  title={`Previous: ${previousAppointment.title}`}
                >
                  {formatAppointmentDate(previousAppointment.start_date)}
                </span>
              )}
              {previousAppointment && nextAppointment && (
                <span className="text-[#717171]">|</span>
              )}
              {nextAppointment && (
                <span
                  className="text-[#0a96d4]"
                  title={`Next: ${nextAppointment.title}`}
                >
                  {formatAppointmentDate(nextAppointment.start_date)}
                </span>
              )}
            </>
          ) : (
            <span className="text-[#717171] text-xs italic">
              First appointment
            </span>
          )}
        </p>
        <div className="flex items-center gap-3">
          {isLoadingNotes ? (
            <span className="text-[#717171] text-xs">Checking notes...</span>
          ) : error ? (
            <span className="text-red-500 text-xs">Failed to load notes</span>
          ) : hasNotes ? (
            <p
              className="text-[#0a96d4] text-[13px] cursor-pointer hover:underline"
              onClick={handleViewNotes}
            >
              View Note
            </p>
          ) : (
            <p
              className="text-[#0a96d4] text-[13px] cursor-pointer hover:underline"
              onClick={onAddNote}
            >
              Add Note
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
