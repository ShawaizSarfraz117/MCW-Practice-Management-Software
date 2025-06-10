"use client";

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
  const formatDate = (dateValue: Date | string | undefined) => {
    if (!dateValue) return "Date not available";
    try {
      const date = new Date(dateValue);
      return isNaN(date.getTime()) ? "Invalid date" : date.toLocaleString();
    } catch {
      return "Date formatting error";
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
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {progressNotes.map((template: Template) => (
                  <SelectItem key={template.id} value={template.name}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Progress Note Content */}
        {selectedTemplate && (
          <div>
            {showEditProgressNote ? (
              // Show edit form
              <div className="space-y-4">
                <div className="border rounded-lg bg-white">
                  <SurveyPreview
                    content={selectedTemplate.content || ""}
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
                        ? JSON.parse(progressNote.content)
                        : undefined
                    }
                  />
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
                  <div className="text-sm text-gray-700">
                    {progressNote.content &&
                      (() => {
                        try {
                          const parsedContent = JSON.parse(
                            progressNote.content,
                          );
                          if (
                            parsedContent &&
                            typeof parsedContent === "object"
                          ) {
                            return (
                              <div className="space-y-3">
                                {Object.entries(parsedContent).map(
                                  ([key, value]) => {
                                    if (
                                      !value ||
                                      (typeof value === "string" &&
                                        value.trim() === "")
                                    ) {
                                      return null;
                                    }

                                    return (
                                      <div
                                        key={key}
                                        className="border-l-2 border-blue-200 pl-3"
                                      >
                                        <div className="font-medium text-gray-800 text-sm mb-1">
                                          {key
                                            .replace(/([A-Z])/g, " $1")
                                            .replace(/^./, (str) =>
                                              str.toUpperCase(),
                                            )}
                                          :
                                        </div>
                                        <div className="text-gray-700 text-sm">
                                          {typeof value === "object" ? (
                                            <pre className="whitespace-pre-wrap text-xs">
                                              {JSON.stringify(value, null, 2)}
                                            </pre>
                                          ) : (
                                            (() => {
                                              const stringValue = String(value);
                                              const hasHtmlTags =
                                                /<[^>]*>/g.test(stringValue);

                                              if (hasHtmlTags) {
                                                return (
                                                  <div
                                                    dangerouslySetInnerHTML={{
                                                      __html: stringValue,
                                                    }}
                                                  />
                                                );
                                              } else {
                                                return <div>{stringValue}</div>;
                                              }
                                            })()
                                          )}
                                        </div>
                                      </div>
                                    );
                                  },
                                )}
                              </div>
                            );
                          }

                          const displayContent =
                            parsedContent?.summary ||
                            parsedContent?.content ||
                            parsedContent?.description ||
                            "Content available but format not recognized";

                          return typeof displayContent === "string" ? (
                            <div
                              dangerouslySetInnerHTML={{
                                __html: displayContent,
                              }}
                            />
                          ) : (
                            <pre className="whitespace-pre-wrap text-xs">
                              {JSON.stringify(parsedContent, null, 2)}
                            </pre>
                          );
                        } catch {
                          return (
                            <div>
                              Error parsing content: {progressNote.content}
                            </div>
                          );
                        }
                      })()}
                    <div className="mt-3 text-xs text-gray-500">
                      Last updated:{" "}
                      {formatDate(
                        progressNote.updated_at || progressNote.created_at,
                      )}
                    </div>
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
              <div className="border rounded-lg bg-white">
                <SurveyPreview
                  content={selectedTemplate.content || ""}
                  mode="edit"
                  showInstructions={false}
                  title=""
                  type={selectedTemplate.type}
                  onComplete={handleSaveProgressNote}
                  defaultAnswers={
                    progressNote?.content
                      ? JSON.parse(progressNote.content)
                      : undefined
                  }
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
