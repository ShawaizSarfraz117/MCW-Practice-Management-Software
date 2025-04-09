/* eslint-disable max-lines-per-function */
import { useState, useEffect } from "react";
import { FieldApi } from "@tanstack/react-form";
import {
  Input,
  Label,
  RadioGroup,
  RadioGroupItem,
  Checkbox,
  Select,
} from "@mcw/ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mcw/ui";
import { Client } from "./SelectExistingClient";
import { ContactDetailsSection } from "./ContactDetailsSection";
import { EmailEntry, PhoneEntry } from "./CreateClientDrawer";
import { NotificationPreferencesSection } from "./NotificationPreferencesSection";
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
  // @ts-expect-error TanStack form types are complex and require a separate task to properly type
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

  const isContactTab = tabId === "client-2";
  const shouldShowClinicianAndLocation = clientType === "minor" && isContactTab;

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

      {/* Contact Details Section */}
      <ContactDetailsSection
        clearValidationError={clearValidationError}
        emails={value.emails || []}
        phones={value.phones || []}
        validationErrors={validationErrors}
        onEmailsChange={(newEmails) =>
          field.setValue({ ...value, emails: newEmails })
        }
        onPhonesChange={(newPhones) =>
          field.setValue({ ...value, phones: newPhones })
        }
      />

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
        {shouldShowClinicianAndLocation && (
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
        )}
      </div>

      {/* Notification Preferences Section */}
      <NotificationPreferencesSection
        contactMethod={
          value.contactMethod || {
            text: true,
            voice: false,
          }
        }
        notificationOptions={
          value.notificationOptions || {
            upcomingAppointments: true,
            incompleteDocuments: false,
            cancellations: false,
          }
        }
        onContactMethodChange={(newMethod) =>
          field.setValue({
            ...value,
            contactMethod: newMethod,
          })
        }
        onNotificationOptionsChange={(newOptions) =>
          field.setValue({
            ...value,
            notificationOptions: newOptions,
          })
        }
      />
    </div>
  );
}
