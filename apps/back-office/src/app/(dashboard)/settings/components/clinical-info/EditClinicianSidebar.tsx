"use client";

import { X } from "lucide-react";

interface EditClinicianSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EditClinicianSidebar({
  isOpen,
  onClose,
}: EditClinicianSidebarProps) {
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
              <select className="w-full border-gray-300 rounded-md shadow-sm">
                <option>Behavioral health therapy</option>
                {/* Add more options */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxonomy code
              </label>
              <input
                readOnly
                className="w-full border-gray-300 rounded-md shadow-sm bg-gray-50"
                type="text"
                value="101YM0800X"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                NPI number
              </label>
              <input
                className="w-full border-gray-300 rounded-md shadow-sm"
                placeholder="Enter NPI number"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <button
            className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
            onClick={onClose}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
