/* eslint-disable max-lines-per-function */
import { useState } from "react";
import { format } from "date-fns";
import { Edit, Printer, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@mcw/ui";
import { DatePicker } from "@mcw/ui";
import { TimePicker } from "@mcw/ui";
import { toast } from "@mcw/ui";
import { DocumentType } from "@mcw/types";
import { showErrorToast } from "@mcw/utils";
import {
  deleteDocument,
  updateChartNote,
} from "@/(dashboard)/clients/services/documents.service";
import { useRouter } from "next/navigation";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

interface TimelineItemProps {
  document: import("@mcw/types").ClientDocument;
}

export default function TimelineItem({ document }: TimelineItemProps) {
  const date = new Date(document.date);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editDate, setEditDate] = useState<Date | undefined>();
  const [editTime, setEditTime] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: () =>
      deleteDocument(document.id, document.documentType as DocumentType),
    onSuccess: () => {
      toast({
        description: "Document deleted successfully",
        variant: "success",
      });
      // Invalidate queries to refresh the timeline
      queryClient.invalidateQueries({
        queryKey: ["client-overview"],
      });
      setShowDeleteDialog(false);
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
      setShowDeleteDialog(false);
    },
  });

  // Update chart note mutation
  const updateMutation = useMutation({
    mutationFn: (data: { text?: string; note_date?: string }) =>
      updateChartNote(document.id, data),
    onSuccess: () => {
      toast({
        description: "Chart note updated successfully",
        variant: "success",
      });
      // Invalidate queries to refresh the timeline
      queryClient.invalidateQueries({
        queryKey: ["client-overview"],
      });
      setIsEditing(false);
    },
    onError: (error: unknown) => {
      showErrorToast(toast, error);
    },
  });

  // Format time range for appointments
  const getTimeDisplay = () => {
    if (document.documentType === "appointments" && document.content) {
      // Extract time from content if available
      return format(date, "h:mm a");
    }
    return format(date, "h:mm a");
  };

  // Function to parse and display JSON content
  const renderJsonContent = (content: string, documentType?: DocumentType) => {
    // Handle special formatting for good faith estimate first
    if (documentType === "good_faith_estimate") {
      const amount = parseFloat(content);
      const formattedAmount = isNaN(amount) ? content : `$${amount}`;
      return (
        <div className="text-sm text-gray-600 mt-1">
          Total estimated charges: {formattedAmount}
        </div>
      );
    }

    try {
      const jsonData = JSON.parse(content);
      const entries = Object.entries(jsonData);

      if (entries.length === 0) {
        return <div className="text-sm text-gray-600 mt-1">{content}</div>;
      }

      const displayEntries = isExpanded ? entries : entries.slice(0, 2);

      return (
        <div className="text-sm text-gray-600 mt-1">
          {displayEntries.map(([key, value], index) => (
            <div key={index} className="mb-1">
              <span className="font-medium">{key}:</span> {String(value)}
            </div>
          ))}
          {entries.length > 2 && (
            <button
              className="text-blue-500 hover:underline text-sm mt-1"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show Less" : "Show More"}
            </button>
          )}
        </div>
      );
    } catch {
      return (
        <div className="text-sm text-gray-600 mt-1 line-clamp-2">{content}</div>
      );
    }
  };

  // Handle action buttons
  const handleEdit = () => {
    if (document.documentType === "chart_notes") {
      // Initialize edit state with current values
      setEditContent(document.content || "");
      setEditDate(new Date(document.date));
      setEditTime(format(new Date(document.date), "h:mm a"));
      setIsEditing(true);
    } else if (document.documentType === "good_faith_estimate") {
      router.push(
        `/clients/${document.clientGroupId}/goodFaithEstimate/${document.id}/edit`,
      );
    } else if (document.documentType === "diagnosis_and_treatment_plans") {
      router.push(
        `/clients/${document.clientGroupId}/diagnosisAndTreatmentPlan/${document.id}`,
      );
    } else if (document.documentType === "mental_status_exams") {
      router.push(
        `/clients/${document.clientGroupId}/mentalStatusExam/${document.id}`,
      );
    }
  };

  const handleSaveNote = () => {
    if (!editContent.trim()) {
      toast({
        description: "Please enter note content",
        variant: "destructive",
      });
      return;
    }

    if (!editDate) {
      toast({
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    // Combine date and time
    const noteDate = new Date(editDate);
    const [time, period] = editTime.split(" ");
    const [hours, minutes] = time.split(":");
    let hour = parseInt(hours);

    if (period === "PM" && hour !== 12) {
      hour += 12;
    } else if (period === "AM" && hour === 12) {
      hour = 0;
    }

    noteDate.setHours(hour, parseInt(minutes), 0, 0);

    updateMutation.mutate({
      text: editContent,
      note_date: noteDate.toISOString(),
    });
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent("");
    setEditDate(undefined);
    setEditTime("");
  };

  const handlePrint = () => {
    console.log("Print clicked for:", document.id);
    // TODO: Implement print functionality
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    deleteMutation.mutate();
  };

  // Render action buttons based on document type
  const renderActionButtons = () => {
    if (!isHovered) return null;

    if (document.documentType === "appointments") {
      // Appointments only show Edit button
      return (
        <div className="flex gap-2">
          <button
            className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
            title="Edit"
            onClick={handleEdit}
          >
            <Edit className="h-4 w-4" />
          </button>
        </div>
      );
    }

    // All other document types show Edit, Print, Delete buttons
    return (
      <div className="flex gap-2">
        <button
          className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
          title="Edit"
          onClick={handleEdit}
        >
          <Edit className="h-4 w-4" />
        </button>
        <button
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded"
          title="Print"
          onClick={handlePrint}
        >
          <Printer className="h-4 w-4" />
        </button>
        <button
          className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
          title="Delete"
          onClick={handleDelete}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    );
  };

  // Render editing interface for chart notes
  if (isEditing && document.documentType === "chart_notes") {
    return (
      <>
        <div className="border-b border-gray-100 pb-4">
          <div className="flex gap-4">
            <div className="text-sm text-gray-500 min-w-[60px]">
              {format(date, "MMM d").toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-900 mb-4">
                {document.title}
              </div>

              {/* ReactQuill Editor */}
              <div className="mb-4 p-4 border border-[#e5e7eb] rounded-lg bg-[#f8fafc]">
                <ReactQuill
                  formats={[
                    "bold",
                    "italic",
                    "underline",
                    "list",
                    "bullet",
                    "link",
                  ]}
                  modules={{
                    toolbar: [
                      ["bold", "italic", "underline"],
                      [{ list: "ordered" }, { list: "bullet" }],
                      ["link"],
                      ["clean"],
                    ],
                  }}
                  style={{
                    height: "120px",
                    marginBottom: "50px",
                  }}
                  theme="snow"
                  value={editContent}
                  onChange={setEditContent}
                />
              </div>

              {/* Date and Time Controls */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <DatePicker
                    className="w-[200px] h-9 bg-white border-[#e5e7eb]"
                    value={editDate}
                    onChange={setEditDate}
                  />
                  <TimePicker
                    className="w-[120px] h-9 bg-white border-[#e5e7eb]"
                    value={editTime}
                    onChange={setEditTime}
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    className="text-gray-500 hover:text-gray-700 px-3 py-1 rounded"
                    disabled={updateMutation.isPending}
                    onClick={handleCancelEdit}
                  >
                    Cancel
                  </button>
                  <button
                    className="text-blue-500 hover:text-blue-700 px-3 py-1 rounded disabled:opacity-50"
                    disabled={updateMutation.isPending}
                    onClick={handleSaveNote}
                  >
                    {updateMutation.isPending ? "Saving..." : "Save Note"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="flex justify-between border-b border-gray-100 pb-4 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex gap-4">
          <div className="text-sm text-gray-500 min-w-[60px]">
            {format(date, "MMM d").toUpperCase()}
          </div>
          <div className="flex-1">
            <div className="font-medium text-gray-900">{document.title}</div>
            {document.documentType === "appointments" && document.status && (
              <div className="text-sm text-gray-600 mt-1">
                BILLING CODE: {document.id.slice(-5).toUpperCase()}
              </div>
            )}
            {document.content &&
              renderJsonContent(document.content, document.documentType)}
            {document.documentType === "diagnosis_and_treatment_plans" && (
              <>
                <div className="text-sm text-gray-600 mt-1">
                  Diagnosis: None Selected
                </div>
                <div className="text-sm text-gray-600">
                  Treatment Plan:{" "}
                  <span className="text-blue-500 cursor-pointer hover:underline">
                    Show Details
                  </span>
                </div>
              </>
            )}
            {document.documentType === "appointments" && (
              <Link
                href={`/appointmentNote/${document.clientGroupId}`}
                className="text-blue-500 hover:underline text-sm mt-2"
              >
                + Progress Note
              </Link>
            )}
          </div>
        </div>
        <div className="flex items-start gap-4">
          {renderActionButtons()}
          <div className="text-sm text-gray-500">{getTimeDisplay()}</div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Document</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{document.title}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={confirmDelete}
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
