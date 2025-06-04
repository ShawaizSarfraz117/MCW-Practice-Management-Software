"use client";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  toast,
} from "@mcw/ui";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";
import { useState } from "react";

interface EditClinicianSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  clinicalInfoState: {
    speciality: string;
    taxonomy_code: string;
    NPI_number: number;
  };
}

export default function EditClinicianSidebar({
  isOpen,
  onClose,
  clinicalInfoState: defaultClinicalInfoState,
}: EditClinicianSidebarProps) {
  const queryClient = useQueryClient();
  const [clinicalInfoState, setClinicalInfoState] = useState({
    speciality: defaultClinicalInfoState?.speciality,
    taxonomy_code: defaultClinicalInfoState?.taxonomy_code,
    NPI_number: defaultClinicalInfoState?.NPI_number,
  });

  // Function to update clinical info
  const updateClinicalInfo = async () => {
    const response = await fetch("/api/clinicalInfo", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        speciality: clinicalInfoState.speciality,
        taxonomy_code: clinicalInfoState.taxonomy_code,
        NPI_number: clinicalInfoState.NPI_number?.toString() ?? null,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      toast({
        title: "Error updating clinical information",
        description: errorData?.error,
        variant: "destructive",
      });
      throw new Error(errorData?.error);
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: updateClinicalInfo,
    onSuccess: () => {
      // Optionally handle success (e.g., show a success message)
      queryClient.refetchQueries({ queryKey: ["clinicalInfo"] });
      console.log("Clinical information updated successfully");
      toast({
        title: "Clinical information updated successfully",
        description: "Clinical information has been updated successfully",
        variant: "success",
      });
      onClose(); // Close the sidebar after successful update
    },
    onError: (error) => {
      // Optionally handle error (e.g., show an error message)
      console.error("Error updating clinical information:", error);
    },
  });

  const handleSave = () => {
    mutate(); // Call the mutation function on save button click
  };

  return (
    <div
      className={`fixed inset-y-0 right-0 w-96 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
        isOpen ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="h-full flex flex-col">
        {/* Sidebar Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-medium">Edit clinician details</h2>
          <Button
            className="p-2 hover:bg-gray-100 rounded-full"
            variant="ghost"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-500" />
          </Button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </Label>
              <Select
                value={clinicalInfoState.speciality}
                onValueChange={(value) =>
                  setClinicalInfoState({
                    ...clinicalInfoState,
                    speciality: value,
                  })
                }
              >
                <SelectTrigger className="rounded-none">
                  <SelectValue placeholder={"Select speciality"} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Speciality 1">Speciality 1</SelectItem>
                  <SelectItem value="Speciality 2">Speciality 2</SelectItem>
                  <SelectItem value="Speciality 3">Speciality 3</SelectItem>
                  <SelectItem value="Speciality 4">Speciality 4</SelectItem>
                  <SelectItem value="Speciality 5">Speciality 5</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                Taxonomy code
              </Label>
              <Input
                className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                type="text"
                value={clinicalInfoState.taxonomy_code}
                onChange={(e) =>
                  setClinicalInfoState({
                    ...clinicalInfoState,
                    taxonomy_code: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <Label className="block text-sm font-medium text-gray-700 mb-1">
                NPI number
              </Label>
              <Input
                className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                placeholder="Enter NPI number"
                type="number"
                value={clinicalInfoState.NPI_number}
                onChange={(e) =>
                  setClinicalInfoState({
                    ...clinicalInfoState,
                    NPI_number: parseInt(e.target.value),
                  })
                }
              />
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <Button
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            onClick={handleSave}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
