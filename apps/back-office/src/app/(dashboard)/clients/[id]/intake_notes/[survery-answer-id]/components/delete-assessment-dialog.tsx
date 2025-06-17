"use client";

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

interface DeleteAssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentName: string;
  clientName: string;
  assessmentDate: string;
  isPending: boolean;
  onConfirm: () => void;
}

export function DeleteAssessmentDialog({
  open,
  onOpenChange,
  assessmentName,
  clientName,
  assessmentDate,
  isPending,
  onConfirm,
}: DeleteAssessmentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Assessment</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete this{" "}
            <strong>{assessmentName}</strong> assessment for{" "}
            <strong>{clientName}</strong>?
            <br />
            <br />
            This action cannot be undone and will permanently remove:
            <br />• All survey responses and scores
            <br />• Assessment date: {assessmentDate}
            <br />• Any associated notes or data
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? "Deleting..." : "Delete Assessment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
