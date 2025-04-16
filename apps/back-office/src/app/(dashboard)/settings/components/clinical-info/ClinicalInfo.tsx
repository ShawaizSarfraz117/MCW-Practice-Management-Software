"use client";

import { useState } from "react";
import { Info, PlayCircle } from "lucide-react";
import Link from "next/link";
import EditClinicianSidebar from "./EditClinicianSidebar";
import AddLicenseSidebar from "./AddLicenseSidebar";

export default function ClinicalInfo() {
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [isAddLicenseSidebarOpen, setIsAddLicenseSidebarOpen] = useState(false);

  return (
    <div className="relative w-full">
      {/* Video Link - Centered */}
      <div className="flex justify-center mb-8">
        <Link
          className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-700"
          href="#"
        >
          <PlayCircle className="w-4 h-4 mr-2" />
          Watch a quick video about Clinical info
        </Link>
      </div>

      {/* Pre-licensed clinician note */}
      <div className="bg-blue-50 p-4 rounded-md mb-8 flex items-start">
        <Info className="w-5 h-5 text-blue-600 mr-3 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-700">
          If you or someone in your practice is a pre-licensed clinician,{" "}
          <Link className="text-blue-600 hover:underline" href="#">
            add a supervisor as a team member
          </Link>
          .
        </p>
      </div>

      {/* Main Content */}
      <div className="space-y-8 w-full">
        {/* Clinician Details Section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-semibold text-gray-800">
              Clinician details
            </h2>
            <button
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
              onClick={() => setIsEditSidebarOpen(true)}
            >
              Edit
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Specialty
              </label>
              <div className="text-sm text-gray-800">
                Behavioral health therapy
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Taxonomy code
              </label>
              <div className="text-sm text-gray-800">101YM0800X</div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-2">
                NPI number
              </label>
              <input
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NPI number"
                type="text"
              />
            </div>
          </div>
        </div>

        {/* License Section */}
        <div>
          <h2 className="text-base font-semibold text-gray-800 mb-4">
            License and degree info
          </h2>
          <div className="border border-gray-200 rounded-lg p-6 text-center mb-4">
            <p className="text-sm text-gray-600">
              Add license type, number, expiration date, and state
            </p>
          </div>
          <button
            className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-700"
            onClick={() => setIsAddLicenseSidebarOpen(true)}
          >
            + Add license
          </button>
        </div>
      </div>

      {/* Sidebars */}
      <EditClinicianSidebar
        isOpen={isEditSidebarOpen}
        onClose={() => setIsEditSidebarOpen(false)}
      />
      <AddLicenseSidebar
        isOpen={isAddLicenseSidebarOpen}
        onClose={() => setIsAddLicenseSidebarOpen(false)}
      />

      {/* Overlay */}
      {(isEditSidebarOpen || isAddLicenseSidebarOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => {
            setIsEditSidebarOpen(false);
            setIsAddLicenseSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}
