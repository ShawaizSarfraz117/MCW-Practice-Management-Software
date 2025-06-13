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
import { SurveyContentDisplay } from "./SurveyContentDisplay";
import { formatDate, parseSurveyContent } from "../utils/noteParser";
import { useState, useEffect, useRef } from "react";
import type { SurveyPreviewRef } from "@mcw/ui";

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
  // Track if we're waiting for a save to complete
  const isSaving =
    createMutationStatus === "pending" || updateMutationStatus === "pending";
  const [fallbackTemplate, setFallbackTemplate] = useState<string | null>(null);
  const surveyRef = useRef<SurveyPreviewRef>(null);

  // Load fallback template if no database template exists
  useEffect(() => {
    if (!psychoTemplate && showPsychotherapyNote) {
      fetch("/surveys/psycho.json")
        .then((response) => response.json())
        .then((data) => {
          setFallbackTemplate(JSON.stringify(data));
        })
        .catch((error) => {
          console.error("Failed to load fallback template:", error);
          // Try the original physco.json as fallback
          fetch("/surveys/physco.json")
            .then((response) => response.json())
            .then((data) => {
              setFallbackTemplate(JSON.stringify(data));
            })
            .catch((err) => {
              console.error("Failed to load any fallback template:", err);
            });
        });
    }
  }, [psychoTemplate, showPsychotherapyNote]);
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
            <SurveyContentDisplay
              content={psychoNote.content}
              className="text-sm text-gray-700"
            />
            <div className="mt-3 text-xs text-gray-500">
              Last updated:{" "}
              {formatDate(psychoNote.updated_at || psychoNote.created_at)}
            </div>
          </div>
        ) : showPsychotherapyNote ? (
          <div className="space-y-4">
            <div className="border rounded-lg">
              {psychoTemplate || fallbackTemplate ? (
                <SurveyPreview
                  ref={surveyRef}
                  content={psychoTemplate?.content || fallbackTemplate || ""}
                  mode="edit"
                  showInstructions={false}
                  title=""
                  type={psychoTemplate?.type || "progress_notes"}
                  onComplete={(result) => {
                    handleSavePsychotherapyNote(result);
                  }}
                  defaultAnswers={
                    psychoNote?.content
                      ? parseSurveyContent(psychoNote.content) || undefined
                      : undefined
                  }
                />
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <p>Loading psychotherapy template...</p>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={handleCancelPsychotherapyNote}
                disabled={isSaving}
              >
                Cancel
              </Button>
              {!psychoTemplate && fallbackTemplate && (
                <p className="text-sm text-amber-600 mr-auto">
                  Preview mode: Create a "Physco" template to save notes.
                </p>
              )}
              {psychoTemplate && (
                <Button
                  type="button"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isSaving}
                  onClick={() => {
                    // Trigger form submission using the ref
                    surveyRef.current?.submit();
                  }}
                >
                  {isSaving ? "Saving..." : psychoNote ? "Update" : "Save"}
                </Button>
              )}
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
