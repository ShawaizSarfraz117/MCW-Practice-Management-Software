/* eslint-disable max-lines-per-function */
"use client";
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, Button } from "@mcw/ui";
import { X } from "lucide-react";
import { ClientFormValues } from "../types";
import { EditClientForm } from "./EditClientForm";
import { ClientMembership } from "./ClientEdit";
import { EditNotificationPreferences } from "./EditNotificationPreferences";
import { ClientPortalPermissions } from "./ClientPortalPermissions";
import {
  fetchClientContacts,
  updateClientReminderPref,
} from "@/(dashboard)/clients/services/client.service";
import { ClientContact } from "@prisma/client";

// API response type interfaces
interface ApiResponse {
  data?: ClientContact[];
  [key: string]: unknown;
}

// Basic notification types
interface NotificationDetail {
  enabled: boolean;
  emailId: string | null;
  phoneId: string | null;
  method: "text" | "voice";
}

interface NotificationOptions {
  upcomingAppointments: NotificationDetail;
  incompleteDocuments: NotificationDetail;
  cancellations: NotificationDetail;
}

// Payload type for saving notification preferences
interface NotificationPreferencePayload {
  contact_id: string;
  reminder_type: string;
  channel: string;
  is_enabled: boolean;
  client_id: string;
}

interface ClientReminderPreference {
  id: string;
  client_id: string;
  contact_id: string;
  reminder_type: string;
  channel: string;
  is_enabled: boolean;
}

interface ExtendedClientContact extends ClientContact {
  ClientReminderPreference?: ClientReminderPreference[];
}

interface EditClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientData: ClientMembership;
  onSave: (data: ClientFormValues) => Promise<void>;
  title?: string;
  drawerType: "edit" | "reminders" | "clientPortal";
  type?: "client" | "contact";
  onSwitchToEdit?: () => void;
}

export function EditClientDrawer({
  isOpen,
  onClose,
  drawerType,
  type,
  clientData,
  onSave,
  title = "Create New Contact",
  onSwitchToEdit,
}: EditClientDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientContacts, setClientContacts] = useState<ClientContact[]>([]);
  const [isPortalFormLoading, setIsPortalFormLoading] = useState(false);

  // Add notification options state
  const [notificationOptions, setNotificationOptions] =
    useState<NotificationOptions>({
      upcomingAppointments: {
        enabled: false,
        emailId: null,
        phoneId: null,
        method: "text",
      },
      incompleteDocuments: {
        enabled: false,
        emailId: null,
        phoneId: null,
        method: "text",
      },
      cancellations: {
        enabled: false,
        emailId: null,
        phoneId: null,
        method: "text",
      },
    });

  const handleSave = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    await onSave(data);
    onClose();
    setIsSubmitting(false);
  };

  // Create the payload for saving notification preferences
  const saveNotificationPreferences = async () => {
    setIsSubmitting(true);

    try {
      // Create the payload array
      const payload: NotificationPreferencePayload[] = [];

      // Process upcomingAppointments
      // Include selected contacts regardless of enabled state
      // Add email notification if selected
      if (notificationOptions.upcomingAppointments.emailId) {
        payload.push({
          contact_id: notificationOptions.upcomingAppointments.emailId,
          reminder_type: "UPCOMING_APPOINTMENTS",
          channel: "email",
          is_enabled: notificationOptions.upcomingAppointments.enabled,
          client_id: clientData.client_id,
        });
      }

      // Add phone notification if selected
      if (notificationOptions.upcomingAppointments.phoneId) {
        payload.push({
          contact_id: notificationOptions.upcomingAppointments.phoneId,
          reminder_type: "UPCOMING_APPOINTMENTS",
          channel: notificationOptions.upcomingAppointments.method,
          is_enabled: notificationOptions.upcomingAppointments.enabled,
          client_id: clientData?.client_id,
        });
      }

      // Process incompleteDocuments
      // Add email notification if selected
      if (notificationOptions.incompleteDocuments.emailId) {
        payload.push({
          contact_id: notificationOptions.incompleteDocuments.emailId,
          reminder_type: "INCOMPLETE_DOCUMENTS",
          channel: "email",
          is_enabled: notificationOptions.incompleteDocuments.enabled,
          client_id: clientData?.client_id,
        });
      }

      // Add phone notification if selected
      if (notificationOptions.incompleteDocuments.phoneId) {
        payload.push({
          contact_id: notificationOptions.incompleteDocuments.phoneId,
          reminder_type: "INCOMPLETE_DOCUMENTS",
          channel: notificationOptions.incompleteDocuments.method,
          is_enabled: notificationOptions.incompleteDocuments.enabled,
          client_id: clientData?.client_id,
        });
      }

      // Process cancellations
      // Add email notification if selected
      if (notificationOptions.cancellations.emailId) {
        payload.push({
          contact_id: notificationOptions.cancellations.emailId,
          reminder_type: "CANCELLATIONS",
          channel: "email",
          is_enabled: notificationOptions.cancellations.enabled,
          client_id: clientData?.client_id,
        });
      }

      // Add phone notification if selected
      if (notificationOptions.cancellations.phoneId) {
        payload.push({
          contact_id: notificationOptions.cancellations.phoneId,
          reminder_type: "CANCELLATIONS",
          channel: notificationOptions.cancellations.method,
          is_enabled: notificationOptions.cancellations.enabled,
          client_id: clientData?.client_id,
        });
      }

      await updateClientReminderPref({ body: payload });
      // Show success message

      onClose();
    } catch (error) {
      console.error("Error saving notification preferences:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add notification options change handler
  const handleNotificationOptionsChange = (options: NotificationOptions) => {
    setNotificationOptions(options);
  };

  // Prevent drawer from auto-closing on click events within form
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  useEffect(() => {
    const fetchContacts = async () => {
      const response = await fetchClientContacts({
        searchParams: { clientId: clientData?.client_id },
      });

      if (response && Array.isArray(response) && response.length > 0) {
        const contacts = response[0] as ApiResponse;
        const contactsData = Array.isArray(contacts.data) ? contacts.data : [];

        setClientContacts(contactsData);

        // Initialize notification options based on existing client reminder preferences
        const options: NotificationOptions = {
          upcomingAppointments: {
            enabled: false,
            emailId: null,
            phoneId: null,
            method: "text",
          },
          incompleteDocuments: {
            enabled: false,
            emailId: null,
            phoneId: null,
            method: "text",
          },
          cancellations: {
            enabled: false,
            emailId: null,
            phoneId: null,
            method: "text",
          },
        };

        // Process contacts to find and set existing reminder preferences
        contactsData.forEach((contact: ExtendedClientContact) => {
          if (
            contact.ClientReminderPreference &&
            contact.ClientReminderPreference.length > 0
          ) {
            contact.ClientReminderPreference.forEach(
              (pref: ClientReminderPreference) => {
                const reminderType = pref.reminder_type;
                const channel = pref.channel;
                const isEnabled = pref.is_enabled;

                if (reminderType === "UPCOMING_APPOINTMENTS") {
                  // Set enabled state based on API response
                  if (isEnabled) {
                    options.upcomingAppointments.enabled = true;
                  }

                  if (contact.contact_type === "EMAIL" && channel === "email") {
                    options.upcomingAppointments.emailId = contact.id;
                  } else if (contact.contact_type === "PHONE") {
                    options.upcomingAppointments.phoneId = contact.id;
                    options.upcomingAppointments.method = channel as
                      | "text"
                      | "voice";
                  }
                } else if (reminderType === "INCOMPLETE_DOCUMENTS") {
                  // Set enabled state based on API response
                  if (isEnabled) {
                    options.incompleteDocuments.enabled = true;
                  }

                  if (contact.contact_type === "EMAIL" && channel === "email") {
                    options.incompleteDocuments.emailId = contact.id;
                  } else if (contact.contact_type === "PHONE") {
                    options.incompleteDocuments.phoneId = contact.id;
                    options.incompleteDocuments.method = channel as
                      | "text"
                      | "voice";
                  }
                } else if (reminderType === "CANCELLATIONS") {
                  // Set enabled state based on API response
                  if (isEnabled) {
                    options.cancellations.enabled = true;
                  }

                  if (contact.contact_type === "EMAIL" && channel === "email") {
                    options.cancellations.emailId = contact.id;
                  } else if (contact.contact_type === "PHONE") {
                    options.cancellations.phoneId = contact.id;
                    options.cancellations.method = channel as "text" | "voice";
                  }
                }
              },
            );
          }
        });

        setNotificationOptions(options);
      }
    };

    if (isOpen && drawerType === "reminders") {
      fetchContacts();
    }
  }, [isOpen, clientData, drawerType]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Button
                className="mr-2"
                size="icon"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <SheetTitle>{title}</SheetTitle>
            </div>
            <Button
              className="bg-[#2c8466] hover:bg-[#206e52]"
              disabled={
                isSubmitting ||
                (drawerType === "clientPortal" && isPortalFormLoading)
              }
              form={drawerType === "edit" ? "client-edit-form" : undefined}
              size="sm"
              type={drawerType === "edit" ? "submit" : "button"}
              onClick={
                drawerType === "reminders"
                  ? saveNotificationPreferences
                  : drawerType === "clientPortal"
                    ? () => {
                        const saveButton =
                          document.getElementById("client-portal-save");
                        if (saveButton) saveButton.click();
                      }
                    : undefined
              }
            >
              Save
            </Button>
          </SheetHeader>
          {drawerType === "edit" && isOpen && (
            <div className="overflow-y-auto flex-1 h-full">
              <EditClientForm
                clientData={clientData}
                type={type}
                onSave={handleSave}
              />
            </div>
          )}
          {drawerType === "reminders" && isOpen && (
            <div className="overflow-y-auto flex-1 h-full">
              <EditNotificationPreferences
                emails={clientContacts.filter(
                  (contact) => contact.contact_type === "EMAIL",
                )}
                notificationOptions={notificationOptions}
                phones={clientContacts.filter(
                  (contact) => contact.contact_type === "PHONE",
                )}
                onNotificationOptionsChange={handleNotificationOptionsChange}
              />
            </div>
          )}
          {drawerType === "clientPortal" && isOpen && (
            <div className="overflow-y-auto flex-1 h-full">
              <ClientPortalPermissions
                clientData={clientData}
                onSave={() => onClose()}
                onClose={onClose}
                onOpenEditDrawer={() => {
                  if (onSwitchToEdit) {
                    onSwitchToEdit();
                  }
                }}
                onLoadingChange={setIsPortalFormLoading}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
