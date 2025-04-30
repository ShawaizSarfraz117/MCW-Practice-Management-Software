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
      if (
        !officeName ||
        !address.street ||
        !address.city ||
        !address.state ||
        !address.zip ||
        !selectedColor
      ) {
        toast({
          title: "Missing Required Fields",
          description: "Please fill in all required fields before saving.",
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
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="office-name"
                >
                  Office Name
                </Label>
                <input
                  className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  id="office-name"
                  type="text"
                  value={officeName}
                  onChange={(e) => setOfficeName(e.target.value)}
                />
              </div>

              {/* Location */}
              <LocationForm address={address} setAddress={setAddress} />

              {/* Color */}
              <ColorPicker
                selectedColor={selectedColor}
                onColorSelect={setSelectedColor}
              />
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
