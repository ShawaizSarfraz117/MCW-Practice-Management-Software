import { useEffect } from "react";
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

export default function EmailTemplateEditSidebar({
  open,
  onClose,
  template,
  onSave,
  isUpdating,
}: EmailTemplateEditSidebarProps) {
  const form = useForm({
    defaultValues: {
      name: "",
      subject: "",
      content: "",
      type: "",
      isActive: true,
      macroClinician: "",
      macroPractice: "",
      macroClient: "",
      macroLinks: "",
    },
    onSubmit: async ({ value }) => {
      if (!template?.id) return;
      onSave(value);
    },
  });

  useEffect(() => {
    if (template) {
      form.setFieldValue("name", template.name);
      form.setFieldValue("subject", template.subject);
      form.setFieldValue("content", template.content);
      form.setFieldValue("type", template.type);
      form.setFieldValue("isActive", template.isActive);
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
          <div className="text-2xl font-semibold mb-2">
            {form.getFieldValue("name")}
          </div>
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
              value={form.getFieldValue("macroClinician")}
              onValueChange={(value) =>
                form.setFieldValue("macroClinician", value)
              }
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Clinician" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full_name">Full Name</SelectItem>
                <SelectItem value="email">Email</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.getFieldValue("macroPractice")}
              onValueChange={(value) =>
                form.setFieldValue("macroPractice", value)
              }
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Practice" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="address">Address</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.getFieldValue("macroClient")}
              onValueChange={(value) =>
                form.setFieldValue("macroClient", value)
              }
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_name">First Name</SelectItem>
                <SelectItem value="last_name">Last Name</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={form.getFieldValue("macroLinks")}
              onValueChange={(value) => form.setFieldValue("macroLinks", value)}
            >
              <SelectTrigger className="w-28 h-8 text-sm">
                <SelectValue placeholder="Links" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portal">Portal Link</SelectItem>
                <SelectItem value="map">Map Link</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <Input
              value={form.getFieldValue("subject")}
              onChange={(e) => form.setFieldValue("subject", e.target.value)}
              placeholder="Enter email subject"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <Textarea
              value={form.getFieldValue("content")}
              onChange={(e) => form.setFieldValue("content", e.target.value)}
              placeholder="Enter email content"
              className="min-h-[200px]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
