"use client";

import { useForm } from "@tanstack/react-form";
import { X, Plus, Minus } from "lucide-react";
import { Sheet, SheetContent } from "@mcw/ui";
import { Button } from "@mcw/ui";
import { Input } from "@mcw/ui";
import { Label } from "@mcw/ui";
import { RadioGroup, RadioGroupItem } from "@mcw/ui";
import { Checkbox } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { Switch } from "@mcw/ui";

interface CreateClientDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAppointmentDate?: string;
}

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

export function CreateClientDrawer({
  open,
  onOpenChange,
  defaultAppointmentDate = "Tuesday, Oct 22, 2025 @ 12:00 PM",
}: CreateClientDrawerProps) {
  const form = useForm({
    defaultValues: {
      clientType: "adult",
      legalFirstName: "",
      legalLastName: "",
      preferredName: "",
      dob: "",
      status: "active",
      addToWaitlist: false,
      primaryClinician: "travis",
      location: "stpete",
      emails: [] as EmailEntry[],
      phones: [] as PhoneEntry[],
      // email: "",
      // emailType: "home",
      // emailPermission: "email-ok",
      // phone: "",
      // phoneType: "mobile",
      // phonePermission: "text-voicemail",
      notificationOptions: {
        upcomingAppointments: true,
        incompleteDocuments: false,
        cancellations: false,
      },
      contactMethod: {
        text: true,
        voice: false,
      },
    },
    onSubmit: async ({ value }) => {
      console.log("Form submitted:", value);
      // Handle form submission here
    },
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-[500px] p-0 gap-0 overflow-auto [&>button]:hidden"
        side="right"
      >
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="text-xl font-semibold">Create client</h2>
            <p className="text-sm text-gray-500">
              Appointment: {defaultAppointmentDate}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
            <Button
              className="bg-[#2d8467] hover:bg-[#236c53]"
              onClick={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              Continue
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto h-[calc(100vh-72px)]">
          {/* Client Type */}
          <form.Field name="clientType">
            {(field) => (
              <RadioGroup
                value={field.state.value}
                onValueChange={field.handleChange}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="adult" id="adult" />
                  <Label htmlFor="adult">Adult</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="minor" id="minor" />
                  <Label htmlFor="minor">Minor</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="couple" id="couple" />
                  <Label htmlFor="couple">Couple</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="family" id="family" />
                  <Label htmlFor="family">Family</Label>
                </div>
              </RadioGroup>
            )}
          </form.Field>

          {/* Name Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.Field name="legalFirstName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="legal-first-name">Legal first name</Label>
                  <Input
                    id="legal-first-name"
                    placeholder="Almir"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="legalLastName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="legal-last-name">Legal last name</Label>
                  <Input
                    id="legal-last-name"
                    placeholder="Kazacic"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Preferred Name & DOB */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <form.Field name="preferredName">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="preferred-name">
                    What name do they go by?
                  </Label>
                  <Input
                    id="preferred-name"
                    placeholder="Almir"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
            <form.Field name="dob">
              {(field) => (
                <div className="space-y-2">
                  <Label htmlFor="dob">Date of Birth</Label>
                  <Input
                    id="dob"
                    placeholder="DD/MM/YYYY"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                </div>
              )}
            </form.Field>
          </div>

          {/* Contact Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Contact Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field name="status">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <RadioGroup
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      className="flex gap-4"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="active" id="active" />
                        <Label htmlFor="active">Active</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="prospective" id="prospective" />
                        <Label htmlFor="prospective">Prospective</Label>
                      </div>
                    </RadioGroup>
                  </div>
                )}
              </form.Field>
              <form.Field name="addToWaitlist">
                {(field) => (
                  <div className="space-y-2">
                    <Label>Waitlist</Label>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="waitlist"
                        checked={field.state.value}
                        onCheckedChange={(checked) =>
                          field.handleChange(checked === true)
                        }
                      />
                      <Label htmlFor="waitlist">Add to waitlist</Label>
                    </div>
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Clinician */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Clinician</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <form.Field name="primaryClinician">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="primary-clinician">Primary Clinician</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="primary-clinician">
                        <SelectValue placeholder="Select clinician" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="travis">Travis McNulty</SelectItem>
                        <SelectItem value="alam">Alam Naqvi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
              <form.Field name="location">
                {(field) => (
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Select
                      value={field.state.value}
                      onValueChange={field.handleChange}
                    >
                      <SelectTrigger id="location">
                        <SelectValue placeholder="Select location" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="stpete">
                          Saint Petersburg McNulty Counseling
                        </SelectItem>
                        <SelectItem value="tampa">
                          Tampa McNulty Counseling
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </form.Field>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-medium">Contact details</h3>
              <p className="text-xs text-gray-500">
                Manage contact info for reminders and notifications. An email is
                needed for granting Client Portal access.
              </p>
            </div>

            {/* Email */}
            <form.Field name="emails">
              {(field) => (
                <div className="space-y-2">
                  {field.state.value.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`email-${index}`}>Email</Label>
                        <Input
                          id={`email-${index}`}
                          placeholder="Email"
                          value={field.state.value[index]?.address || ""}
                          onChange={(e) =>
                            field.setValue(
                              field.state.value.map((email, i) =>
                                i === index
                                  ? { ...email, address: e.target.value }
                                  : email,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`email-type-${index}`}>Type</Label>
                        <Select
                          value={field.state.value[index]?.type || "home"}
                          onValueChange={(value) =>
                            field.setValue(
                              field.state.value.map((email, i) =>
                                i === index ? { ...email, type: value } : email,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`email-type-${index}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`email-permission-${index}`}>
                          Permission
                        </Label>
                        <Select
                          value={
                            field.state.value[index]?.permission || "email-ok"
                          }
                          onValueChange={(value) =>
                            field.setValue(
                              field.state.value.map((email, i) =>
                                i === index
                                  ? { ...email, permission: value }
                                  : email,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`email-permission-${index}`}>
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email-ok">Email OK</SelectItem>
                            <SelectItem value="no-email">No Email</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          field.setValue(
                            field.state.value.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Minus className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="text-[#2d8467]"
                    onClick={() =>
                      field.setValue([
                        ...field.state.value,
                        { address: "", type: "home", permission: "email-ok" },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add email
                  </Button>
                </div>
              )}
            </form.Field>

            {/* Phone */}
            <form.Field name="phones">
              {(field) => (
                <div className="space-y-2 mt-4">
                  {field.state.value.map((_, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
                    >
                      <div className="space-y-2">
                        <Label htmlFor={`phone-${index}`}>Phone</Label>
                        <Input
                          id={`phone-${index}`}
                          placeholder="Phone Number"
                          value={field.state.value[index]?.number || ""}
                          onChange={(e) =>
                            field.setValue(
                              field.state.value.map((phone, i) =>
                                i === index
                                  ? { ...phone, number: e.target.value }
                                  : phone,
                              ),
                            )
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`phone-type-${index}`}>Type</Label>
                        <Select
                          value={field.state.value[index]?.type || "mobile"}
                          onValueChange={(value) =>
                            field.setValue(
                              field.state.value.map((phone, i) =>
                                i === index ? { ...phone, type: value } : phone,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`phone-type-${index}`}>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mobile">Mobile</SelectItem>
                            <SelectItem value="home">Home</SelectItem>
                            <SelectItem value="work">Work</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`phone-permission-${index}`}>
                          Permission
                        </Label>
                        <Select
                          value={
                            field.state.value[index]?.permission ||
                            "text-voicemail"
                          }
                          onValueChange={(value) =>
                            field.setValue(
                              field.state.value.map((phone, i) =>
                                i === index
                                  ? { ...phone, permission: value }
                                  : phone,
                              ),
                            )
                          }
                        >
                          <SelectTrigger id={`phone-permission-${index}`}>
                            <SelectValue placeholder="Select permission" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text-voicemail">
                              Text/ Voicemail
                            </SelectItem>
                            <SelectItem value="text-only">Text Only</SelectItem>
                            <SelectItem value="voicemail-only">
                              Voicemail Only
                            </SelectItem>
                            <SelectItem value="no-contact">
                              No Contact
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() =>
                          field.setValue(
                            field.state.value.filter((_, i) => i !== index),
                          )
                        }
                      >
                        <Minus className="h-4 w-4 text-gray-400" />
                      </Button>
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    className="text-[#2d8467]"
                    onClick={() =>
                      field.setValue([
                        ...field.state.value,
                        {
                          number: "",
                          type: "mobile",
                          permission: "text-voicemail",
                        },
                      ])
                    }
                  >
                    <Plus className="h-4 w-4 mr-1" /> Add phone
                  </Button>
                </div>
              )}
            </form.Field>
          </div>

          {/* Reminder and Notification Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">
              Reminder and notification options
            </h3>

            <form.Field name="notificationOptions.upcomingAppointments">
              {(field) => (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="upcoming-appointments"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                    <Label htmlFor="upcoming-appointments">
                      Upcoming appointments
                    </Label>
                  </div>
                  <Button variant="link" className="text-[#2d8467] h-auto p-0">
                    Manage
                  </Button>
                </div>
              )}
            </form.Field>

            <div className="pl-12 space-y-2">
              <p className="text-sm text-gray-600">example@email.com</p>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-600">No phone</p>
                <form.Field name="contactMethod">
                  {(field) => (
                    <div className="flex items-center space-x-2">
                      <RadioGroup
                        value={field.state.value.text ? "text" : "voice"}
                        onValueChange={(value) =>
                          field.handleChange({
                            text: value === "text",
                            voice: value === "voice",
                          })
                        }
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="text" id="text" />
                          <Label htmlFor="text">Text</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="voice" id="voice" />
                          <Label htmlFor="voice">Voice</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}
                </form.Field>
              </div>
            </div>

            <form.Field name="notificationOptions.incompleteDocuments">
              {(field) => (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="incomplete-documents"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                    <Label htmlFor="incomplete-documents">
                      Incomplete documents
                    </Label>
                  </div>
                  <Button variant="link" className="text-[#2d8467] h-auto p-0">
                    Manage
                  </Button>
                </div>
              )}
            </form.Field>

            <form.Field name="notificationOptions.cancellations">
              {(field) => (
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="cancellations"
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                    />
                    <Label htmlFor="cancellations">Cancellations</Label>
                  </div>
                  <Button variant="link" className="text-[#2d8467] h-auto p-0">
                    Manage
                  </Button>
                </div>
              )}
            </form.Field>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
