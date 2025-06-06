"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Button } from "@mcw/ui";
import { Card, CardContent } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { MoreHorizontal, Edit, FileText } from "lucide-react";

// Dynamic import for React Quill to avoid SSR issues
const ReactQuill = dynamic(() => import("react-quill"), { ssr: false });
import "react-quill/dist/quill.snow.css";

// Sample progress notes data
const progressNotes = [
  {
    id: "note-1",
    date: "Feb 5, 2025",
    type: "SOAP Note",
    subjective:
      "Client attended followup session to develop therapeutic treatment plan. He reported continuing somatic concerns including restlessness, fatigue, and digestive upset. He reported an increase in marijuana use to most evening, to manage anxiety and help with sleep.",
    objective:
      "Client appeared alert and fully oriented. Client denied, and behavior did not suggest, suicidal ideation, self-harm, or risk for violence. Client mood and affect were agitated throughout the session. Speech was normal.",
  },
  {
    id: "note-2",
    date: "Feb 3, 2025",
    type: "SOAP Note",
    subjective:
      "Client reported improved sleep patterns over the past week. Stated that anxiety levels have decreased slightly since last session. Continues to use coping strategies discussed in previous sessions.",
    objective:
      "Client presented as calm and cooperative. Made good eye contact throughout session. Speech was clear and goal-directed. No signs of psychosis or significant mood disturbance noted.",
  },
  {
    id: "note-3",
    date: "Jan 28, 2025",
    type: "Initial Assessment",
    subjective:
      "Client presents for initial therapy session. Reports history of anxiety and depression. Seeking help with stress management and developing healthy coping mechanisms.",
    objective:
      "Client appeared somewhat anxious but engaged well in the assessment process. Answered questions appropriately and provided detailed history. No immediate safety concerns identified.",
  },
];

export default function ProgressNotePage() {
  const _params = useParams();
  const _router = useRouter();
  const [activeTab, setActiveTab] = useState("appointment-info");
  const [selectedNote, setSelectedNote] = useState("note-1");
  const [showPsychotherapyNote, setShowPsychotherapyNote] = useState(false);
  const [psychotherapyContent, setPsychotherapyContent] = useState("");

  const handleSavePsychotherapyNote = () => {
    // TODO: Implement save functionality
    console.log("Saving psychotherapy note:", psychotherapyContent);
    setShowPsychotherapyNote(false);
    setPsychotherapyContent("");
  };

  const handleCancelPsychotherapyNote = () => {
    setShowPsychotherapyNote(false);
    setPsychotherapyContent("");
  };

  return (
    <div className="bg-gray-50">
      {/* Main Content */}
      <div className="">
        {/* Progress Note Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Progress Note</h2>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                  More
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  Sign
                </Button>
              </div>
            </div>

            {/* Note Selection Dropdown */}
            <div className="mb-6">
              <Select value={selectedNote} onValueChange={setSelectedNote}>
                <SelectTrigger className="w-full max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {progressNotes.map((note) => (
                    <SelectItem key={note.id} value={note.id}>
                      {note.date} - {note.type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Psychotherapy Note Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Psychotherapy Note
                </h3>
                <p className="text-sm text-gray-500">
                  Kept separate from the client record.{" "}
                  <button className="text-blue-500 hover:underline">
                    Learn more
                  </button>
                </p>
              </div>
              {!showPsychotherapyNote && (
                <Button
                  onClick={() => setShowPsychotherapyNote(true)}
                  className="text-blue-500 hover:text-blue-600"
                  variant="ghost"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Add note
                </Button>
              )}
            </div>

            {showPsychotherapyNote && (
              <div className="space-y-4">
                <div className="border rounded-lg">
                  <ReactQuill
                    value={psychotherapyContent}
                    onChange={setPsychotherapyContent}
                    placeholder="Begin typing here..."
                    modules={{
                      toolbar: [
                        ["bold", "italic", "strike"],
                        [{ list: "ordered" }, { list: "bullet" }],
                        ["link"],
                        ["clean"],
                      ],
                    }}
                    style={{
                      height: "200px",
                      marginBottom: "42px",
                    }}
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleCancelPsychotherapyNote}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSavePsychotherapyNote}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("appointment-info")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "appointment-info"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Appointment Info
            </button>
            <button
              onClick={() => setActiveTab("treatment-progress")}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === "treatment-progress"
                  ? "border-green-500 text-green-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Treatment progress
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        {activeTab === "appointment-info" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column - Details */}
            <div>
              <div className="mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Details</h3>
                  <Button variant="link" className="text-green-600 p-0">
                    Edit
                  </Button>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-900">Feb 5, 2025</span>
                    <Button
                      variant="link"
                      className="text-green-600 p-0 text-sm"
                    >
                      Show
                    </Button>
                  </div>
                  <div className="text-gray-600">
                    2:00 PM - 3:00 PM (60 mins)
                  </div>
                  <div className="text-gray-900">Alam Naqvi</div>
                </div>
              </div>

              {/* Appointments */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">
                  Appointments
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">Previous</div>
                      <div className="font-medium">Feb 4, 2025</div>
                      <div className="text-sm text-gray-600 mb-2">
                        1:00PM - 2:00PM
                      </div>
                      <Button
                        variant="link"
                        className="text-green-600 p-0 text-sm"
                      >
                        Show
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">Next</div>
                      <div className="font-medium">Feb 6, 2025</div>
                      <div className="text-sm text-gray-600 mb-2">
                        1:00PM - 2:00PM
                      </div>
                      <Button
                        variant="link"
                        className="text-green-600 p-0 text-sm"
                      >
                        Show
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="text-sm text-gray-600 mb-1">Next</div>
                      <div className="font-medium">Feb 8, 2025</div>
                      <div className="text-sm text-gray-600 mb-2">
                        1:00PM - 2:00PM
                      </div>
                      <Button
                        variant="link"
                        className="text-green-600 p-0 text-sm"
                      >
                        Show
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            {/* Right Column - Services & Billing */}
            <div className="space-y-6">
              {/* Services */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Services</h3>
                <div className="flex justify-between items-center">
                  <span className="text-gray-900">
                    90834 Psychotherapy, 45 min
                  </span>
                  <span className="font-medium">$100</span>
                </div>
              </div>

              {/* Billing */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Billing</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Self Pay</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Appointment Total</span>
                    <span>$100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "treatment-progress" && (
          <div className="text-center py-8 text-gray-500">
            Treatment progress content would go here
          </div>
        )}
      </div>
    </div>
  );
}
