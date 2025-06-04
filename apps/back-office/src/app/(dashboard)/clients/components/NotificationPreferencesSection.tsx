/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { useEffect, useState } from "react";
import {
  Label,
  RadioGroup,
  RadioGroupItem,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { ChevronDown, ChevronUp } from "lucide-react";
import { EmailEntry, PhoneEntry } from "./CreateClientDrawer";

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

interface NotificationPreferencesSectionProps {
  notificationOptions: NotificationOptions;
  onNotificationOptionsChange: (options: NotificationOptions) => void;
  emails: EmailEntry[];
  phones: PhoneEntry[];
}

export function NotificationPreferencesSection({
  notificationOptions = {
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
  },
  onNotificationOptionsChange,
  emails = [],
  phones = [],
}: NotificationPreferencesSectionProps) {
  // Check if there are any email or phone contacts available
  const hasContacts = emails.length > 0 || phones.length > 0;

  // State to track which sections are expanded
  const [expandedSections, setExpandedSections] = useState<{
    upcomingAppointments: boolean;
    incompleteDocuments: boolean;
    cancellations: boolean;
  }>({
    upcomingAppointments: false,
    incompleteDocuments: false,
    cancellations: false,
  });

  // Toggle expanded state for a section
  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Check if selected emails/phones still exist in the arrays
  useEffect(() => {
    let hasUpdates = false;
    const updatedOptions = { ...notificationOptions };

    // Check all notification types
    Object.keys(notificationOptions).forEach((key) => {
      const type = key as keyof NotificationOptions;
      const option = notificationOptions[type];
      const updatedOption = { ...option };
      let madeChanges = false;

      // Check if emailId is valid (starts with 'email-' and index exists)
      if (option.emailId && option.emailId.startsWith("email-")) {
        const index = parseInt(option.emailId.replace("email-", ""), 10);
        if (isNaN(index) || index >= emails.length) {
          updatedOption.emailId = null;
          madeChanges = true;
        }
      }

      // Check if phoneId is valid (starts with 'phone-' and index exists)
      if (option.phoneId && option.phoneId.startsWith("phone-")) {
        const index = parseInt(option.phoneId.replace("phone-", ""), 10);
        if (isNaN(index) || index >= phones.length) {
          updatedOption.phoneId = null;
          madeChanges = true;
        }
      }

      // If either email or phone was changed, check if both are now null
      if (madeChanges) {
        // If both are now null, auto-disable the notification
        if (updatedOption.emailId === null && updatedOption.phoneId === null) {
          updatedOption.enabled = false;
        }

        updatedOptions[type] = updatedOption;
        hasUpdates = true;
      }
    });

    // Update if any changes were made
    if (hasUpdates) {
      onNotificationOptionsChange(updatedOptions);
    }
  }, [emails, phones, notificationOptions, onNotificationOptionsChange]);

  const handleToggleNotification = (
    type: keyof NotificationOptions,
    enabled: boolean,
  ) => {
    // If turning on and there are no selected contacts, auto-select the first available
    let updatedEmailId = notificationOptions[type].emailId;
    let updatedPhoneId = notificationOptions[type].phoneId;

    if (enabled && !updatedEmailId && !updatedPhoneId) {
      // Auto-select first available email
      if (emails.length > 0) {
        updatedEmailId = `email-0`;
      }

      // Auto-select first available phone
      if (phones.length > 0) {
        updatedPhoneId = `phone-0`;
      }
    }

    onNotificationOptionsChange({
      ...notificationOptions,
      [type]: {
        ...notificationOptions[type],
        enabled,
        emailId: enabled ? updatedEmailId : notificationOptions[type].emailId,
        phoneId: enabled ? updatedPhoneId : notificationOptions[type].phoneId,
      },
    });

    // Auto-expand section when enabled
    if (enabled) {
      setExpandedSections((prev) => ({
        ...prev,
        [type]: true,
      }));
    }
  };

  const handleMethodChange = (
    type: keyof NotificationOptions,
    method: "text" | "voice",
  ) => {
    onNotificationOptionsChange({
      ...notificationOptions,
      [type]: {
        ...notificationOptions[type],
        method,
      },
    });
  };

  const handleEmailChange = (
    type: keyof NotificationOptions,
    emailId: string | null,
  ) => {
    const currentPhoneId = notificationOptions[type].phoneId;

    // Auto-turn off the switch if both email and phone are null
    const shouldDisable = emailId === null && currentPhoneId === null;

    onNotificationOptionsChange({
      ...notificationOptions,
      [type]: {
        ...notificationOptions[type],
        emailId,
        // Only update enabled if both are null
        ...(shouldDisable ? { enabled: false } : {}),
      },
    });
  };

  const handlePhoneChange = (
    type: keyof NotificationOptions,
    phoneId: string | null,
  ) => {
    const currentEmailId = notificationOptions[type].emailId;

    // Auto-turn off the switch if both email and phone are null
    const shouldDisable = phoneId === null && currentEmailId === null;

    onNotificationOptionsChange({
      ...notificationOptions,
      [type]: {
        ...notificationOptions[type],
        phoneId,
        // Only update enabled if both are null
        ...(shouldDisable ? { enabled: false } : {}),
      },
    });
  };

  return (
    <div className="space-y-6 mt-6 border-t pt-6">
      <h3 className="text-lg font-medium">Reminder and notification options</h3>

      {/* Upcoming Appointments */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Upcoming appointments</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={notificationOptions.upcomingAppointments.enabled}
              disabled={!hasContacts}
              onCheckedChange={(checked) =>
                handleToggleNotification("upcomingAppointments", checked)
              }
            />
            <button
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
              onClick={() => toggleSection("upcomingAppointments")}
            >
              Manage{" "}
              {expandedSections.upcomingAppointments ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {expandedSections.upcomingAppointments && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Select
                value={
                  notificationOptions.upcomingAppointments.emailId || "no-email"
                }
                onValueChange={(value) =>
                  handleEmailChange(
                    "upcomingAppointments",
                    value === "no-email" ? null : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-email">No email</SelectItem>
                  {emails.map((email, index) => (
                    <SelectItem key={`email-${index}`} value={`email-${index}`}>
                      {email.value || "New email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={
                    notificationOptions.upcomingAppointments.phoneId ||
                    "no-phone"
                  }
                  onValueChange={(value) =>
                    handlePhoneChange(
                      "upcomingAppointments",
                      value === "no-phone" ? null : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-phone">No phone</SelectItem>
                    {phones.map((phone, index) => (
                      <SelectItem
                        key={`phone-${index}`}
                        value={`phone-${index}`}
                      >
                        {phone.value || "New phone"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <RadioGroup
                className="flex gap-2 ml-2"
                disabled={!notificationOptions.upcomingAppointments.phoneId}
                value={notificationOptions.upcomingAppointments.method}
                onValueChange={(value: "text" | "voice") =>
                  handleMethodChange("upcomingAppointments", value)
                }
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem id="upcoming-text" value="text" />
                  <Label className="text-sm" htmlFor="upcoming-text">
                    Text
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem id="upcoming-voice" value="voice" />
                  <Label className="text-sm" htmlFor="upcoming-voice">
                    Voice
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </div>

      {/* Incomplete Documents */}
      <div className="border-b pb-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Incomplete documents</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={notificationOptions.incompleteDocuments.enabled}
              disabled={!hasContacts}
              onCheckedChange={(checked) =>
                handleToggleNotification("incompleteDocuments", checked)
              }
            />
            <button
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
              onClick={() => toggleSection("incompleteDocuments")}
            >
              Manage{" "}
              {expandedSections.incompleteDocuments ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {expandedSections.incompleteDocuments && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Select
                value={
                  notificationOptions.incompleteDocuments.emailId || "no-email"
                }
                onValueChange={(value) =>
                  handleEmailChange(
                    "incompleteDocuments",
                    value === "no-email" ? null : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-email">No email</SelectItem>
                  {emails.map((email, index) => (
                    <SelectItem key={`email-${index}`} value={`email-${index}`}>
                      {email.value || "New email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={
                    notificationOptions.incompleteDocuments.phoneId ||
                    "no-phone"
                  }
                  onValueChange={(value) =>
                    handlePhoneChange(
                      "incompleteDocuments",
                      value === "no-phone" ? null : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-phone">No phone</SelectItem>
                    {phones.map((phone, index) => (
                      <SelectItem
                        key={`phone-${index}`}
                        value={`phone-${index}`}
                      >
                        {phone.value || "New phone"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="text-sm text-gray-500 ml-2">Text only</div>
            </div>
          </div>
        )}
      </div>

      {/* Cancellations */}
      <div className="pb-4">
        <div className="flex items-center justify-between">
          <Label className="text-sm">Cancellations</Label>
          <div className="flex items-center gap-2">
            <Switch
              checked={notificationOptions.cancellations.enabled}
              disabled={!hasContacts}
              onCheckedChange={(checked) =>
                handleToggleNotification("cancellations", checked)
              }
            />
            <button
              className="text-blue-500 hover:text-blue-700 flex items-center text-sm"
              onClick={() => toggleSection("cancellations")}
            >
              Manage{" "}
              {expandedSections.cancellations ? (
                <ChevronUp className="h-4 w-4 ml-1" />
              ) : (
                <ChevronDown className="h-4 w-4 ml-1" />
              )}
            </button>
          </div>
        </div>

        {expandedSections.cancellations && (
          <div className="mt-4 space-y-3">
            <div className="space-y-2">
              <Select
                value={notificationOptions.cancellations.emailId || "no-email"}
                onValueChange={(value) =>
                  handleEmailChange(
                    "cancellations",
                    value === "no-email" ? null : value,
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="No email" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no-email">No email</SelectItem>
                  {emails.map((email, index) => (
                    <SelectItem key={`email-${index}`} value={`email-${index}`}>
                      {email.value || "New email"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex-1">
                <Select
                  value={
                    notificationOptions.cancellations.phoneId || "no-phone"
                  }
                  onValueChange={(value) =>
                    handlePhoneChange(
                      "cancellations",
                      value === "no-phone" ? null : value,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No phone" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="no-phone">No phone</SelectItem>
                    {phones.map((phone, index) => (
                      <SelectItem
                        key={`phone-${index}`}
                        value={`phone-${index}`}
                      >
                        {phone.value || "New phone"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <RadioGroup
                className="flex gap-2 ml-2"
                disabled={!notificationOptions.cancellations.phoneId}
                value={notificationOptions.cancellations.method}
                onValueChange={(value: "text" | "voice") =>
                  handleMethodChange("cancellations", value)
                }
              >
                <div className="flex items-center space-x-1">
                  <RadioGroupItem id="cancellations-text" value="text" />
                  <Label className="text-sm" htmlFor="cancellations-text">
                    Text
                  </Label>
                </div>
                <div className="flex items-center space-x-1">
                  <RadioGroupItem id="cancellations-voice" value="voice" />
                  <Label className="text-sm" htmlFor="cancellations-voice">
                    Voice
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
