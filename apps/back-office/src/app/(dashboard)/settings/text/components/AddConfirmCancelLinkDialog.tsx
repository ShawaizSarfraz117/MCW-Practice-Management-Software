"use client";

import { Button } from "@mcw/ui";
import { X } from "lucide-react";

interface AddConfirmCancelLinkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVariable: (variable: string) => void;
}

const CONFIRM_CANCEL_VARIABLES = [
  { label: "Confirm link", value: "{confirm_link}" },
  { label: "Cancel link", value: "{cancel_link}" },
  { label: "Confirm/Cancel links", value: "{confirm_cancel_links}" },
];

export default function AddConfirmCancelLinkDialog({
  isOpen,
  onClose,
  onAddVariable,
}: AddConfirmCancelLinkDialogProps) {
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
              <h2 className="text-lg font-medium">Add Confirm / Cancel Link</h2>
              <p className="text-sm text-gray-600 mt-1">
                Select link type to add to your message
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
              {CONFIRM_CANCEL_VARIABLES.map((variable) => (
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
