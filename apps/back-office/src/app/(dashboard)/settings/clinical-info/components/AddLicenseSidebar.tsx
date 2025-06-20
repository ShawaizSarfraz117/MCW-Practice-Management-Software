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
                    <SelectItem value="MD">MD - Doctor of Medicine</SelectItem>
                    <SelectItem value="DO">
                      DO - Doctor of Osteopathic Medicine
                    </SelectItem>
                    <SelectItem value="PhD">
                      PhD - Doctor of Philosophy
                    </SelectItem>
                    <SelectItem value="PsyD">
                      PsyD - Doctor of Psychology
                    </SelectItem>
                    <SelectItem value="LCSW">
                      LCSW - Licensed Clinical Social Worker
                    </SelectItem>
                    <SelectItem value="LMFT">
                      LMFT - Licensed Marriage and Family Therapist
                    </SelectItem>
                    <SelectItem value="LPC">
                      LPC - Licensed Professional Counselor
                    </SelectItem>
                    <SelectItem value="LPCC">
                      LPCC - Licensed Professional Clinical Counselor
                    </SelectItem>
                    <SelectItem value="NP">NP - Nurse Practitioner</SelectItem>
                    <SelectItem value="PA">PA - Physician Assistant</SelectItem>
                    <SelectItem value="RN">RN - Registered Nurse</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
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
                    <SelectItem value="AL">Alabama</SelectItem>
                    <SelectItem value="AK">Alaska</SelectItem>
                    <SelectItem value="AZ">Arizona</SelectItem>
                    <SelectItem value="AR">Arkansas</SelectItem>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="CO">Colorado</SelectItem>
                    <SelectItem value="CT">Connecticut</SelectItem>
                    <SelectItem value="DE">Delaware</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                    <SelectItem value="GA">Georgia</SelectItem>
                    <SelectItem value="HI">Hawaii</SelectItem>
                    <SelectItem value="ID">Idaho</SelectItem>
                    <SelectItem value="IL">Illinois</SelectItem>
                    <SelectItem value="IN">Indiana</SelectItem>
                    <SelectItem value="IA">Iowa</SelectItem>
                    <SelectItem value="KS">Kansas</SelectItem>
                    <SelectItem value="KY">Kentucky</SelectItem>
                    <SelectItem value="LA">Louisiana</SelectItem>
                    <SelectItem value="ME">Maine</SelectItem>
                    <SelectItem value="MD">Maryland</SelectItem>
                    <SelectItem value="MA">Massachusetts</SelectItem>
                    <SelectItem value="MI">Michigan</SelectItem>
                    <SelectItem value="MN">Minnesota</SelectItem>
                    <SelectItem value="MS">Mississippi</SelectItem>
                    <SelectItem value="MO">Missouri</SelectItem>
                    <SelectItem value="MT">Montana</SelectItem>
                    <SelectItem value="NE">Nebraska</SelectItem>
                    <SelectItem value="NV">Nevada</SelectItem>
                    <SelectItem value="NH">New Hampshire</SelectItem>
                    <SelectItem value="NJ">New Jersey</SelectItem>
                    <SelectItem value="NM">New Mexico</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="NC">North Carolina</SelectItem>
                    <SelectItem value="ND">North Dakota</SelectItem>
                    <SelectItem value="OH">Ohio</SelectItem>
                    <SelectItem value="OK">Oklahoma</SelectItem>
                    <SelectItem value="OR">Oregon</SelectItem>
                    <SelectItem value="PA">Pennsylvania</SelectItem>
                    <SelectItem value="RI">Rhode Island</SelectItem>
                    <SelectItem value="SC">South Carolina</SelectItem>
                    <SelectItem value="SD">South Dakota</SelectItem>
                    <SelectItem value="TN">Tennessee</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="UT">Utah</SelectItem>
                    <SelectItem value="VT">Vermont</SelectItem>
                    <SelectItem value="VA">Virginia</SelectItem>
                    <SelectItem value="WA">Washington</SelectItem>
                    <SelectItem value="WV">West Virginia</SelectItem>
                    <SelectItem value="WI">Wisconsin</SelectItem>
                    <SelectItem value="WY">Wyoming</SelectItem>
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
