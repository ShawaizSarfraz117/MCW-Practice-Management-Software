import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@mcw/ui";
import { X } from "lucide-react";
import React from "react";

interface DeleteLicenseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  trigger: React.ReactNode;
}

export default function DeleteLicenseModal({
  open,
  onOpenChange,
  onDelete,
  trigger,
}: DeleteLicenseModalProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent className="max-w-[400px] w-full p-6 rounded-xl">
        <button
          aria-label="Close"
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
          type="button"
          onClick={() => onOpenChange(false)}
        >
          <X className="w-5 h-5" />
        </button>
        <AlertDialogHeader>
          <AlertDialogTitle className="text-lg font-semibold text-gray-900 text-left">
            Delete License
          </AlertDialogTitle>
          <AlertDialogDescription className="text-gray-700 text-left mt-2">
            Are you sure you want to delete this license?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="mt-6 flex-row justify-end gap-2">
          <AlertDialogCancel className="px-4 py-2 rounded-md border border-gray-300 bg-white text-gray-700 hover:bg-gray-50">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-700"
            onClick={onDelete}
          >
            Delete License
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
