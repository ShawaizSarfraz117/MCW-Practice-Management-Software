import { useState } from "react";

interface UseAppointmentDeleteProps {
  appointmentId?: string;
  onDone?: () => void;
  setGeneralError?: (error: string) => void;
}

export function useAppointmentDelete({
  appointmentId,
  onDone,
  setGeneralError,
}: UseAppointmentDeleteProps) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedDeleteOption, setSelectedDeleteOption] = useState<
    "single" | "future" | "all"
  >("single");

  const handleDeleteConfirm = async () => {
    try {
      if (!appointmentId) {
        throw new Error("Appointment ID is required");
      }

      const response = await fetch(
        `/api/appointment?id=${appointmentId}&deleteOption=${selectedDeleteOption}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete appointment");
      }

      // Dispatch custom event to notify calendar about the deletion
      window.dispatchEvent(
        new CustomEvent("appointmentDeleted", {
          detail: {
            appointmentId,
            deleteOption: selectedDeleteOption,
          },
        }),
      );

      setIsDeleteModalOpen(false);
      if (onDone) {
        onDone();
      }
    } catch (error) {
      console.error("Error deleting appointment:", error);
      if (setGeneralError) {
        setGeneralError(
          error instanceof Error
            ? error.message
            : "Failed to delete appointment. Please try again.",
        );
      }
      setIsDeleteModalOpen(false);
    }
  };

  return {
    isDeleteModalOpen,
    selectedDeleteOption,
    setIsDeleteModalOpen,
    setSelectedDeleteOption,
    handleDeleteConfirm,
  };
}
