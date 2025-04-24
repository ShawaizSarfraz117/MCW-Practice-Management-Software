"use client";

import { X, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useToast,
} from "@mcw/ui";

interface AddLicenseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export interface LicenseInfo {
  license_type: string;
  license_number: string;
  expiration_date: string;
  state: string;
}

export default function AddLicenseSidebar({
  isOpen,
  onClose,
}: AddLicenseSidebarProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [licenses, setLicenses] = useState<LicenseInfo[]>([
    { license_type: "", license_number: "", expiration_date: "", state: "" },
  ]);

  const handleAddLicense = () => {
    setLicenses([
      ...licenses,
      { license_type: "", license_number: "", expiration_date: "", state: "" },
    ]);
  };

  const handleChange = (
    index: number,
    field: keyof LicenseInfo,
    value: string,
  ) => {
    const updatedLicenses = [...licenses];
    updatedLicenses[index][field] = value;
    setLicenses(updatedLicenses);
  };

  const handleRemoveLicense = (index: number) => {
    const updatedLicenses = licenses.filter((_, i) => i !== index);
    setLicenses(updatedLicenses);
  };

  // Mutation to save licenses
  const mutation = useMutation({
    mutationFn: async (licenses: LicenseInfo[]) => {
      const response = await fetch("/api/license", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(licenses), // Send the licenses array
      });

      if (!response.ok) {
        const errorData = await response.json();
        toast({
          title: "Error saving licenses",
          description: errorData?.error,
          variant: "destructive",
        });
        throw new Error(errorData?.error);
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ["license"] });
      toast({
        title: "Licenses saved successfully",
        description: "Licenses have been saved successfully",
        variant: "success",
      });
      onClose(); // Close the sidebar after successful save
    },
    onError: (error: Error) => {
      console.error("Error saving licenses:", error);
    },
  });

  const handleSave = () => {
    mutation.mutate(licenses); // Call the mutation function with the licenses array
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
          <h2 className="text-lg font-medium">Add License</h2>
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
            {licenses?.map((license, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="block text-sm font-medium text-gray-700 mb-1">
                    License type
                  </Label>
                  <Button
                    className="text-red-600"
                    variant="ghost"
                    onClick={() => handleRemoveLicense(index)}
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <Select
                  value={license.license_type}
                  onValueChange={(value) =>
                    handleChange(index, "license_type", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select License Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Type 1">License type 1</SelectItem>
                    <SelectItem value="Type 2">License type 2</SelectItem>
                    <SelectItem value="Type 3">License type 3</SelectItem>
                    <SelectItem value="Type 4">License type 4</SelectItem>
                    <SelectItem value="Type 5">License type 5</SelectItem>
                  </SelectContent>
                </Select>

                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  License number
                </Label>
                <Input
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  type="text"
                  value={license.license_number}
                  onChange={(e) =>
                    handleChange(index, "license_number", e.target.value)
                  }
                />

                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration date
                </Label>
                <Input
                  required
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  min={new Date().toISOString().split("T")[0]}
                  pattern="\d{4}-\d{2}-\d{2}"
                  type="date"
                  value={license.expiration_date}
                  onChange={(e) =>
                    handleChange(index, "expiration_date", e.target.value)
                  }
                />

                <Label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </Label>
                <Select
                  value={license.state}
                  onValueChange={(value) => handleChange(index, "state", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="State 1">State 1</SelectItem>
                    <SelectItem value="State 2">State 2</SelectItem>
                    <SelectItem value="State 3">State 3</SelectItem>
                    <SelectItem value="State 4">State 4</SelectItem>
                    <SelectItem value="State 5">State 5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}

            <Button
              className="w-full text-blue-600 text-sm font-medium"
              variant="outline"
              onClick={handleAddLicense}
            >
              <PlusIcon className="w-4 h-4 mr-2" /> Add another license
            </Button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <Button
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 flex justify-center items-center"
            disabled={mutation.isPending}
            onClick={handleSave} // Call handleSave on button click
          >
            {mutation.isPending ? <>Saving...</> : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
}
