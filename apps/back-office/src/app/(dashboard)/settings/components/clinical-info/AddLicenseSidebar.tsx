"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";

interface AddLicenseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  setLicenseState: (licenses: LicenseInfo[]) => void; // Change here
  licenseState: LicenseInfo[];
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
  setLicenseState,
  licenseState,
}: AddLicenseSidebarProps) {
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
        throw new Error("Failed to save licenses");
      }

      return response.json();
    },
    onSuccess: () => {
      console.log("Licenses saved successfully");
      setLicenseState([...licenseState, ...licenses]);
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
          <button
            className="p-2 hover:bg-gray-100 rounded-full"
            onClick={onClose}
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            {licenses.map((license, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License type
                  </label>
                  <button
                    className="text-red-600"
                    onClick={() => handleRemoveLicense(index)}
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={license.license_type}
                  onChange={(e) =>
                    handleChange(index, "license_type", e.target.value)
                  }
                >
                  <option value="">Select License Type</option>
                  <option value="Type 1">License type 1</option>
                  <option value="Type 2">License type 2</option>
                  <option value="Type 3">License type 3</option>
                  <option value="Type 4">License type 4</option>
                  <option value="Type 5">License type 5</option>
                </select>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  License number
                </label>
                <input
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  type="text"
                  value={license.license_number}
                  onChange={(e) =>
                    handleChange(index, "license_number", e.target.value)
                  }
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Expiration date
                </label>
                <input
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  type="date"
                  value={license.expiration_date}
                  min={new Date().toISOString().split("T")[0]} // Set minimum date to today
                  onChange={(e) =>
                    handleChange(index, "expiration_date", e.target.value)
                  }
                />

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State
                </label>
                <select
                  className="w-full border-gray-300 rounded-md shadow-sm"
                  value={license.state}
                  onChange={(e) => handleChange(index, "state", e.target.value)}
                >
                  <option value="">Select State</option>
                  <option value="State 1">State 1</option>
                  <option value="State 2">State 2</option>
                  <option value="State 3">State 3</option>
                  <option value="State 4">State 4</option>
                  <option value="State 5">State 5</option>
                </select>
              </div>
            ))}

            <button
              className="w-full text-blue-600 text-sm font-medium"
              onClick={handleAddLicense}
            >
              + Add another license
            </button>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <button
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            onClick={handleSave} // Call handleSave on button click
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
