"use client";

import { Button } from "@mcw/ui";
import { X } from "lucide-react";

interface AddInformationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: string) => void;
}

const INFORMATION_VARIABLES = [
  { label: "Appointment date", value: "{appointment_date}" },
  { label: "Appointment time", value: "{appointment_time}" },
  { label: "Client first name", value: "{client_first_name}" },
  { label: "Client full name", value: "{client_full_name}" },
  {
    label: "Client first name formatted",
    value: "{client_first_name_formatted}",
  },
  {
    label: "Client full name formatted",
    value: "{client_full_name_formatted}",
  },
  { label: "Clinician full name", value: "{clinician_full_name}" },
  { label: "Location", value: "{location}" },
  { label: "Practice name", value: "{practice_name}" },
  { label: "Practice phone", value: "{practice_phone}" },
];

export default function AddInformationDialog({
  isOpen,
  onClose,
  onAddVariable,
}: AddInformationDialogProps) {
  const handleAddVariable = (variable: string) => {
    onAddVariable(variable);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black bg-opacity-30 z-40"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white shadow-lg z-50 rounded-lg">
        <div className="flex flex-col max-h-[80vh]">
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div>
              <h2 className="text-lg font-medium">Add Information</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select information to add to your message
              </p>
            </div>
            <Button
              className="rounded-full"
              size="icon"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Close</span>
            </Button>
          </div>

          {/* Dialog Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {INFORMATION_VARIABLES.map((variable) => (
                <Button
                  key={variable.value}
                  className="w-full justify-start text-left h-auto py-3 px-3 hover:bg-gray-50"
                  variant="ghost"
                  onClick={() => handleAddVariable(variable.value)}
                >
                  <span className="text-sm text-gray-700">
                    {variable.label}
                  </span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
