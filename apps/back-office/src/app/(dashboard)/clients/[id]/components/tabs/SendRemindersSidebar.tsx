"use client";

import { Button } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import { X, Bell } from "lucide-react";
import { useState } from "react";
import { emailHelpers } from "@/utils/emailService";
import { toast } from "@mcw/ui";

interface FileData {
  id: number;
  name: string;
  type: string;
  status: string;
  statusColor: string;
  updated: string;
  nameColor: string;
}

interface SendRemindersSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  filesData: FileData[];
  clientName: string;
  clientEmail: string;
  practiceName: string;
}

interface AutomatedRemindersSectionProps {
  clientName: string;
}

function AutomatedRemindersSection({
  clientName,
}: AutomatedRemindersSectionProps) {
  return (
    <div className="bg-gray-50 px-6 py-5 border-b">
      <div className="flex items-start gap-3">
        <Bell className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className="font-medium text-gray-900">
              Automated reminders:
            </span>
            <span className="text-green-600 font-medium">On</span>
          </div>
          <p className="text-sm text-gray-600 mb-3 leading-relaxed">
            Send incomplete document reminders before {clientName}&apos;s
            appointments.
          </p>
          <Button
            className="p-0 h-auto text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            variant="link"
            onClick={() => console.log("Edit automated reminders")}
          >
            Edit <span>→</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

interface PendingFilesListProps {
  pendingFiles: FileData[];
}

function PendingFilesList({ pendingFiles }: PendingFilesListProps) {
  return (
    <div className="ml-6 space-y-3">
      {pendingFiles.map((file) => (
        <div key={file.id} className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 mb-1">{file.name}</div>
            <div className="text-sm text-gray-500">
              Shared on {file.updated}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SendRemindersSidebar({
  isOpen,
  onClose,
  filesData,
  clientName,
  clientEmail,
  practiceName,
}: SendRemindersSidebarProps) {
  const [selectedReminders, setSelectedReminders] = useState<number[]>([]);
  const [isSending, setIsSending] = useState(false);

  const pendingFiles = filesData.filter((file) =>
    file.status.toLowerCase().includes("pending"),
  );

  const handleSelectAll = (checked: boolean) => {
    setSelectedReminders(checked ? pendingFiles.map((f) => f.id) : []);
  };

  const handleSendReminders = async () => {
    if (selectedReminders.length === 0) return;

    setIsSending(true);
    try {
      const selectedFiles = pendingFiles.filter((file) =>
        selectedReminders.includes(file.id),
      );

      // Use the helper function for document reminders
      await emailHelpers.sendDocumentReminder(
        {
          clientEmail,
          clientName,
          documents: selectedFiles.map((file) => file.name),
          clinicianName: practiceName,
          portalLink: window.location.origin + "/login",
          // appointmentDate and appointmentTime will use defaults if not provided
        },
        toast,
      );

      onClose();
      setSelectedReminders([]);
    } catch (error) {
      console.error("Failed to send reminder email:", error);
    } finally {
      setIsSending(false);
    }
  };

  const isAllSelected =
    selectedReminders.length > 0 &&
    selectedReminders.length === pendingFiles.length;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 right-0 w-[400px] bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">
              Send reminders
            </h2>
            <Button
              className="p-1 hover:bg-gray-100 rounded-md"
              size="sm"
              variant="ghost"
              onClick={onClose}
            >
              <X className="h-5 w-5 text-gray-500" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AutomatedRemindersSection clientName={clientName} />

            <div className="px-6 py-6">
              <h3 className="font-medium text-gray-900 mb-1">
                Ad hoc reminders
              </h3>
              <p className="text-sm text-gray-500 mb-6">Sent immediately</p>

              {/* No reminders selected alert */}
              {selectedReminders.length === 0 && (
                <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-bold">!</span>
                    </div>
                    <span className="text-red-700 font-medium">
                      No reminders selected
                    </span>
                  </div>
                </div>
              )}

              {/* Client reminder section */}
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={isAllSelected}
                    className="mt-1"
                    id="client-reminder"
                    onCheckedChange={handleSelectAll}
                  />
                  <div className="flex-1 min-w-0">
                    <label
                      className="font-medium text-gray-900 cursor-pointer block mb-1"
                      htmlFor="client-reminder"
                    >
                      Send reminder to {clientName}{" "}
                      <span className="text-gray-500 font-normal">
                        (client)
                      </span>
                    </label>
                    <p className="text-sm text-gray-500 mb-4">Send by email</p>
                  </div>
                </div>

                {pendingFiles.length > 0 && (
                  <PendingFilesList pendingFiles={pendingFiles} />
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4 bg-white">
            <div className="flex gap-3">
              <Button
                className="flex-1 text-sm border-gray-300"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-sm text-white"
                disabled={selectedReminders.length === 0 || isSending}
                onClick={handleSendReminders}
              >
                {isSending ? "Sending..." : "Send ad hoc reminders"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
