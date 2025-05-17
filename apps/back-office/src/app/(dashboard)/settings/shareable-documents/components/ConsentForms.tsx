"use client";

import React from "react";
import dynamic from "next/dynamic";
import "react-quill/dist/quill.snow.css";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Sheet,
  SheetContent,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  Button,
} from "@mcw/ui";
import { Eye, Plus, X, ExternalLink } from "lucide-react";

// Dynamically import ReactQuill with SSR disabled
const ReactQuill = dynamic(() => import("react-quill"), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100vh-380px)] border p-4">Loading editor...</div>
  ),
});

interface ConsentForm {
  name: string;
  default: boolean;
  content?: string;
}

interface ConsentFormsProps {
  forms: ConsentForm[];
  onView?: (form: ConsentForm) => void;
  onEdit?: (form: ConsentForm) => void;
  onDelete?: (form: ConsentForm) => void;
  onNewForm?: () => void;
}

export function ConsentForms({
  forms,
  onEdit,
  onDelete,
  onNewForm,
}: ConsentFormsProps) {
  // State for managing different modals
  const [viewingForm, setViewingForm] = React.useState<ConsentForm | null>(
    null,
  );
  const [editingForm, setEditingForm] = React.useState<ConsentForm | null>(
    null,
  );
  const [deletingForm, setDeletingForm] = React.useState<ConsentForm | null>(
    null,
  );
  const [isCreating, setIsCreating] = React.useState(false);

  // Form data state for edit/create
  const [formData, setFormData] = React.useState({
    name: "",
    content: "",
  });

  // Reset form data when opening edit modal
  React.useEffect(() => {
    if (editingForm) {
      setFormData({
        name: editingForm.name,
        content: editingForm.content || getDefaultContent(editingForm.name),
      });
    }
  }, [editingForm]);

  // Helper function to get default content based on form name
  const getDefaultContent = (formName: string) => {
    // This is a placeholder - in production this would fetch from an API
    return `[INSERT NAME, ADDRESS AND CONTACT INFORMATION FOR YOUR PRACTICE HERE]

${formName.toUpperCase()}

APPOINTMENTS AND CANCELLATIONS
Please remember to cancel or reschedule 24 hours in advance. You will be responsible for the entire fee if cancellation is less than 24 hours.

The standard meeting time for psychotherapy is 50 minutes. It is up to you, however, to determine the length of time of your sessions. Requests to change the 50-minute session needs to be discussed with the therapist in order for time to be scheduled in advance.`;
  };

  // Handle save for both edit and create
  const handleSave = (isEdit: boolean) => {
    if (isEdit && editingForm && onEdit) {
      onEdit({ ...editingForm, ...formData });
      setEditingForm(null);
    } else if (!isEdit && onNewForm) {
      onNewForm();
      setIsCreating(false);
    }
    setFormData({ name: "", content: "" });
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (deletingForm && onDelete) {
      onDelete(deletingForm);
      setDeletingForm(null);
    }
  };

  // Quill modules configuration
  const modules = {
    toolbar: [
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ align: [] }],
      ["clean"],
    ],
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-base font-semibold text-gray-900">Consent forms</h2>
        <a
          href="#"
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          Learn more
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      <p className="text-sm text-gray-600 italic">
        Legal disclaimer: Consent forms are for reference only. It's your
        responsibility to customize them and ensure they meet the legal
        requirements of your state.
      </p>

      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[400px]">Name</TableHead>
              <TableHead className="w-[100px]">Default</TableHead>
              <TableHead className="w-[200px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {forms.map((form) => (
              <TableRow key={form.name}>
                <TableCell className="font-medium">{form.name}</TableCell>
                <TableCell>
                  <div className="pl-4">
                    <span className="text-sm text-gray-600">
                      {form.default ? "Yes" : "No"}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-gray-100"
                      onClick={() => setViewingForm(form)}
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                    </Button>
                    <button
                      onClick={() => setEditingForm(form)}
                      className="text-green-600 hover:text-green-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeletingForm(form)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell colSpan={3}>
                <button
                  onClick={() => setIsCreating(true)}
                  className="flex items-center text-green-600 hover:text-green-800 gap-1 text-sm"
                >
                  <Plus className="h-4 w-4" />
                  New consent form
                </button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {/* View Modal */}
      <Dialog open={!!viewingForm} onOpenChange={() => setViewingForm(null)}>
        <DialogContent className="max-w-2xl">
          {viewingForm && (
            <>
              <div className="flex items-center justify-between border-b border-gray-200 pb-4">
                <div className="flex items-center gap-4">
                  <h2 className="text-xl font-normal">{viewingForm.name}</h2>
                </div>
              </div>

              <div className="space-y-6 py-4">
                <div className="whitespace-pre-wrap text-sm text-gray-700">
                  {viewingForm.content || getDefaultContent(viewingForm.name)}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit/Create Modal */}
      <Sheet
        open={!!editingForm || isCreating}
        onOpenChange={() => {
          setEditingForm(null);
          setIsCreating(false);
        }}
      >
        <SheetContent className="w-[600px] sm:max-w-[600px] p-0 gap-0 [&>button]:hidden">
          <div className="flex items-center justify-between border-b p-4">
            <div className="flex items-center gap-2">
              <Button
                className="h-8 w-8 mr-2"
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditingForm(null);
                  setIsCreating(false);
                }}
              >
                <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
              </Button>
              <h2 className="text-lg font-medium">
                {editingForm ? "Edit Consent Form" : "New consent form"}
              </h2>
            </div>
            <Button
              onClick={() => handleSave(!!editingForm)}
              className="bg-[#2d8467] hover:bg-[#236c53]"
            >
              {editingForm ? "Save Changes" : "Save"}
            </Button>
          </div>

          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Form Name
              </label>
              <input
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Enter form name"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Form Content
              </label>
              <div className="border rounded-md">
                <ReactQuill
                  theme="snow"
                  value={formData.content}
                  onChange={(content) =>
                    setFormData((prev) => ({ ...prev, content }))
                  }
                  modules={modules}
                  className="h-[calc(100vh-380px)]"
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingForm} onOpenChange={() => setDeletingForm(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Consent Form</DialogTitle>
            <DialogDescription className="text-gray-600">
              Are you sure you want to delete "{deletingForm?.name}"? This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setDeletingForm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
