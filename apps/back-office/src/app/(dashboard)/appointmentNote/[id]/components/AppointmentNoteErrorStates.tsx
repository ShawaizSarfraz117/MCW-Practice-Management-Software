interface ErrorStateProps {
  type: "loading" | "error" | "notFound" | "noClient";
  error?: { message: string };
  appointment?: Record<string, unknown>;
}

export function AppointmentNoteErrorState({
  type,
  error,
  appointment,
}: ErrorStateProps) {
  if (type === "loading") {
    return <div className="p-8 text-center text-gray-500">Loading...</div>;
  }

  if (type === "error") {
    return (
      <div className="p-8 text-center text-red-500">
        Error: {error?.message}
      </div>
    );
  }

  if (type === "notFound") {
    return (
      <div className="p-8 text-center text-red-500">Appointment not found</div>
    );
  }

  if (type === "noClient") {
    return (
      <div className="p-8 text-center">
        <div className="text-red-500 mb-4">
          Client information not found for this appointment
        </div>
        <div className="text-sm text-gray-600">
          Please check the appointment configuration or contact support.
        </div>
        <pre className="mt-4 text-xs text-left bg-gray-100 p-4 rounded overflow-auto">
          {JSON.stringify(appointment, null, 2)}
        </pre>
      </div>
    );
  }

  return null;
}
