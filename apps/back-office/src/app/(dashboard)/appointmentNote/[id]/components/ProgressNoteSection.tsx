"use client";

import { useRef } from "react";
import type { SurveyPreviewRef } from "@mcw/ui";
import {
  Button,
  Card,
  CardContent,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@mcw/ui";
import { Edit2, Trash2 } from "lucide-react";
import { SurveyPreview } from "@mcw/ui";
import { Template } from "./../../hooks/useTemplates";
import { SurveyContentDisplay } from "./SurveyContentDisplay";
import { formatDate, parseSurveyContent } from "../utils/noteParser";

interface SurveyNote {
  id: string;
  content?: string | null;
  updated_at?: Date | string;
  created_at?: Date | string;
}

interface ProgressNoteSectionProps {
  progressNotes: Template[];
  selectedNote: string;
  setSelectedNote: (note: string) => void;
  selectedTemplate: Template | undefined;
  progressNote: SurveyNote | null | undefined;
  isLoadingProgressNote: boolean;
  showEditProgressNote: boolean;
  setShowEditProgressNote: (show: boolean) => void;
  handleSaveProgressNote: (result: Record<string, unknown>) => void;
  handleCancelProgressNote: () => void;
  handleDeleteProgressNote: () => void;
  createMutationStatus: "idle" | "pending" | "error" | "success";
  updateMutationStatus: "idle" | "pending" | "error" | "success";
  isLoadingTemplates?: boolean;
}

export function ProgressNoteSection({
  progressNotes,
  selectedNote,
  setSelectedNote,
  selectedTemplate,
  progressNote,
  isLoadingProgressNote,
  showEditProgressNote,
  setShowEditProgressNote,
  handleSaveProgressNote,
  handleCancelProgressNote,
  handleDeleteProgressNote,
  createMutationStatus,
  updateMutationStatus,
}: ProgressNoteSectionProps) {
  const surveyRef = useRef<SurveyPreviewRef>(null);

  // Validate template content is valid JSON
  const isValidTemplateContent = (
    content: string | null | undefined,
  ): boolean => {
    if (!content) return false;
    try {
      JSON.parse(content);
      return true;
    } catch {
      return false;
    }
  };
  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Progress Note</h2>
          <div className="flex items-center gap-2">
            <Select value={selectedNote} onValueChange={setSelectedNote}>
              <SelectTrigger className="w-64 bg-white">
                <SelectValue placeholder="Select a progress note template" />
              </SelectTrigger>
              <SelectContent>
                {progressNotes.map((template: Template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Note Content */}
        {selectedTemplate ? (
          <div>
            {showEditProgressNote ? (
              // Show edit form
              <div className="space-y-4">
                <div className="border rounded-lg bg-white">
                  {isValidTemplateContent(selectedTemplate.content) ? (
                    <SurveyPreview
                      ref={surveyRef}
                      content={selectedTemplate.content!}
                      mode="edit"
                      showInstructions={false}
                      title=""
                      type={selectedTemplate.type}
                      onComplete={(result) => {
                        handleSaveProgressNote(result);
                        setShowEditProgressNote(false);
                      }}
                      defaultAnswers={
                        progressNote?.content
                          ? parseSurveyContent(progressNote.content) ||
                            undefined
                          : undefined
                      }
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Template content is not available or invalid.</p>
                      <p className="text-sm mt-2">
                        Please check the template configuration in Settings.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelProgressNote}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={
                      createMutationStatus === "pending" ||
                      updateMutationStatus === "pending"
                    }
                  >
                    {progressNote ? "Update" : "Save"}
                  </Button>
                </div>
              </div>
            ) : progressNote && !isLoadingProgressNote ? (
              // Show saved content with edit option
              <div className="space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <SurveyContentDisplay
                    content={progressNote.content}
                    className="text-sm text-gray-700"
                    borderColor="border-blue-200"
                  />
                  <div className="mt-3 text-xs text-gray-500">
                    Last updated:{" "}
                    {formatDate(
                      progressNote.updated_at || progressNote.created_at,
                    )}
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowEditProgressNote(true)}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Progress Note
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Delete Progress Note
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this progress note?
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={handleDeleteProgressNote}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ) : (
              // Show form for new note
              <div className="space-y-4">
                <div className="border rounded-lg bg-white">
                  {isValidTemplateContent(selectedTemplate.content) ? (
                    <SurveyPreview
                      ref={surveyRef}
                      content={selectedTemplate.content!}
                      mode="edit"
                      showInstructions={false}
                      title=""
                      type={selectedTemplate.type}
                      onComplete={(result) => {
                        handleSaveProgressNote(result);
                      }}
                      defaultAnswers={
                        progressNote?.content
                          ? parseSurveyContent(progressNote.content) ||
                            undefined
                          : undefined
                      }
                    />
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <p>Template content is not available or invalid.</p>
                      <p className="text-sm mt-2">
                        Please check the template configuration in Settings.
                      </p>
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={handleCancelProgressNote}>
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={
                      createMutationStatus === "pending" ||
                      updateMutationStatus === "pending"
                    }
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : progressNotes.length > 0 ? (
          <div className="text-center py-8 text-gray-400">
            Please select a progress note template from the dropdown above.
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No progress note templates available. Please configure templates in
            Settings.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
