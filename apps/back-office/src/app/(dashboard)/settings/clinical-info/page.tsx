"use client";

import { useState } from "react";
import EditClinicianSidebar from "./components/EditClinicianSidebar";
import AddLicenseSidebar, { LicenseInfo } from "./components/AddLicenseSidebar";
import EditLicenseSidebar from "./components/EditLicenseSidebar";
import { Button, Input, Label } from "@mcw/ui";
import { useClinicalInfo, useLicenses } from "./hooks/useClinicalInfo";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default function ClinicalInfo() {
  const { clinicalInfo } = useClinicalInfo();
  const { licenses } = useLicenses();

  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [isAddLicenseSidebarOpen, setIsAddLicenseSidebarOpen] = useState(false);
  const [isEditLicenseSidebarOpen, setIsEditLicenseSidebarOpen] =
    useState(false);

  return (
    <div className="relative w-full">
      {/* Main Content */}
      <div className="space-y-8 w-full">
        {/* Clinician Details Section */}
        <div className="border border-gray-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-base font-semibold text-gray-800 mb-4">
              Clinical Info
            </h1>
            <Link
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                setIsEditSidebarOpen(true);
              }}
            >
              Edit
            </Link>
          </div>
          <div className="flex items-center h-[54px] rounded-[8px] bg-blue-50 border border-blue-100 px-4 py-2 text-sm text-blue-900">
            <svg
              className="w-4 h-4 text-blue-400 mr-2 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                clipRule="evenodd"
                d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-8-4a1 1 0 100 2 1 1 0 000-2zm2 8a1 1 0 10-2 0v-4a1 1 0 112 0v4z"
                fillRule="evenodd"
              />
            </svg>
            <span>
              If you or someone in your practice is a pre-licensed clinician,{" "}
              <a className="text-blue-600 hover:underline font-medium" href="#">
                add a supervisor as a team member
              </a>
              .
            </span>
          </div>
          <div className="grid grid-cols-2 gap-y-6 mt-4">
            <div>
              <Label className="block text-sm text-gray-600 mb-2">
                Specialty
              </Label>
              <div className="text-sm text-gray-800">
                {clinicalInfo?.speciality}
              </div>
            </div>
            <div>
              <Label className="block text-sm text-gray-600 mb-2">
                Taxonomy code
              </Label>
              <div className="text-sm text-gray-800">
                {clinicalInfo?.taxonomy_code}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="block text-sm text-gray-600 mb-2">
                NPI number
              </Label>
              <Input
                disabled
                className="w-[412px] border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NPI number"
                type="text"
                value={clinicalInfo?.NPI_number}
              />
            </div>
          </div>
        </div>

        {/* License Section */}
        <div>
          <div className="border border-gray-200 rounded-lg p-6 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-800">
                License and degree info
              </h2>
              {licenses?.length > 0 && (
                <Link
                  className="text-blue-600 text-sm font-medium hover:text-blue-700"
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsEditLicenseSidebarOpen(true);
                  }}
                >
                  Edit
                </Link>
              )}
            </div>
            <p className="text-sm text-gray-600">
              Add license type, number, expiration date, and state
            </p>
            {licenses?.length > 0 ? (
              <div className="overflow-x-auto mt-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        License Type
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        License Number
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        Expiration Date
                      </th>
                      <th
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        scope="col"
                      >
                        State
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Dynamically generated rows for licenses */}
                    {licenses?.map((license: LicenseInfo) => (
                      <tr key={license.license_number}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {license.license_type}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {license.license_number}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(
                              license.expiration_date,
                            ).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {license.state}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-sm text-gray-600 mt-4">No licenses added</p>
            )}
            <Button
              className="flex items-center text-[#188153] text-sm font-medium hover:text-[#188153] mt-5"
              variant="outline"
              onClick={() => setIsAddLicenseSidebarOpen(true)}
            >
              <PlusIcon className="w-4 h-4 mr-2" /> Add license
            </Button>
          </div>
        </div>
      </div>

      {/* Sidebars */}
      <EditClinicianSidebar
        clinicalInfoState={clinicalInfo}
        isOpen={isEditSidebarOpen}
        onClose={() => setIsEditSidebarOpen(false)}
      />
      <AddLicenseSidebar
        isOpen={isAddLicenseSidebarOpen}
        onClose={() => setIsAddLicenseSidebarOpen(false)}
      />
      <EditLicenseSidebar
        isOpen={isEditLicenseSidebarOpen}
        onClose={() => setIsEditLicenseSidebarOpen(false)}
        existingLicenses={licenses}
      />

      {/* Overlay */}
      {(isEditSidebarOpen ||
        isAddLicenseSidebarOpen ||
        isEditLicenseSidebarOpen) && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-40"
          onClick={() => {
            setIsEditSidebarOpen(false);
            setIsAddLicenseSidebarOpen(false);
            setIsEditLicenseSidebarOpen(false);
          }}
        />
      )}
    </div>
  );
}
