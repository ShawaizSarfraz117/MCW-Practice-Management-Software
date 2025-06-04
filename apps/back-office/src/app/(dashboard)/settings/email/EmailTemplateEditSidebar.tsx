import { useEffect, useRef, useState } from "react";
import {
  Input,
  Textarea,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  Button,
} from "@mcw/ui";
import { X, Info } from "lucide-react";
import { cn } from "@mcw/utils";
import { useForm } from "@tanstack/react-form";
import { EmailTemplateEditSidebarProps } from "./types";

type FormData = {
  name: string;
  subject: string;
  content: string;
  type: string;
  isActive: boolean;
  macroClinician: string;
  macroPractice: string;
  macroClient: string;
  macroLinks: string;
};

type FormField = keyof FormData;

export default function EmailTemplateEditSidebar({
  open,
  onClose,
  template,
  onSave,
  isUpdating,
}: EmailTemplateEditSidebarProps) {
  const [formData, setFormData] = useState<FormData>({
    name: template?.name || "",
    subject: template?.subject || "",
    content: template?.content || "",
    type: template?.type || "",
    isActive: template?.isActive ?? true,
    macroClinician: "",
    macroPractice: "",
    macroClient: "",
    macroLinks: "",
  });

  // Add refs for subject and message inputs
  const subjectInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  // Track which input is focused
  const [focusedInput, setFocusedInput] = useState<"subject" | "message">(
    "message",
  );

  const form = useForm({
    defaultValues: formData,
    onSubmit: async ({ value }) => {
      if (!template?.id) return;
      onSave(value);
    },
  });

  // Reset form when template changes
  useEffect(() => {
    if (template) {
      const newFormData: FormData = {
        name: template.name,
        subject: template.subject,
        content: template.content,
        type: template.type,
        isActive: template.isActive,
        macroClinician: "",
        macroPractice: "",
        macroClient: "",
        macroLinks: "",
      };
      setFormData(newFormData);
      form.reset(newFormData);
    }
  }, [template, form]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open || !template) return null;

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (field: FormField, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    form.setFieldValue(field, value);
  };

  // Helper to insert macro at cursor
  function insertMacroAtCursor(macro: string) {
    const macroText = `{{${macro}}}`;
    let ref: HTMLInputElement | HTMLTextAreaElement | null = null;
    if (focusedInput === "subject") {
      ref = subjectInputRef.current;
    } else {
      ref = messageInputRef.current;
    }
    if (!ref) return;
    const start = ref.selectionStart || 0;
    const end = ref.selectionEnd || 0;
    const value = ref.value;
    const newValue = value.slice(0, start) + macroText + value.slice(end);
    ref.value = newValue;
    ref.selectionStart = ref.selectionEnd = start + macroText.length;
    // Update formData and form state
    if (focusedInput === "subject") {
      setFormData((prev) => ({ ...prev, subject: newValue }));
      form.setFieldValue("subject", newValue);
    } else {
      setFormData((prev) => ({ ...prev, content: newValue }));
      form.setFieldValue("content", newValue);
    }
    // Trigger input event for controlled components
    ref.dispatchEvent(new Event("input", { bubbles: true }));
  }

  return (
    <div className="fixed inset-0 z-50" onClick={handleOverlayClick}>
      <div className="fixed inset-0 bg-black/5 z-40" />
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-xl bg-white shadow-lg overflow-auto transition-transform duration-300 ease-in-out z-50",
          open ? "translate-x-0" : "translate-x-full",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex sticky top-0 bg-white items-center justify-between p-4 border-b z-10">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded hover:bg-gray-100">
              <X className="w-6 h-6" />
            </button>
            <span className="text-xl font-semibold">Edit Message Content</span>
          </div>
          <Button
            className="bg-green-600 text-white px-6 rounded-md"
            onClick={() => form.handleSubmit()}
            disabled={isUpdating || !template?.id}
          >
            {isUpdating ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="p-6 space-y-6">
          <div className="text-2xl font-semibold mb-2">{formData.name}</div>
          <div className="flex items-center gap-4 mb-2">
            <span className="text-gray-700 font-medium">From</span>
            <span className="text-gray-700">
              yourprovider@simplepractice.com
            </span>
          </div>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-gray-700 font-medium">Macros</span>
            <Info className="w-4 h-4 text-gray-400" />
            <Select
              value={formData.macroClinician}
              onValueChange={(value) => {
                handleInputChange("macroClinician", value);
                insertMacroAtCursor(value);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Clinician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="clinician">Clinician</SelectItem>
                <SelectItem value="clinician_full_name">
                  Clinician Full Name
                </SelectItem>
                <SelectItem value="clinician_first_name">
                  Clinician First Name
                </SelectItem>
                <SelectItem value="clinician_last_name">
                  Clinician Last Name
                </SelectItem>
                <SelectItem value="clinician_email">Clinician Email</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formData.macroPractice}
              onValueChange={(value) => {
                handleInputChange("macroPractice", value);
                insertMacroAtCursor(value);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Practice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="practice">Practice</SelectItem>
                <SelectItem value="practice_address_line1">
                  Practice Address Line1
                </SelectItem>
                <SelectItem value="practice_address_line2">
                  Practice Address Line2
                </SelectItem>
                <SelectItem value="practice_city">Practice City</SelectItem>
                <SelectItem value="practice_email">Practice Email</SelectItem>
                <SelectItem value="practice_full_name">
                  Practice Full Name
                </SelectItem>
                <SelectItem value="practice_full_office_address">
                  Practice Full Office Address
                </SelectItem>
                <SelectItem value="practice_location">
                  Practice Location
                </SelectItem>
                <SelectItem value="practice_name">Practice Name</SelectItem>
                <SelectItem value="practice_phone_number">
                  Practice Phone Number
                </SelectItem>
                <SelectItem value="practice_state">Practice State</SelectItem>
                <SelectItem value="practice_video_location">
                  Practice Video Location
                </SelectItem>
                <SelectItem value="practice_zip_code">
                  Practice Zip Code
                </SelectItem>
                <SelectItem value="practice_map_link">
                  Practice Map Link
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formData.macroClient}
              onValueChange={(value) => {
                handleInputChange("macroClient", value);
                insertMacroAtCursor(value);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="client_document_requests_size">
                  Client Document Requests Size
                </SelectItem>
                <SelectItem value="client_document_request_names">
                  Client Document Request Names
                </SelectItem>
                <SelectItem value="client_full_name">
                  Client Full Name
                </SelectItem>
                <SelectItem value="client_full_name_formatted">
                  Client Full Name Formatted
                </SelectItem>
                <SelectItem value="client_first_name">
                  Client First Name
                </SelectItem>
                <SelectItem value="client_first_name_formatted">
                  Client First Name Formatted
                </SelectItem>
                <SelectItem value="client_last_name">
                  Client Last Name
                </SelectItem>
                <SelectItem value="client_mobile_number">
                  Client Mobile Number
                </SelectItem>
                <SelectItem value="client_home_number">
                  Client Home Number
                </SelectItem>
                <SelectItem value="client_work_number">
                  Client Work Number
                </SelectItem>
                <SelectItem value="client_fax_number">
                  Client Fax Number
                </SelectItem>
                <SelectItem value="client_email_address">
                  Client Email Address
                </SelectItem>
                <SelectItem value="client_address_line1">
                  Client Address Line1
                </SelectItem>
                <SelectItem value="client_address_line2">
                  Client Address Line2
                </SelectItem>
                <SelectItem value="client_city">Client City</SelectItem>
                <SelectItem value="client_zip_code">Client Zip Code</SelectItem>
                <SelectItem value="client_state">Client State</SelectItem>
                <SelectItem value="client_birth_date">
                  Client Birth Date
                </SelectItem>
                <SelectItem value="client_gender">Client Gender</SelectItem>
                <SelectItem value="client_first_appointment_date">
                  Client First Appointment Date
                </SelectItem>
                <SelectItem value="client_first_appointment_time">
                  Client First Appointment Time
                </SelectItem>
                <SelectItem value="client_most_recent_appointment_date">
                  Client Most Recent Appointment Date
                </SelectItem>
                <SelectItem value="client_most_recent_appointment_time">
                  Client Most Recent Appointment Time
                </SelectItem>
                <SelectItem value="client_next_appointment_date">
                  Client Next Appointment Date
                </SelectItem>
                <SelectItem value="client_next_appointment_time">
                  Client Next Appointment Time
                </SelectItem>
                <SelectItem value="client_legally_admissible_first_name">
                  Client Legally Admissible First Name
                </SelectItem>
                <SelectItem value="recipient_legally_admissible_first_name">
                  Recipient Legally Admissible First Name
                </SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={formData.macroLinks}
              onValueChange={(value) => {
                handleInputChange("macroLinks", value);
                insertMacroAtCursor(value);
              }}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Links" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="link">Links</SelectItem>
                <SelectItem value="appointment_reminder_links">
                  Appointment Reminder Links
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject <span className="text-red-500">*</span>
            </label>
            <Input
              ref={subjectInputRef}
              value={formData.subject}
              onFocus={() => setFocusedInput("subject")}
              onChange={(e) => handleInputChange("subject", e.target.value)}
              placeholder="Enter email subject"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message <span className="text-red-500">*</span>
            </label>
            <Textarea
              ref={messageInputRef}
              value={formData.content}
              onFocus={() => setFocusedInput("message")}
              onChange={(e) => handleInputChange("content", e.target.value)}
              placeholder="Enter email content"
              className="min-h-[200px]"
              required
            />
          </div>
        </div>
      </div>
    </div>
  );
}
