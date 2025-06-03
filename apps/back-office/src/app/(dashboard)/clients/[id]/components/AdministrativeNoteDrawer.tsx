"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@mcw/ui";
import { Sheet, SheetContent } from "@mcw/ui";
import { useParams } from "next/navigation";
import { useToast } from "@mcw/ui";
import dynamic from "next/dynamic";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

interface AdministrativeNote {
  id: string;
  content: string;
  createdBy: string;
  createdAt: string | Date;
  authorName: string;
}

interface AdministrativeNoteDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onNoteSaved?: () => void;
  editingNote?: AdministrativeNote | null;
}

export default function AdministrativeNoteDrawer({
  open,
  onOpenChange,
  onNoteSaved,
  editingNote,
}: AdministrativeNoteDrawerProps) {
  const [noteContent, setNoteContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const { id } = useParams();
  const { toast } = useToast();

  // Pre-populate content when editing
  useEffect(() => {
    if (editingNote) {
      setNoteContent(editingNote.content);
    } else {
      setNoteContent("");
    }
  }, [editingNote]);

  // Clear content when drawer closes
  useEffect(() => {
    if (!open && !editingNote) {
      setNoteContent("");
    }
  }, [open, editingNote]);

  const handleSave = async () => {
    if (!noteContent.trim()) {
      toast({
        title: "Error",
        description: "Please enter a note before saving.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const isEditing = !!editingNote;
      const url = isEditing
        ? `/api/clients/${id}/administrative-notes/${editingNote.id}`
        : `/api/clients/${id}/administrative-notes`;

      const response = await fetch(url, {
        method: isEditing ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: noteContent,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isEditing ? "update" : "save"} note`);
      }

      toast({
        title: "Success",
        description: `Administrative note ${isEditing ? "updated" : "saved"} successfully.`,
        variant: "success",
      });

      setNoteContent("");
      onOpenChange(false);
      onNoteSaved?.();
    } catch (error) {
      console.error(
        `Error ${editingNote ? "updating" : "saving"} note:`,
        error,
      );
      toast({
        title: "Error",
        description: `Failed to ${editingNote ? "update" : "save"} administrative note.`,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  // React Quill configuration
  const modules = {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline", "strike"],
      [{ list: "ordered" }, { list: "bullet" }],
      ["link"],
      ["clean"],
    ],
  };

  const formats = [
    "header",
    "bold",
    "italic",
    "underline",
    "strike",
    "list",
    "bullet",
    "link",
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[450px] p-0 gap-0 [&>button]:hidden">
        <div className="flex items-center justify-between border-b p-4">
          <div className="flex items-center gap-2">
            <Button
              className="h-8 w-8 mr-2"
              size="icon"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-5 w-5 text-gray-500 hover:text-gray-700" />
            </Button>
            <h2 className="text-lg font-medium">
              {editingNote
                ? "Edit Administrative Note"
                : "Create Administrative Note"}
            </h2>
          </div>
          <Button
            className="bg-[#2d8467] hover:bg-[#236c53]"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </div>

        <div className="p-4 overflow-y-auto h-[calc(100vh-64px)]">
          <div className="text-sm text-gray-600 mb-4">
            The Administrative Note is just like a sticky note in your office.
            Use it as a reminder for yourself or for your team members about
            this client. Also, like a sticky note, these are not part of the
            client&apos;s medical record.{" "}
            <a className="text-blue-500 hover:underline" href="#">
              Learn more
            </a>
          </div>

          {/* React Quill Editor */}
          <div className="min-h-[200px] mb-4">
            <ReactQuill
              theme="snow"
              value={noteContent}
              onChange={setNoteContent}
              modules={modules}
              formats={formats}
              placeholder="Begin typing here..."
              style={{
                height: "200px",
                marginBottom: "50px", // Add space for toolbar
              }}
            />
          </div>

          <div className="text-sm text-gray-600">
            If you want to notify a team member about this, send them a Secure
            Message.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
