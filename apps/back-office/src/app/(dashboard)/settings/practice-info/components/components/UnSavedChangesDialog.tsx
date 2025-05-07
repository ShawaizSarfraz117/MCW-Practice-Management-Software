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
import React from "react";

interface UnSavedChangesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
}

const UnSavedChangesDialog: React.FC<UnSavedChangesDialogProps> = ({
  open,
  onOpenChange,
  onDiscard,
  onSave,
}) => (
  <AlertDialog open={open} onOpenChange={onOpenChange}>
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
        <AlertDialogDescription>
          You have unsaved changes. Do you want to save them before closing?
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={onDiscard}>Discard</AlertDialogCancel>
        <AlertDialogAction onClick={onSave}>Save</AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialog>
);

export default UnSavedChangesDialog;
