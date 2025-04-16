"use client";

import { X, Calendar } from "lucide-react";

interface AddLicenseSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddLicenseSidebar({
  isOpen,
  onClose,
}: AddLicenseSidebarProps) {
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License type
              </label>
              <select className="w-full border-gray-300 rounded-md shadow-sm">
                <option value="">None selected</option>
                {/* Add more options */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                License number
              </label>
              <input
                className="w-full border-gray-300 rounded-md shadow-sm"
                type="text"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expiration date
              </label>
              <div className="relative">
                <input
                  className="w-full border-gray-300 rounded-md shadow-sm pr-10"
                  placeholder="mm/dd/yyyy"
                  type="text"
                />
                <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State
              </label>
              <select className="w-full border-gray-300 rounded-md shadow-sm">
                <option value="">Select</option>
                {/* Add state options */}
              </select>
            </div>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="border-t p-4">
          <div className="space-y-4">
            <button
              className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
              onClick={onClose}
            >
              Save
            </button>
            <button className="w-full text-blue-600 text-sm font-medium">
              + Add another license
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
