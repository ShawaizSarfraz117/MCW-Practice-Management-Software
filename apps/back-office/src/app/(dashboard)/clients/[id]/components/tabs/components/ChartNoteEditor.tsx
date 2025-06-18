import { useState } from "react";
import { useParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import { DatePicker } from "@mcw/ui";
import { TimePicker } from "@mcw/ui";
import { toast } from "@mcw/ui";
import { createChartNote } from "@/(dashboard)/clients/services/documents.service";
import "react-quill/dist/quill.snow.css";

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });

export default function ChartNoteEditor() {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    new Date(2025, 0, 8), // Jan 8, 2025
  );
  const [editorContent, setEditorContent] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("5:07 PM");
  const [isLoading, setIsLoading] = useState(false);
  const params = useParams();
  const queryClient = useQueryClient();

  // Strip HTML tags for validation
  const stripHtmlTags = (html: string): string => {
    const div = document.createElement("div");
    div.innerHTML = html;
    return div.textContent || div.innerText || "";
  };

  const handleAddNote = async () => {
    // Validate that the note has content
    const plainText = stripHtmlTags(editorContent).trim();

    if (!plainText) {
      toast({
        description: "Please enter a note before adding",
        variant: "destructive",
      });
      return;
    }

    if (!selectedDate) {
      toast({
        description: "Please select a date for the note",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Combine date and time
      const noteDate = new Date(selectedDate);
      const [time, period] = selectedTime.split(" ");
      const [hours, minutes] = time.split(":");
      let hour = parseInt(hours);

      if (period === "PM" && hour !== 12) {
        hour += 12;
      } else if (period === "AM" && hour === 12) {
        hour = 0;
      }

      noteDate.setHours(hour, parseInt(minutes), 0, 0);

      const [response, error] = await createChartNote({
        body: {
          client_group_id: params.id as string,
          text: editorContent,
          note_date: noteDate.toISOString(),
        },
      });

      if (!error && response) {
        toast({
          description: "Chart note added successfully",
          variant: "success",
        });

        // Clear the editor
        setEditorContent("");

        // Invalidate queries to refresh the timeline
        queryClient.invalidateQueries({
          queryKey: ["client-overview"],
        });
      } else {
        toast({
          description: "Failed to add chart note",
          variant: "destructive",
        });
      }
    } catch (_error) {
      toast({
        description: "An error occurred while adding the note",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mb-6 p-4 border border-[#e5e7eb] rounded-lg">
      <div className="mb-6">
        <ReactQuill
          formats={["bold", "italic", "underline", "list", "bullet", "link"]}
          modules={{
            toolbar: [
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["link"],
              ["clean"],
            ],
          }}
          placeholder="Add Chart Note: include notes from a call with a client or copy & paste the contents of a document"
          style={{
            height: "120px",
            marginBottom: "50px",
          }}
          theme="snow"
          value={editorContent}
          onChange={setEditorContent}
        />
      </div>

      <div className="flex justify-between text-sm text-gray-500 mb-4">
        <div className="flex items-center gap-2">
          <DatePicker
            className="w-[10%] sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
            value={selectedDate}
            onChange={setSelectedDate}
          />
          <TimePicker
            className="w-[10%] sm:w-[120px] h-9 bg-white border-[#e5e7eb]"
            value={selectedTime}
            onChange={setSelectedTime}
          />
        </div>
        <button
          className="text-blue-500 hover:underline ml-4 disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading}
          onClick={handleAddNote}
        >
          {isLoading ? "Adding..." : "+ Add Note"}
        </button>
      </div>
    </div>
  );
}
