"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { Trash, X } from "lucide-react";
import { useState } from "react";
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

interface LicenseInfoEditProps {
  member: {
    id: string;
    license?: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    };
    clinicalInfoId?: number;
  };
  onSubmit: (data: {
    licenses: Array<{
      id?: number;
      license_type: string;
      license_number: string;
      expiration_date: string;
      state: string;
    }>;
    clinical_info_id: number;
  }) => void;
}

export default function LicenseInfoEdit({
  member,
  onSubmit,
}: LicenseInfoEditProps) {
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { mutate: _updateLicenseInfo } = useMutation({
    mutationFn: async (data: {
      license_type: string;
      license_number: string;
      expiration_date: string;
      state: string;
    }) => {
      const response = await fetch(`/api/clinician/${member.id}/license`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update license info");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "License information updated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update license information",
        variant: "destructive",
      });
    },
  });

  const { mutate: deleteLicenseMutation } = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/clinician/${member.id}/license`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete license");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "License deleted",
        description: "The license was deleted successfully.",
      });
      setShowDeleteModal(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete license",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!member.clinicalInfoId) return;
    const formData = new FormData(e.currentTarget);
    const data = {
      license_type: (formData.get("type") as string) || "",
      license_number: (formData.get("number") as string) || "",
      expiration_date: (formData.get("expirationDate") as string) || "",
      state: (formData.get("state") as string) || "",
    };
    _updateLicenseInfo(data);
    onSubmit({ licenses: [data], clinical_info_id: member.clinicalInfoId });
  };

  return (
    <>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <Label htmlFor="type">License Type</Label>
          <Select defaultValue={member.license?.type} name="type">
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select license type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LMFT">LMFT</SelectItem>
              <SelectItem value="LCSW">LCSW</SelectItem>
              <SelectItem value="LPC">LPC</SelectItem>
              <SelectItem value="PhD">PhD</SelectItem>
              <SelectItem value="PsyD">PsyD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="number">License Number</Label>
          <Input
            className="mt-1"
            defaultValue={member.license?.number}
            id="number"
            name="number"
            placeholder="Enter license number"
          />
        </div>
        <div>
          <Label htmlFor="expirationDate">Expiration Date</Label>
          <Input
            className="mt-1"
            defaultValue={member.license?.expirationDate}
            id="expirationDate"
            name="expirationDate"
            type="date"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Select defaultValue={member.license?.state} name="state">
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select state" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AL">Alabama</SelectItem>
              <SelectItem value="AK">Alaska</SelectItem>
              <SelectItem value="AZ">Arizona</SelectItem>
              {/* Add more states as needed */}
            </SelectContent>
          </Select>
        </div>
      </form>
      {/* Delete License Link */}
      <div className="flex justify-end mt-6">
        <AlertDialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
          <AlertDialogTrigger asChild>
            <button
              type="button"
              className="flex items-center text-red-600 hover:text-red-700 text-sm font-medium gap-1"
              onClick={() => setShowDeleteModal(true)}
            >
              <Trash className="w-4 h-4 mr-1" /> Delete
            </button>
          </AlertDialogTrigger>
          <AlertDialogContent className="max-w-[400px] w-full p-6 rounded-xl">
            <button
              type="button"
              aria-label="Close"
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 focus:outline-none"
              onClick={() => setShowDeleteModal(false)}
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
                onClick={() => deleteLicenseMutation()}
              >
                Delete License
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
