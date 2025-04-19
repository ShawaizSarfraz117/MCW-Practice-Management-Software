"use client";

import { useMutation } from "@tanstack/react-query";
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
  setClinicalInfoState: (clinicalInfoState: {
    speciality: string;
    taxonomy_code: string;
    NPI_number: number;
  }) => void;
}

export default function EditClinicianSidebar({
  isOpen,
  onClose,
  clinicalInfoState: defaultClinicalInfoState,
  setClinicalInfoState: defaultSetClinicalInfoState,
}: EditClinicianSidebarProps) {
  const [clinicalInfoState, setClinicalInfoState] = useState({
    speciality: defaultClinicalInfoState.speciality,
    taxonomy_code: defaultClinicalInfoState.taxonomy_code,
    NPI_number: defaultClinicalInfoState.NPI_number,
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
        taxonomyCode: clinicalInfoState.taxonomy_code,
        NPInumber: clinicalInfoState.NPI_number,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to update clinical information");
    }

    return response.json();
  };

  const { mutate } = useMutation({
    mutationFn: updateClinicalInfo,
    onSuccess: () => {
      // Optionally handle success (e.g., show a success message)
      console.log("Clinical information updated successfully");
      defaultSetClinicalInfoState(clinicalInfoState);
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialty
              </label>
              <select
                className="w-full border-gray-300 rounded-md shadow-sm"
                value={clinicalInfoState.speciality}
                onChange={(e) =>
                  setClinicalInfoState({
                    ...clinicalInfoState,
                    speciality: e.target.value,
                  })
                }
              >
                <option>Speciality 1</option>
                <option>Speciality 2</option>
                <option>Speciality 3</option>
                <option>Speciality 4</option>
                <option>Speciality 5</option>
                {/* Add more options */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxonomy code
              </label>
              <input
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
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NPI number
              </label>
              <input
                className="w-full border-gray-300 rounded-md shadow-sm"
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
          <button
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
