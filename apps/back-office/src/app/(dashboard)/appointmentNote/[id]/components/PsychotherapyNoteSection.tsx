"use client";

import {
  Button,
  Card,
  CardContent,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@mcw/ui";
import { Edit2, Trash2, Plus, ChevronDown } from "lucide-react";
import { SurveyPreview } from "@mcw/ui";
import { Template } from "./../../hooks/useTemplates";

interface SurveyNote {
  id: string;
  content?: string | null;
  updated_at?: Date | string;
  created_at?: Date | string;
}

interface PsychotherapyNoteSectionProps {
  psychoTemplate: Template | undefined;
  psychoNote: SurveyNote | null | undefined;
  isLoadingPsychoNote: boolean;
  showPsychotherapyNote: boolean;
  setShowPsychotherapyNote: (show: boolean) => void;
  handleSavePsychotherapyNote: (result: Record<string, unknown>) => void;
  handleCancelPsychotherapyNote: () => void;
  handleDeletePsychotherapyNote: () => void;
  createMutationStatus: "idle" | "pending" | "error" | "success";
  updateMutationStatus: "idle" | "pending" | "error" | "success";
}

export function PsychotherapyNoteSection({
  psychoTemplate,
  psychoNote,
  isLoadingPsychoNote,
  showPsychotherapyNote,
  setShowPsychotherapyNote,
  handleSavePsychotherapyNote,
  handleCancelPsychotherapyNote,
  handleDeletePsychotherapyNote,
  createMutationStatus,
  updateMutationStatus,
}: PsychotherapyNoteSectionProps) {
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
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Psychotherapy Note</h3>
            <p className="text-sm text-gray-500">
              Kept separate from the client record.{" "}
              <a href="#" className="text-blue-600 hover:underline">
                Learn more
              </a>
            </p>
          </div>
          <div className="flex items-center gap-2">
            {psychoNote && (
              <AlertDialog>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      More <ChevronDown className="ml-1 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem className="text-red-600 cursor-pointer">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Note
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                  </DropdownMenuContent>
                </DropdownMenu>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Delete Psychotherapy Note
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this psychotherapy note?
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeletePsychotherapyNote}
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {psychoNote ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPsychotherapyNote(true)}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowPsychotherapyNote(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            )}
          </div>
        </div>

        {isLoadingPsychoNote ? (
          <div className="text-center py-8 text-gray-400">
            Loading psychotherapy note...
          </div>
        ) : psychoNote && !showPsychotherapyNote ? (
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-700">
              {psychoNote.content &&
                (() => {
                  try {
                    const parsedContent = JSON.parse(psychoNote.content);

                    if (parsedContent && typeof parsedContent === "object") {
                      return (
                        <div className="space-y-3">
                          {Object.entries(parsedContent).map(([key, value]) => {
                            if (
                              !value ||
                              (typeof value === "string" && value.trim() === "")
                            ) {
                              return null;
                            }

                            return (
                              <div
                                key={key}
                                className="border-l-2 border-purple-200 pl-3"
                              >
                                <div className="font-medium text-gray-800 text-sm mb-1">
                                  {key
                                    .replace(/([A-Z])/g, " $1")
                                    .replace(/^./, (str) => str.toUpperCase())}
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
                                      const hasHtmlTags = /<[^>]*>/g.test(
                                        stringValue,
                                      );

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
                          })}
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
                        dangerouslySetInnerHTML={{ __html: displayContent }}
                      />
                    ) : (
                      <pre className="whitespace-pre-wrap text-xs">
                        {JSON.stringify(parsedContent, null, 2)}
                      </pre>
                    );
                  } catch {
                    return (
                      <div>Error parsing content: {psychoNote.content}</div>
                    );
                  }
                })()}
              <div className="mt-3 text-xs text-gray-500">
                Last updated:{" "}
                {formatDate(psychoNote.updated_at || psychoNote.created_at)}
              </div>
            </div>
          </div>
        ) : showPsychotherapyNote ? (
          <div className="space-y-4">
            <div className="border rounded-lg">
              {psychoTemplate && (
                <SurveyPreview
                  content={psychoTemplate.content || ""}
                  mode="edit"
                  showInstructions={false}
                  title=""
                  type={psychoTemplate.type}
                  onComplete={handleSavePsychotherapyNote}
                  defaultAnswers={
                    psychoNote?.content
                      ? JSON.parse(psychoNote.content)
                      : undefined
                  }
                />
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleCancelPsychotherapyNote}>
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
                {psychoNote ? "Update" : "Save"}
              </Button>
            </div>
          </div>
        ) : !psychoNote && !isLoadingPsychoNote ? (
          <div className="text-center py-8 text-gray-400">
            No psychotherapy note recorded.
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
