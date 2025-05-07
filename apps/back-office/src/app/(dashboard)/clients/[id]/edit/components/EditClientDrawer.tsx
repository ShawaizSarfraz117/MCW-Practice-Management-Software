"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle, Button } from "@mcw/ui";
import { X } from "lucide-react";
import { ClientFormValues } from "../types";
import { EditClientForm } from "./EditClientForm";
import { useState } from "react";
import { ClientMembership } from "./ClientEdit";

interface EditClientDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  clientData?: ClientMembership | null;
  onSave: (data: ClientFormValues) => Promise<void>;
  title?: string;
}

export function EditClientDrawer({
  isOpen,
  onClose,
  clientData,
  onSave,
  title = "Create New Contact",
}: EditClientDrawerProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleSave = async (data: ClientFormValues) => {
    setIsSubmitting(true);
    await onSave(data);
    onClose();
    setIsSubmitting(false);
  };

  // Prevent drawer from auto-closing on click events within form
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      onClose();
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent
        className="w-full sm:max-w-md p-0 overflow-hidden [&>button]:hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-3 border-b flex flex-row items-center justify-between">
            <div className="flex items-center">
              <Button
                className="mr-2"
                size="icon"
                variant="ghost"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
              <SheetTitle>{title}</SheetTitle>
            </div>
            <Button
              className="bg-[#2c8466] hover:bg-[#206e52]"
              form="client-edit-form"
              size="sm"
              type="submit"
              disabled={isSubmitting}
            >
              Save
            </Button>
          </SheetHeader>

          <div className="overflow-y-auto flex-1 h-full">
            <EditClientForm clientData={clientData} onSave={handleSave} />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
