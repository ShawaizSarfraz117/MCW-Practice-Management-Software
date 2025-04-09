/* eslint-disable max-lines-per-function */
import { Button, Input, Select } from "@mcw/ui";
import { SelectContent, SelectItem, SelectTrigger, SelectValue } from "@mcw/ui";
import { Plus, Minus } from "lucide-react";
import { EmailEntry, PhoneEntry } from "./CreateClientDrawer";

interface ContactDetailsSectionProps {
  emails: EmailEntry[];
  phones: PhoneEntry[];
  onEmailsChange: (emails: EmailEntry[]) => void;
  onPhonesChange: (phones: PhoneEntry[]) => void;
  validationErrors?: Record<string, string[]>;
  clearValidationError?: (fieldName: string) => void;
}

export function ContactDetailsSection({
  emails = [],
  phones = [],
  onEmailsChange,
  onPhonesChange,
  validationErrors = {},
  clearValidationError,
}: ContactDetailsSectionProps) {
  // Helper to check if we have valid contact info
  const hasValidContactInfo = (emails: EmailEntry[], phones: PhoneEntry[]) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const hasValidEmail = emails.some(
      (e: EmailEntry) => e.value.trim() !== "" && emailRegex.test(e.value),
    );

    const hasValidPhone = phones.some((p: PhoneEntry) => p.value.trim() !== "");

    return hasValidEmail || hasValidPhone;
  };

  const handleEmailChange = (index: number, newValue: string) => {
    const newEmails = [...emails];
    newEmails[index] = { ...newEmails[index], value: newValue };
    onEmailsChange(newEmails);

    if (clearValidationError && hasValidContactInfo(newEmails, phones)) {
      clearValidationError("emails");
    }
  };

  const handlePhoneChange = (index: number, newValue: string) => {
    const newPhones = [...phones];
    newPhones[index] = { ...newPhones[index], value: newValue };
    onPhonesChange(newPhones);

    if (clearValidationError && hasValidContactInfo(emails, newPhones)) {
      clearValidationError("emails");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-lg font-medium">Contact details</h3>
        <p className="text-xs text-gray-500">
          Manage contact info for reminders and notifications. An email is
          needed for granting Client Portal access.
        </p>
      </div>

      {/* Email Section */}
      <div className="space-y-2">
        {validationErrors.emails?.[0] && (
          <p className="text-sm text-red-500 mb-2">
            {validationErrors.emails[0]}
          </p>
        )}
        {emails.map((email, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
          >
            <Input
              className={validationErrors.emails ? "border-red-500" : ""}
              placeholder="Email"
              value={email.value || ""}
              onChange={(e) => handleEmailChange(index, e.target.value)}
            />
            <Select
              value={email.type || "home"}
              onValueChange={(newValue) => {
                const newEmails = [...emails];
                newEmails[index] = { ...email, type: newValue };
                onEmailsChange(newEmails);
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
                const newEmails = [...emails];
                newEmails[index] = { ...email, permission: newValue };
                onEmailsChange(newEmails);
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
                const newEmails = emails.filter((_, i) => i !== index);
                onEmailsChange(newEmails);
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
              ...emails,
              { value: "", type: "home", permission: "email-ok" },
            ];
            onEmailsChange(newEmails);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Email
        </Button>
      </div>

      {/* Phone Section */}
      <div className="space-y-2 mt-4">
        {phones.map((phone, index) => (
          <div
            key={index}
            className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-end"
          >
            <Input
              className={validationErrors.emails ? "border-red-500" : ""}
              placeholder="Phone Number"
              value={phone.value || ""}
              onChange={(e) => handlePhoneChange(index, e.target.value)}
            />
            <Select
              value={phone.type || "mobile"}
              onValueChange={(newValue) => {
                const newPhones = [...phones];
                newPhones[index] = { ...phone, type: newValue };
                onPhonesChange(newPhones);
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
                const newPhones = [...phones];
                newPhones[index] = { ...phone, permission: newValue };
                onPhonesChange(newPhones);
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
                const newPhones = phones.filter((_, i) => i !== index);
                onPhonesChange(newPhones);
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
              ...phones,
              { value: "", type: "mobile", permission: "text-voicemail" },
            ];
            onPhonesChange(newPhones);
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Add Phone
        </Button>
      </div>
    </div>
  );
}
