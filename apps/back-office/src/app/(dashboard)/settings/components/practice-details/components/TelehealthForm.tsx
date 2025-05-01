"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Label,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  toast,
  Input,
} from "@mcw/ui";
import { PracticeInformation } from "@/types/profile";
import { useTeleHealthInfo } from "../hooks/usePracticeInformation";
import LocationForm from "./LocationForm";
import ColorPicker from "./ColorPicker";
import { X } from "lucide-react";

interface TelehealthFormProps {
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
  onClose: () => void;
}

export default function TelehealthForm({ onClose }: TelehealthFormProps) {
  const { teleHealthInfo, updateTeleHealthLocation, isUpdating } =
    useTeleHealthInfo();
  const [officeName, setOfficeName] = useState(teleHealthInfo?.location?.name);
  const [address, setAddress] = useState({
    city: teleHealthInfo?.location?.city || "",
    state: teleHealthInfo?.location?.state || "",
    zip: teleHealthInfo?.location?.zip || "",
    street: teleHealthInfo?.location?.street || "",
  });
  const [selectedColor, setSelectedColor] = useState(
    teleHealthInfo?.location?.color || "",
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [errors, setErrors] = useState({
    officeName: false,
    street: false,
    city: false,
    state: false,
    zip: false,
    color: false,
  });

  // Track changes
  useEffect(() => {
    const isNameChanged = officeName !== (teleHealthInfo?.location?.name || "");
    const isAddressChanged =
      address.street !== (teleHealthInfo?.location?.street || "") ||
      address.city !== (teleHealthInfo?.location?.city || "") ||
      address.state !== (teleHealthInfo?.location?.state || "") ||
      address.zip !== (teleHealthInfo?.location?.zip || "");
    const isColorChanged =
      selectedColor !== (teleHealthInfo?.location?.color || "");
    setHasChanges(isNameChanged || isAddressChanged || isColorChanged);
  }, [officeName, address, selectedColor, teleHealthInfo]);

  const handleClose = () => {
    if (hasChanges) {
      setShowConfirmDialog(true);
    } else {
      onClose();
    }
  };

  const submit = () => {
    if (teleHealthInfo?.location?.id) {
      const newErrors = {
        officeName: !officeName?.trim(),
        street: !address.street.trim(),
        city: !address.city.trim(),
        state: !address.state.trim(),
        zip: !address.zip.trim() || !/^\d{5}(-\d{4})?$/.test(address.zip),
        color: !selectedColor,
      };

      setErrors(newErrors);

      if (Object.values(newErrors).some(Boolean)) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields before saving.",
          variant: "destructive",
        });
        return;
      }

      updateTeleHealthLocation({
        locationId: teleHealthInfo.location.id,
        name: officeName || "",
        address:
          address.street +
          " " +
          address.city +
          " " +
          address.state +
          " " +
          address.zip,
        city: address.city,
        state: address.state,
        zip: address.zip,
        color: selectedColor,
        street: address.street,
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50">
      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-lg transform transition-transform duration-300 ease-in-out translate-x-0">
        <div className="h-full flex flex-col">
          {/* Dialog Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="text-lg font-medium">Edit Telehealth Office</h2>
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
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Office Name */}
              <div className="space-y-2">
                <Label
                  className="flex items-center text-sm font-medium text-gray-700"
                  htmlFor="office-name"
                >
                  Office Name
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <Input
                  className={`w-full ${errors.officeName ? "border-red-500" : "border-gray-300"}`}
                  id="office-name"
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                />
                {errors.officeName && (
                  <p className="text-sm text-red-500">
                    Office name is required
                  </p>
                )}
              </div>

              {/* Location */}
              <LocationForm
                address={address}
                setAddress={setAddress}
                errors={{
                  street: errors.street,
                  city: errors.city,
                  state: errors.state,
                  zip: errors.zip,
                }}
              />

              {/* Color */}
              <div className="space-y-2">
                <Label className="flex items-center text-sm font-medium text-gray-700">
                  Color
                  <span className="text-red-500 ml-1">*</span>
                </Label>
                <ColorPicker
                  selectedColor={selectedColor}
                  onColorSelect={setSelectedColor}
                />
                {errors.color && (
                  <p className="text-sm text-red-500">Color is required</p>
                )}
              </div>
            </div>

            <div className="p-4 border-t flex justify-between">
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                disabled={isUpdating || !teleHealthInfo?.location?.id}
                onClick={submit}
              >
                {isUpdating ? "Saving..." : "Save"}
              </Button>
            </div>

            <AlertDialog
              open={showConfirmDialog}
              onOpenChange={setShowConfirmDialog}
            >
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Unsaved Changes</AlertDialogTitle>
                  <AlertDialogDescription>
                    You have unsaved changes. Do you want to save them before
                    closing?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel onClick={() => onClose()}>
                    Discard
                  </AlertDialogCancel>
                  <AlertDialogAction onClick={submit}>Save</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        </div>
      </div>
    </div>
  );
}
