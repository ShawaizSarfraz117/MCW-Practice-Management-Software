import { Label, RadioGroup, RadioGroupItem, Switch } from "@mcw/ui";

interface NotificationOptions {
  upcomingAppointments: boolean;
  incompleteDocuments: boolean;
  cancellations: boolean;
}

interface ContactMethod {
  text: boolean;
  voice: boolean;
}

interface NotificationPreferencesSectionProps {
  notificationOptions: NotificationOptions;
  contactMethod: ContactMethod;
  onNotificationOptionsChange: (options: NotificationOptions) => void;
  onContactMethodChange: (method: ContactMethod) => void;
}

export function NotificationPreferencesSection({
  notificationOptions = {
    upcomingAppointments: true,
    incompleteDocuments: false,
    cancellations: false,
  },
  contactMethod = {
    text: true,
    voice: false,
  },
  onNotificationOptionsChange,
  onContactMethodChange,
}: NotificationPreferencesSectionProps) {
  return (
    <div className="space-y-4 mt-4">
      <h3 className="text-lg font-medium">Notification Preferences</h3>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Upcoming Appointments</Label>
          <Switch
            checked={notificationOptions.upcomingAppointments}
            onCheckedChange={(checked) =>
              onNotificationOptionsChange({
                ...notificationOptions,
                upcomingAppointments: checked,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Incomplete Documents</Label>
          <Switch
            checked={notificationOptions.incompleteDocuments}
            onCheckedChange={(checked) =>
              onNotificationOptionsChange({
                ...notificationOptions,
                incompleteDocuments: checked,
              })
            }
          />
        </div>

        <div className="flex items-center justify-between">
          <Label>Cancellations</Label>
          <Switch
            checked={notificationOptions.cancellations}
            onCheckedChange={(checked) =>
              onNotificationOptionsChange({
                ...notificationOptions,
                cancellations: checked,
              })
            }
          />
        </div>
      </div>

      <div className="space-y-4 mt-4">
        <Label>Preferred Contact Method</Label>
        <RadioGroup
          className="flex gap-4"
          value={contactMethod.text ? "text" : "voice"}
          onValueChange={(newValue) =>
            onContactMethodChange({
              text: newValue === "text",
              voice: newValue === "voice",
            })
          }
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="text" value="text" />
            <Label htmlFor="text">Text</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem id="voice" value="voice" />
            <Label htmlFor="voice">Voice</Label>
          </div>
        </RadioGroup>
      </div>
    </div>
  );
}
