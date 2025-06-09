"use client";
import { useState } from "react";
import { Button, Label, toast, Input, useForm } from "@mcw/ui";
import {
  TelehealthFormProps,
  TelehealthFormValues,
  useTeleHealthInfo,
} from "../hooks/usePracticeInformation";
import LocationForm from "./LocationForm";
import ColorPicker from "./ColorPicker";
import { X } from "lucide-react";
import UnSavedChangesDialog from "./UnSavedChangesDialog";

export default function TelehealthForm({ onClose }: TelehealthFormProps) {
  const { teleHealthInfo, updateTeleHealthLocation, isUpdating } =
    useTeleHealthInfo();

  const form = useForm<TelehealthFormValues>({
    defaultValues: {
      officeName: teleHealthInfo?.location?.name || "",
      street: teleHealthInfo?.location?.street || "",
      city: teleHealthInfo?.location?.city || "",
      state: teleHealthInfo?.location?.state || "",
      zip: teleHealthInfo?.location?.zip || "",
      color: teleHealthInfo?.location?.color || "",
    },
    onSubmit: async ({ value }: { value: TelehealthFormValues }) => {
      if (!teleHealthInfo?.location?.id) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields before saving.",
          variant: "destructive",
        });
        return;
      }
      updateTeleHealthLocation({
        locationId: teleHealthInfo.location.id,
        name: value.officeName,
        address: [value.street, value.city, value.state, value.zip]
          .filter(Boolean)
          .join(" "),
        city: value.city,
        state: value.state,
        zip: value.zip,
        color: value.color,
        street: value.street,
      });
      onClose();
    },
    validate: {},
  });

  // Track unsaved changes
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const initialValues = form.state.values;
  const hasChanges = Object.keys(form.state.values).some(
    (key) =>
      form.state.values[key as keyof TelehealthFormValues] !==
      initialValues[key as keyof TelehealthFormValues],
  );

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      aria-labelledby="telehealth-dialog-title"
      aria-modal="true"
      className="fixed inset-0 bg-black/50 z-50"
      role="dialog"
    >
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="h-full flex flex-col">
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium" id="telehealth-dialog-title">
              Edit Telehealth Office
            </h2>
            <Button
              className="rounded-full"
              size="icon"
              variant="ghost"
              onClick={handleClose}
            >
              <X className="h-5 w-5 text-gray-500" />
              <span className="sr-only">Close</span>
            </Button>
          </div>
          <form
            className="flex-1 overflow-y-auto p-4 space-y-4"
            onSubmit={form.handleSubmit}
          >
            {/* Office Name */}
            <div className="space-y-2">
              <Label
                className="flex items-center text-sm font-medium text-gray-700"
                htmlFor="office-name"
              >
                Office Name
                <span className="text-red-500 ml-1">*</span>
              </Label>
              {form.Field({
                name: "officeName",
                children: (field) => (
                  <>
                    <Input
                      className={`w-full ${field.state.meta.errors?.[0] ? "border-red-500" : "border-gray-300"}`}
                      id="office-name"
                      type="text"
                      value={field.state.value as string}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {field.state.meta.errors?.[0] && (
                      <p className="text-sm text-red-500">
                        {field.state.meta.errors?.[0]}
                      </p>
                    )}
                  </>
                ),
              })}
            </div>

            {/* Location */}
            <LocationForm
              form={form as unknown as ReturnType<typeof useForm>}
            />

            <ColorPicker form={form as unknown as ReturnType<typeof useForm>} />

            {/* Color */}

            <div className="p-4 border-t flex justify-between">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isUpdating || !teleHealthInfo?.location?.id}
                type="submit"
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>

            <UnSavedChangesDialog
              open={showConfirmDialog}
              onDiscard={onClose}
              onOpenChange={setShowConfirmDialog}
              onSave={form.handleSubmit}
            />
          </form>
        </div>
      </div>
    </div>
  );
}
