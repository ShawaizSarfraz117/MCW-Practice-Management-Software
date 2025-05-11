/* eslint-disable max-lines */
/* eslint-disable max-lines-per-function */
"use client";

import { useState } from "react";
import { Input, Label, Select, Checkbox, Textarea } from "@mcw/ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mcw/ui";
import { Plus, Trash2, HelpCircle } from "lucide-react";
import {
  ClientFormValues,
  defaultFormValues,
  EmailEntry,
  PhoneEntry,
  AddressEntry,
} from "../types";
import statesUS from "@/(dashboard)/clients/services/statesUS.json";
import { ClientMembership } from "./ClientEdit";

interface EditClientFormProps {
  clientData?: ClientMembership | null;
  onSave: (values: ClientFormValues) => Promise<void>;
  className?: string;
}

export function EditClientForm({
  clientData,
  onSave,
  className,
}: EditClientFormProps) {
  // Map client data to initial values or use defaults if clientData is null
  const mapClientDataToInitialValues = (): Partial<ClientFormValues> => {
    if (!clientData) {
      return defaultFormValues;
    }

    return {
      legal_first_name: clientData.Client.legal_first_name,
      legal_last_name: clientData.Client.legal_last_name,
      middle_name: clientData.Client.ClientProfile?.middle_name || "",
      suffix: clientData.Client.suffix || "",
      preferred_name: clientData.Client.preferred_name || "",
      relationship_type: "Family Member",
      emails: clientData.Client.ClientContact.filter(
        (contact) => contact.contact_type === "EMAIL",
      ).map((contact) => ({
        id: contact.id,
        value: contact.value,
        type: contact.type || "Work",
        permission: contact.permission || "email-ok",
      })),
      phones: clientData.Client.ClientContact.filter(
        (contact) => contact.contact_type === "PHONE",
      ).map((contact) => ({
        id: contact.id,
        value: contact.value,
        type: contact.type || "Mobile",
        permission: contact.permission || "text-voicemail",
      })),
      addresses: clientData.Client.ClientAdress
        ? clientData.Client.ClientAdress.map((address) => ({
            id: address.id,
            street: address.address_line1,
            city: address.city,
            state: address.state,
            zip: address.zip_code,
          }))
        : [],
      date_of_birth: clientData.Client.date_of_birth
        ? new Date(clientData.Client.date_of_birth).toISOString().split("T")[0]
        : "",
      sex: clientData.Client.ClientProfile?.gender || "Prefer not to say",
      gender_identity: clientData.Client.ClientProfile?.gender_identity || "",
      relationship_status:
        clientData.Client.ClientProfile?.relationship_status || "No answer",
      employment_status:
        clientData.Client.ClientProfile?.employment_status || "No answer",
      race_ethnicity: clientData.Client.ClientProfile?.race_ethnicity
        ? JSON.parse(clientData.Client.ClientProfile.race_ethnicity)
        : [],
      race_ethnicity_details:
        clientData.Client.ClientProfile?.race_ethnicity_details || "",
      preferred_language:
        clientData.Client.ClientProfile?.preferred_language || "No answer",
      notes: clientData.Client.ClientProfile?.notes || "",
    };
  };

  // Initialize form data with client data or defaults
  const [formData, setFormData] = useState<ClientFormValues>({
    ...defaultFormValues,
    ...mapClientDataToInitialValues(),
    // Always ensure arrays exist
    emails: mapClientDataToInitialValues().emails || [],
    phones: mapClientDataToInitialValues().phones || [],
    addresses: mapClientDataToInitialValues().addresses || [],
    race_ethnicity: mapClientDataToInitialValues().race_ethnicity || [],
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.legal_first_name) {
      newErrors.legal_first_name = "First name is required";
    }

    if (!formData.legal_last_name) {
      newErrors.legal_last_name = "Last name is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }
    try {
      await onSave(formData);
    } catch (error) {
      console.error("Error saving client:", error);
    }
  };

  // Handle input changes
  const handleChange = (
    field: keyof ClientFormValues,
    value:
      | string
      | boolean
      | EmailEntry[]
      | PhoneEntry[]
      | AddressEntry[]
      | string[]
      | undefined,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error when field is filled
    if (errors[field] && value) {
      const newErrors = { ...errors };
      delete newErrors[field];
      setErrors(newErrors);
    }
  };

  // Handle email changes
  const handleEmailChange = (
    index: number,
    field: keyof EmailEntry,
    value: string,
  ) => {
    // Ensure emails is an array
    const emails = formData.emails || [];
    const newEmails = [...emails];
    newEmails[index] = {
      ...newEmails[index],
      [field]: value,
    };
    handleChange("emails", newEmails);
  };

  // Handle phone changes
  const handlePhoneChange = (
    index: number,
    field: keyof PhoneEntry,
    value: string,
  ) => {
    // Ensure phones is an array
    const phones = formData.phones || [];
    const newPhones = [...phones];
    newPhones[index] = {
      ...newPhones[index],
      [field]: value,
    };
    handleChange("phones", newPhones);
  };

  // Handle address field changes for a specific address at an index
  const handleAddressFieldChange = (
    addressIndex: number,
    field: keyof AddressEntry,
    value: string,
  ) => {
    // Initialize addresses if undefined
    const currentAddresses = formData.addresses || [];
    const newAddresses = [...currentAddresses];

    if (!newAddresses[addressIndex]) {
      newAddresses[addressIndex] = { [field]: value };
    } else {
      newAddresses[addressIndex] = {
        ...newAddresses[addressIndex],
        [field]: value,
      };
    }

    handleChange("addresses", newAddresses);
  };

  // Add a new address
  const addAddress = () => {
    const currentAddresses = formData.addresses || [];
    const newAddresses = [
      ...currentAddresses,
      { street: "", city: "", state: "", zip: "" },
    ];
    handleChange("addresses", newAddresses);
  };

  // Remove an address
  const removeAddress = (indexToRemove: number) => {
    const currentAddresses = formData.addresses || [];
    const newAddresses = currentAddresses.filter(
      (_, index) => index !== indexToRemove,
    );
    handleChange("addresses", newAddresses);
  };

  // Handle race/ethnicity changes
  const handleRaceEthnicityChange = (value: string, checked: boolean) => {
    const currentValues = [...(formData.race_ethnicity || [])];

    if (checked) {
      // Add the value if it's not already in the array
      if (!currentValues.includes(value)) {
        handleChange("race_ethnicity", [...currentValues, value]);
      }
    } else {
      // Remove the value
      handleChange(
        "race_ethnicity",
        currentValues.filter((item) => item !== value),
      );
    }
  };

  // Check if a race/ethnicity option is selected
  const isRaceEthnicitySelected = (value: string) => {
    return formData.race_ethnicity?.includes(value) || false;
  };

  return (
    <form
      className={`h-full max-w-3xl w-full ${className ?? ""}`}
      id="client-edit-form"
      onSubmit={handleSubmit}
    >
      <div className="px-4 py-4 space-y-5">
        {/* Name Section */}
        <div>
          <h3 className="text-sm font-medium mb-2">Name</h3>
          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Legal first name */}
            <div className="space-y-1">
              <Label
                className="text-xs text-gray-600"
                htmlFor="legal_first_name"
              >
                *Legal first name
              </Label>
              <Input
                className={errors.legal_first_name ? "border-red-500" : ""}
                id="legal_first_name"
                value={formData.legal_first_name}
                onChange={(e) =>
                  handleChange("legal_first_name", e.target.value)
                }
              />
              {errors.legal_first_name && (
                <p className="text-xs text-red-500">
                  {errors.legal_first_name}
                </p>
              )}
            </div>

            {/* Middle name */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600" htmlFor="middle_name">
                Middle name
              </Label>
              <Input
                id="middle_name"
                value={formData.middle_name || ""}
                onChange={(e) => handleChange("middle_name", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Legal last name */}
            <div className="space-y-1">
              <Label
                className="text-xs text-gray-600"
                htmlFor="legal_last_name"
              >
                *Legal last name
              </Label>
              <Input
                className={errors.legal_last_name ? "border-red-500" : ""}
                id="legal_last_name"
                value={formData.legal_last_name}
                onChange={(e) =>
                  handleChange("legal_last_name", e.target.value)
                }
              />
              {errors.legal_last_name && (
                <p className="text-xs text-red-500">{errors.legal_last_name}</p>
              )}
            </div>

            {/* Suffix */}
            <div className="space-y-1">
              <Label className="text-xs text-gray-600" htmlFor="suffix">
                Suffix
              </Label>
              <Input
                id="suffix"
                value={formData.suffix || ""}
                onChange={(e) => handleChange("suffix", e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Preferred Name */}
        <div className="space-y-1">
          <Label className="text-sm font-medium" htmlFor="preferred_name">
            What name do they go by?
          </Label>
          <div className="text-xs text-gray-500 mb-2">
            Used in place of first name across SimplePractice, as well as in
            client communication (reminders, billing documents, etc.)
          </div>
          <Input
            id="preferred_name"
            value={formData.preferred_name || ""}
            onChange={(e) => handleChange("preferred_name", e.target.value)}
          />
        </div>

        {/* Relationship Type and Emergency Contact */}
        {/* <div className="grid grid-cols-1 space-y-4">
          <div className="space-y-1">
            <Label 
              className="text-sm font-medium" 
              htmlFor="relationship_type"
            >
              *Relationship type
            </Label>
            <Select
              value={formData.relationship_type}
              onValueChange={(value) => handleChange('relationship_type', value)}
            >
              <SelectTrigger id="relationship_type">
                <SelectValue placeholder="Select relationship type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Family Member">Family Member</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Partner">Partner</SelectItem>
                <SelectItem value="Parent">Parent</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Friend">Friend</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              checked={formData.is_emergency_contact || false}
              id="is_emergency_contact"
              onCheckedChange={(checked) => 
                handleChange('is_emergency_contact', checked === true)
              }
            />
            <Label 
              className="text-sm font-medium"
              htmlFor="is_emergency_contact"
            >
              Emergency Contact
            </Label>
          </div>
        </div> */}

        {/* Contact Details */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Contact details</h3>
          <p className="text-xs text-gray-500">
            Manage contact info for reminders and notifications. An email is
            needed for granting Client Portal access.
          </p>

          {/* Email Section */}
          <div className="space-y-2">
            <div className="space-y-3">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 pb-1 border-b">
                <div className="font-medium text-sm">Email</div>
                <div className="font-medium text-sm">Type</div>
                <div className="font-medium text-sm">Permission</div>
                <div />
              </div>
              {Array.isArray(formData.emails) &&
                formData.emails.map((email, index) => (
                  <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Email address"
                        value={email.value}
                        onChange={(e) =>
                          handleEmailChange(index, "value", e.target.value)
                        }
                      />
                      <Select
                        value={email.type}
                        onValueChange={(value) =>
                          handleEmailChange(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Work">Work</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={email.permission}
                        onValueChange={(value) =>
                          handleEmailChange(index, "permission", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Permission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="email-ok">Email OK</SelectItem>
                          <SelectItem value="no-email">No Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      className="flex items-center text-gray-500 hover:text-red-500"
                      type="button"
                      onClick={() => {
                        const emails = formData.emails || [];
                        const newEmails = emails.filter((_, i) => i !== index);
                        handleChange("emails", newEmails);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              <button
                className="flex items-center text-[#2c8466] text-sm font-medium"
                type="button"
                onClick={() => {
                  const currentEmails = formData.emails || [];
                  handleChange("emails", [
                    ...currentEmails,
                    { value: "", type: "Work", permission: "email-ok" },
                  ]);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add email
              </button>
            </div>
          </div>

          {/* Phone Section */}
          <div className="space-y-2">
            <div className="space-y-3 mt-6">
              <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 pb-1 border-b">
                <div className="font-medium text-sm">Phone</div>
                <div className="font-medium text-sm">Type</div>
                <div className="font-medium text-sm">Permission</div>
                <div />
              </div>
              {Array.isArray(formData.phones) &&
                formData.phones.map((phone, index) => (
                  <div key={index} className="grid grid-cols-[1fr_auto] gap-2">
                    <div className="grid grid-cols-3 gap-2">
                      <Input
                        placeholder="Phone number"
                        value={phone.value}
                        onChange={(e) =>
                          handlePhoneChange(index, "value", e.target.value)
                        }
                      />
                      <Select
                        value={phone.type}
                        onValueChange={(value) =>
                          handlePhoneChange(index, "type", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Mobile">Mobile</SelectItem>
                          <SelectItem value="Home">Home</SelectItem>
                          <SelectItem value="Work">Work</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select
                        value={phone.permission}
                        onValueChange={(value) =>
                          handlePhoneChange(index, "permission", value)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Permission" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text-voicemail">
                            Text/Voicemail
                          </SelectItem>
                          <SelectItem value="text-only">Text Only</SelectItem>
                          <SelectItem value="voicemail-only">
                            Voicemail Only
                          </SelectItem>
                          <SelectItem value="no-contact">No Contact</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <button
                      className="flex items-center text-gray-500 hover:text-red-500"
                      type="button"
                      onClick={() => {
                        const phones = formData.phones || [];
                        const newPhones = phones.filter((_, i) => i !== index);
                        handleChange("phones", newPhones);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              <button
                className="flex items-center text-[#2c8466] text-sm font-medium"
                type="button"
                onClick={() => {
                  const currentPhones = formData.phones || [];
                  handleChange("phones", [
                    ...currentPhones,
                    { value: "", type: "Mobile", permission: "text-voicemail" },
                  ]);
                }}
              >
                <Plus className="h-4 w-4 mr-1" /> Add phone
              </button>
            </div>
          </div>
        </div>

        {/* Address Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium">Address</h3>

          {Array.isArray(formData.addresses) &&
            formData.addresses.map((address, addressIndex) => (
              <div
                key={addressIndex}
                className="space-y-3 border-b pb-4 mb-4 last:border-b-0"
              >
                <div className="space-y-2">
                  <Label
                    className="text-xs text-gray-600"
                    htmlFor={`street-${addressIndex}`}
                  >
                    Street
                  </Label>
                  <div className="flex space-x-2">
                    <Input
                      className="flex-grow"
                      id={`street-${addressIndex}`}
                      placeholder="Search address"
                      value={address.street || ""}
                      onChange={(e) =>
                        handleAddressFieldChange(
                          addressIndex,
                          "street",
                          e.target.value,
                        )
                      }
                    />
                    <button
                      className="text-gray-500 hover:text-red-500"
                      type="button"
                      onClick={() => removeAddress(addressIndex)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label
                      className="text-xs text-gray-600"
                      htmlFor={`city-${addressIndex}`}
                    >
                      City
                    </Label>
                    <Input
                      id={`city-${addressIndex}`}
                      placeholder="City"
                      value={address.city || ""}
                      onChange={(e) =>
                        handleAddressFieldChange(
                          addressIndex,
                          "city",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label
                      className="text-xs text-gray-600"
                      htmlFor={`state-${addressIndex}`}
                    >
                      State
                    </Label>
                    <Select
                      value={address.state || ""}
                      onValueChange={(value) =>
                        handleAddressFieldChange(addressIndex, "state", value)
                      }
                    >
                      <SelectTrigger id={`state-${addressIndex}`}>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {statesUS.map((state) => (
                          <SelectItem
                            key={state.abbreviation}
                            value={state.abbreviation}
                          >
                            {state.name}-({state.abbreviation})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label
                      className="text-xs text-gray-600"
                      htmlFor={`zip-${addressIndex}`}
                    >
                      ZIP
                    </Label>
                    <Input
                      id={`zip-${addressIndex}`}
                      placeholder="ZIP"
                      value={address.zip || ""}
                      onChange={(e) =>
                        handleAddressFieldChange(
                          addressIndex,
                          "zip",
                          e.target.value,
                        )
                      }
                    />
                  </div>
                </div>
              </div>
            ))}

          <button
            className="flex items-center text-[#2c8466] text-sm mt-2"
            type="button"
            onClick={addAddress}
          >
            <Plus className="h-4 w-4 mr-1" /> Address
          </button>
        </div>

        {/* Notes */}
        <div className="space-y-2 pb-4">
          <Label className="text-sm font-medium" htmlFor="notes">
            Notes
          </Label>
          <Textarea
            id="notes"
            rows={4}
            value={formData.notes || ""}
            onChange={(e) => handleChange("notes", e.target.value)}
          />
        </div>

        {/* Client Details Section (New) */}
        <div className="space-y-4 border-t pt-4">
          <h3 className="text-sm font-medium">Client Details</h3>

          {/* Date of Birth */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Date of Birth</Label>
              <Input
                placeholder="YYYY-MM-DD"
                type="date"
                value={formData.date_of_birth || ""}
                onChange={(e) => handleChange("date_of_birth", e.target.value)}
              />
              <div className="text-sm text-gray-500">
                {formData.date_of_birth
                  ? `${new Date().getFullYear() - new Date(formData.date_of_birth).getFullYear()} years`
                  : ""}
              </div>
            </div>

            {/* Sex */}
            <div className="space-y-2">
              <Label className="text-sm">Sex</Label>
              <Select
                value={formData.sex || "Prefer not to say"}
                onValueChange={(value) => handleChange("sex", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sex" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="other">Prefer not to say</SelectItem>
                </SelectContent>
              </Select>
              <div className="text-xs text-gray-500">
                Sex is only required if you file insurance claims
              </div>
            </div>
          </div>

          {/* Gender Identity */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Label className="text-sm">Gender Identity</Label>
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              maxLength={140}
              placeholder="Add client's gender identity, pronouns, etc."
              value={formData.gender_identity || ""}
              onChange={(e) => handleChange("gender_identity", e.target.value)}
            />
            <div className="text-xs text-gray-500">
              Limited to 140 characters
            </div>
          </div>

          {/* Relationship and Employment Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm">Relationship Status</Label>
              <Select
                value={formData.relationship_status || "No answer"}
                onValueChange={(value) =>
                  handleChange("relationship_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Single">Single</SelectItem>
                  <SelectItem value="Married">Married</SelectItem>
                  <SelectItem value="Partnered">Partnered</SelectItem>
                  <SelectItem value="Divorced">Divorced</SelectItem>
                  <SelectItem value="Widowed">Widowed</SelectItem>
                  <SelectItem value="No answer">No answer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-sm">Employment Status</Label>
              <Select
                value={formData.employment_status || "No answer"}
                onValueChange={(value) =>
                  handleChange("employment_status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Self-employed">Self-employed</SelectItem>
                  <SelectItem value="Unemployed">Unemployed</SelectItem>
                  <SelectItem value="Student">Student</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                  <SelectItem value="No answer">No answer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Race & Ethnicity */}
          <div className="space-y-2">
            <Label className="text-sm">Race & Ethnicity</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected(
                    "American Indian or Alaska Native",
                  )}
                  id="race-native-american"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "American Indian or Alaska Native",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-native-american">
                  American Indian or Alaska Native
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected("Asian")}
                  id="race-asian"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange("Asian", checked === true)
                  }
                />
                <Label htmlFor="race-asian">Asian</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected("Black or African American")}
                  id="race-black"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "Black or African American",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-black">Black or African American</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected("Hispanic or Latinx")}
                  id="race-hispanic"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "Hispanic or Latinx",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-hispanic">Hispanic or Latinx</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected(
                    "Middle Eastern or North African",
                  )}
                  id="race-middle-eastern"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "Middle Eastern or North African",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-middle-eastern">
                  Middle Eastern or North African
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected(
                    "Native Hawaiian or Other Pacific Islander",
                  )}
                  id="race-pacific"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "Native Hawaiian or Other Pacific Islander",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-pacific">
                  Native Hawaiian or Other Pacific Islander
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected("White")}
                  id="race-white"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange("White", checked === true)
                  }
                />
                <Label htmlFor="race-white">White</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={isRaceEthnicitySelected(
                    "Race or ethnicity not listed",
                  )}
                  id="race-not-listed"
                  onCheckedChange={(checked) =>
                    handleRaceEthnicityChange(
                      "Race or ethnicity not listed",
                      checked === true,
                    )
                  }
                />
                <Label htmlFor="race-not-listed">
                  Race or ethnicity not listed
                </Label>
              </div>
            </div>
          </div>

          {/* Race & Ethnicity Details */}
          <div className="space-y-2">
            <div className="flex items-center space-x-1">
              <Label className="text-sm">Race & Ethnicity Details</Label>
              <HelpCircle className="h-4 w-4 text-gray-400" />
            </div>
            <Textarea
              maxLength={140}
              placeholder="Add any relevant details about the client's race, ethnicity, and origin."
              rows={2}
              value={formData.race_ethnicity_details || ""}
              onChange={(e) =>
                handleChange("race_ethnicity_details", e.target.value)
              }
            />
            <div className="text-xs text-gray-500">
              Limited to 140 characters
            </div>
          </div>

          {/* Preferred Language */}
          <div className="space-y-2">
            <Label className="text-sm">Preferred Language</Label>
            <Select
              value={formData.preferred_language || "No answer"}
              onValueChange={(value) =>
                handleChange("preferred_language", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="English">English</SelectItem>
                <SelectItem value="Spanish">Spanish</SelectItem>
                <SelectItem value="French">French</SelectItem>
                <SelectItem value="Mandarin">Mandarin</SelectItem>
                <SelectItem value="Arabic">Arabic</SelectItem>
                <SelectItem value="Russian">Russian</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
                <SelectItem value="No answer">No answer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </form>
  );
}
