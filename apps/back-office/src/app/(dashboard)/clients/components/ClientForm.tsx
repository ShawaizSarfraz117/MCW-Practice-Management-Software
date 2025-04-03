import { FieldApi } from "@tanstack/react-form";
import { Plus, Minus } from "lucide-react";
import {
  Button,
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  Select,
  Switch,
} from "@mcw/ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mcw/ui";
import { Client } from "./SelectExistingClient";

interface EmailEntry {
  address: string;
  type: string;
  permission: string;
}

interface PhoneEntry {
  number: string;
  type: string;
  permission: string;
}

interface FormState {
  legalFirstName?: string;
  legalLastName?: string;
  preferredName?: string;
  dob?: string;
  status?: string;
  addToWaitlist?: boolean;
  primaryClinician?: string;
  location?: string;
  emails?: EmailEntry[];
  phones?: PhoneEntry[];
  notificationOptions?: {
    upcomingAppointments: boolean;
    incompleteDocuments: boolean;
    cancellations: boolean;
  };
  contactMethod?: {
    text: boolean;
    voice: boolean;
  };
}

interface ClientFormProps {
  clientType: string;
  // @ts-expect-error - TanStack form types are complex, we'll fix this later
  field: FieldApi<FormState, string>;
  selectedClient: Client | null;
}

export function ClientForm({ selectedClient, field }: ClientFormProps) {
  const state = field.state;
  const value = state.value || ({} as FormState);

  return (
    <div className="mt-4 px-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Legal first name</Label>
          <Input
            disabled={!!selectedClient}
            placeholder="Almir"
            value={value.legalFirstName || ""}
            onChange={(e) =>
              field.setValue({
                ...value,
                legalFirstName: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Legal last name</Label>
          <Input
            disabled={!!selectedClient}
            placeholder="Kazacic"
            value={value.legalLastName || ""}
            onChange={(e) =>
              field.setValue({
                ...value,
                legalLastName: e.target.value,
              })
            }
          />
        </div>
      </div>

      {/* Preferred Name & DOB */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div className="space-y-2">
          <Label>Preferred name</Label>
          <Input
            placeholder="Almir"
            value={value.preferredName || ""}
            onChange={(e) =>
              field.setValue({
                ...value,
                preferredName: e.target.value,
              })
            }
          />
        </div>
        <div className="space-y-2">
          <Label>Date of Birth</Label>
          <Input
            placeholder="DD/MM/YYYY"
            value={value.dob || ""}
            onChange={(e) =>
              field.setValue({
                ...value,
                dob: e.target.value,
              })
            }
          />
        </div>
      </div>
      <div className="space-y-4 mt-2">
        {/* Email Section */}
        <div className="flex flex-col gap-1">
          <h3 className="text-lg font-medium">Contact details</h3>
          <p className="text-xs text-gray-500">
            Manage contact info for reminders and notifications. An email is
            needed for granting Client Portal access.
          </p>
        </div>
        <div className="space-y-2">
          {(value.emails || []).map((email: EmailEntry, index: number) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
            >
              <Input
                placeholder="Email"
                value={email.address || ""}
                onChange={(e) => {
                  const newEmails = [...(value.emails || [])];
                  newEmails[index] = { ...email, address: e.target.value };
                  field.setValue({ ...value, emails: newEmails });
                }}
              />
              <Select
                value={email.type || "home"}
                onValueChange={(newValue) => {
                  const newEmails = [...(value.emails || [])];
                  newEmails[index] = { ...email, type: newValue };
                  field.setValue({ ...value, emails: newEmails });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={email.permission || "email-ok"}
                onValueChange={(newValue) => {
                  const newEmails = [...(value.emails || [])];
                  newEmails[index] = { ...email, permission: newValue };
                  field.setValue({ ...value, emails: newEmails });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email-ok">Email OK</SelectItem>
                  <SelectItem value="no-email">No Email</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const newEmails =
                    value.emails?.filter(
                      (_: EmailEntry, i: number) => i !== index,
                    ) || [];
                  field.setValue({ ...value, emails: newEmails });
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            className="text-[#2d8467]"
            variant="ghost"
            onClick={() => {
              const newEmails = [
                ...(value.emails || []),
                { address: "", type: "home", permission: "email-ok" },
              ];
              field.setValue({ ...value, emails: newEmails });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Email
          </Button>
        </div>

        {/* Phone Section */}
        <div className="space-y-2 mt-4">
          {(value.phones || []).map((phone: PhoneEntry, index: number) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
            >
              <Input
                placeholder="Phone Number"
                value={phone.number || ""}
                onChange={(e) => {
                  const newPhones = [...(value.phones || [])];
                  newPhones[index] = { ...phone, number: e.target.value };
                  field.setValue({ ...value, phones: newPhones });
                }}
              />
              <Select
                value={phone.type || "mobile"}
                onValueChange={(newValue) => {
                  const newPhones = [...(value.phones || [])];
                  newPhones[index] = { ...phone, type: newValue };
                  field.setValue({ ...value, phones: newPhones });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="home">Home</SelectItem>
                  <SelectItem value="work">Work</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={phone.permission || "text-voicemail"}
                onValueChange={(newValue) => {
                  const newPhones = [...(value.phones || [])];
                  newPhones[index] = { ...phone, permission: newValue };
                  field.setValue({ ...value, phones: newPhones });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Permission" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="text-voicemail">Text/Voicemail</SelectItem>
                  <SelectItem value="text-only">Text Only</SelectItem>
                  <SelectItem value="voicemail-only">Voicemail Only</SelectItem>
                  <SelectItem value="no-contact">No Contact</SelectItem>
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  const newPhones =
                    value.phones?.filter(
                      (_: PhoneEntry, i: number) => i !== index,
                    ) || [];
                  field.setValue({ ...value, phones: newPhones });
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
          <Button
            className="text-[#2d8467]"
            variant="ghost"
            onClick={() => {
              const newPhones = [
                ...(value.phones || []),
                { number: "", type: "mobile", permission: "text-voicemail" },
              ];
              field.setValue({ ...value, phones: newPhones });
            }}
          >
            <Plus className="h-4 w-4 mr-1" /> Add Phone
          </Button>
        </div>
      </div>

      {/* Common Fields */}
      <div className="space-y-4 mt-4">
        {/* Status and Waitlist */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Status</Label>
            <RadioGroup
              className="flex gap-4"
              value={value.status || "active"}
              onValueChange={(newValue) =>
                field.setValue({
                  ...value,
                  status: newValue,
                })
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="active" value="active" />
                <Label htmlFor="active">Active</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem id="prospective" value="prospective" />
                <Label htmlFor="prospective">Prospective</Label>
              </div>
            </RadioGroup>
          </div>
          <div className="space-y-2">
            <Label>Waitlist</Label>
            <div className="flex items-center space-x-2">
              <Checkbox
                checked={value.addToWaitlist || false}
                onCheckedChange={(checked) =>
                  field.setValue({
                    ...value,
                    addToWaitlist: checked === true,
                  })
                }
              />
              <Label>Add to waitlist</Label>
            </div>
          </div>
        </div>

        {/* Clinician and Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="space-y-2">
            <Label>Primary Clinician</Label>
            <Select
              value={value.primaryClinician || "travis"}
              onValueChange={(newValue) =>
                field.setValue({
                  ...value,
                  primaryClinician: newValue,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select clinician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="travis">Travis McNulty</SelectItem>
                <SelectItem value="alam">Alam Naqvi</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={value.location || "stpete"}
              onValueChange={(newValue) =>
                field.setValue({
                  ...value,
                  location: newValue,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="stpete">
                  Saint Petersburg McNulty Counseling
                </SelectItem>
                <SelectItem value="tampa">Tampa McNulty Counseling</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Notification Preferences</h3>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Upcoming Appointments</Label>
            <Switch
              checked={value.notificationOptions?.upcomingAppointments ?? true}
              onCheckedChange={(checked) =>
                field.setValue({
                  ...value,
                  notificationOptions: {
                    ...value.notificationOptions,
                    upcomingAppointments: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Incomplete Documents</Label>
            <Switch
              checked={value.notificationOptions?.incompleteDocuments ?? false}
              onCheckedChange={(checked) =>
                field.setValue({
                  ...value,
                  notificationOptions: {
                    ...value.notificationOptions,
                    incompleteDocuments: checked,
                  },
                })
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Cancellations</Label>
            <Switch
              checked={value.notificationOptions?.cancellations ?? false}
              onCheckedChange={(checked) =>
                field.setValue({
                  ...value,
                  notificationOptions: {
                    ...value.notificationOptions,
                    cancellations: checked,
                  },
                })
              }
            />
          </div>
        </div>

        <div className="space-y-2 mt-4">
          <Label>Preferred Contact Method</Label>
          <RadioGroup
            className="flex gap-4"
            value={value.contactMethod?.text ? "text" : "voice"}
            onValueChange={(newValue) =>
              field.setValue({
                ...value,
                contactMethod: {
                  text: newValue === "text",
                  voice: newValue === "voice",
                },
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
    </div>
  );
}
