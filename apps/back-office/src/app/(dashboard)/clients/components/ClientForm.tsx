/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
import { useState, useEffect } from "react";
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
import { EmailEntry, PhoneEntry } from "./CreateClientDrawer";
import { fetchLocations, fetchClinicians } from "../services/client.service";

interface Location {
  id: string;
  name: string;
}

interface Clinician {
  id: string;
  first_name: string;
  last_name: string;
}

interface FormState {
  legalFirstName?: string;
  legalLastName?: string;
  preferredName?: string;
  dob?: string;
  status?: string;
  addToWaitlist?: boolean;
  primaryClinicianId?: string;
  locationId?: string;
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
  is_responsible_for_billing?: boolean;
}

interface ClientFormProps {
  clientType: string;
  // @ts-expect-error - TanStack form types are complex, we'll fix this later
  field: FieldApi<FormState, string>;
  selectedClient: Client | null;
  validationErrors?: Record<string, string[]>;
  clearValidationError?: (fieldName: string) => void;
  tabId?: string;
}

export function ClientForm({
  selectedClient,
  field,
  validationErrors = {},
  clearValidationError,
  clientType,
  tabId = "client-1",
}: ClientFormProps) {
  const state = field.state;
  const value = state.value || ({} as FormState);
  const [locations, setLocations] = useState<Location[]>([]);
  const [clinicians, setClinicians] = useState<Clinician[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [locationsData, cliniciansData] = await Promise.all([
          fetchLocations(),
          fetchClinicians(),
        ]);
        setLocations(locationsData[0] as Location[]);
        setClinicians(cliniciansData[0] as Clinician[]);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const isContactTab = clientType === "minor" && tabId === "client-2";

  // Helper to handle input changes with validation clearing
  const handleInputChange = (fieldName: string, newValue: string) => {
    field.setValue({
      ...value,
      [fieldName]: newValue,
    });

    // Clear validation error when user types valid input
    if (clearValidationError && newValue.trim() !== "") {
      clearValidationError(fieldName);
    }
  };

  // Handle email/phone changes with validation
  const handleEmailChange = (index: number, newValue: string) => {
    const newEmails = [...(value.emails || [])];
    newEmails[index] = { ...newEmails[index], value: newValue };
    field.setValue({ ...value, emails: newEmails });

    // Check if we have at least one valid email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidEmail = newEmails.some(
      (e: EmailEntry) => e.value.trim() !== "" && emailRegex.test(e.value),
    );

    const hasValidPhone = (value.phones || []).some(
      (p: PhoneEntry) => p.value.trim() !== "",
    );

    if (clearValidationError && (hasValidEmail || hasValidPhone)) {
      clearValidationError("emails");
    }
  };

  const handlePhoneChange = (index: number, newValue: string) => {
    const newPhones = [...(value.phones || [])];
    newPhones[index] = { ...newPhones[index], value: newValue };
    field.setValue({ ...value, phones: newPhones });

    // Check if we have at least one valid email or phone
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidEmail = (value.emails || []).some(
      (e: EmailEntry) => e.value.trim() !== "" && emailRegex.test(e.value),
    );

    const hasValidPhone = newPhones.some(
      (p: PhoneEntry) => p.value.trim() !== "",
    );

    if (clearValidationError && (hasValidEmail || hasValidPhone)) {
      clearValidationError("emails");
    }
  };

  return (
    <div className="mt-4 px-6 pb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Legal first name</Label>
          <Input
            className={
              field.state.meta.errors?.legalFirstName ||
              validationErrors.legalFirstName
                ? "border-red-500"
                : ""
            }
            disabled={!!selectedClient}
            placeholder="Almir"
            value={value.legalFirstName || ""}
            onChange={(e) =>
              handleInputChange("legalFirstName", e.target.value)
            }
          />
          {(field.state.meta.errors?.legalFirstName ||
            validationErrors.legalFirstName?.[0]) && (
            <p className="text-sm text-red-500 mt-1">
              {field.state.meta.errors?.legalFirstName ||
                validationErrors.legalFirstName?.[0]}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label>Legal last name</Label>
          <Input
            className={
              field.state.meta.errors?.legalLastName ||
              validationErrors.legalLastName
                ? "border-red-500"
                : ""
            }
            disabled={!!selectedClient}
            placeholder="Kazacic"
            value={value.legalLastName || ""}
            onChange={(e) => handleInputChange("legalLastName", e.target.value)}
          />
          {(field.state.meta.errors?.legalLastName ||
            validationErrors.legalLastName?.[0]) && (
            <p className="text-sm text-red-500 mt-1">
              {field.state.meta.errors?.legalLastName ||
                validationErrors.legalLastName?.[0]}
            </p>
          )}
        </div>
      </div>

      {/* Preferred Name & DOB or Billing Responsibility */}
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

        {isContactTab ? (
          <div className="space-y-2 flex items-center mt-6">
            <div className="flex flex-row items-center space-x-2 h-10">
              <Checkbox
                checked={value.is_responsible_for_billing || false}
                id="responsible-billing"
                onCheckedChange={(checked) => {
                  field.setValue({
                    ...value,
                    is_responsible_for_billing: checked === true,
                  });

                  if (clearValidationError && checked) {
                    clearValidationError("is_responsible_for_billing");
                  }
                }}
              />
              <Label htmlFor="responsible-billing">
                Responsible for billing
              </Label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <Label>Date of Birth</Label>
            <Input
              className={
                field.state.meta.errors?.dob || validationErrors.dob
                  ? "border-red-500"
                  : ""
              }
              placeholder="DD/MM/YYYY"
              value={value.dob || ""}
              onChange={(e) => handleInputChange("dob", e.target.value)}
            />
            {(field.state.meta.errors?.dob || validationErrors.dob?.[0]) && (
              <p className="text-sm text-red-500 mt-1">
                {field.state.meta.errors?.dob || validationErrors.dob?.[0]}
              </p>
            )}
          </div>
        )}
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
          {(field.state.meta.errors?.emails ||
            validationErrors.emails?.[0]) && (
            <p className="text-sm text-red-500 mb-2">
              {field.state.meta.errors?.emails || validationErrors.emails?.[0]}
            </p>
          )}
          {(value.emails || []).map((email: EmailEntry, index: number) => (
            <div
              key={index}
              className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
            >
              <Input
                className={
                  field.state.meta.errors?.emails ? "border-red-500" : ""
                }
                placeholder="Email"
                value={email.value || ""}
                onChange={(e) => handleEmailChange(index, e.target.value)}
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
                { value: "", type: "home", permission: "email-ok" },
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
                className={
                  field.state.meta.errors?.emails ? "border-red-500" : ""
                }
                placeholder="Phone Number"
                value={phone.value || ""}
                onChange={(e) => handlePhoneChange(index, e.target.value)}
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
                { value: "", type: "mobile", permission: "text-voicemail" },
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
              value={value.primaryClinicianId || ""}
              onValueChange={(newValue) =>
                field.setValue({
                  ...value,
                  primaryClinicianId: newValue,
                })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Select clinician"}
                />
              </SelectTrigger>
              <SelectContent>
                {clinicians.map((clinician) => (
                  <SelectItem key={clinician.id} value={clinician.id}>
                    {clinician.first_name} {clinician.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              value={value.locationId || ""}
              onValueChange={(newValue) =>
                field.setValue({
                  ...value,
                  locationId: newValue,
                })
              }
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={isLoading ? "Loading..." : "Select location"}
                />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="space-y-4 mt-4">
        <h3 className="text-lg font-medium">Notification Preferences</h3>

        <div className="space-y-4">
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

        <div className="space-y-4 mt-4">
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
