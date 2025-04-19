"use client";

import { useEffect, useState } from "react";
import EditClinicianSidebar from "./EditClinicianSidebar";
import AddLicenseSidebar from "./AddLicenseSidebar";
import { useQuery } from "@tanstack/react-query";

interface LicenseInfo {
  license_number: string; // License number as a string
  expiration_date: string; // Expiration date as a string (consider using Date if you want to handle dates)
  state: string; // State as a string
  license_type: string; // License type as a string
}

export default function ClinicalInfo() {
  const [isEditSidebarOpen, setIsEditSidebarOpen] = useState(false);
  const [isAddLicenseSidebarOpen, setIsAddLicenseSidebarOpen] = useState(false);
  const [licenseState, setLicenseState] = useState<LicenseInfo[]>([]);

  const { data: clinicalInfo } = useQuery({
    queryKey: ["clinicalInfo"],
    queryFn: () => fetch("/api/clinicalInfo").then((res) => res.json()),
  });
  const { data: licenses } = useQuery({
    queryKey: ["license"],
    queryFn: () => fetch("/api/license").then((res) => res.json()),
  });
  const [clinicalInfoState, setClinicalInfoState] = useState({
    speciality: "N/A",
    taxonomy_code: "N/A",
    NPI_number: 0,
  });

  useEffect(() => {
    if (clinicalInfo) {
      setClinicalInfoState({
        speciality: clinicalInfo.speciality,
        taxonomy_code: clinicalInfo.taxonomy_code,
        NPI_number: clinicalInfo.NPI_number,
      });
    }
  }, [clinicalInfo]);

  useEffect(() => {
    if (licenses) {
      setLicenseState(licenses);
    }
  }, [licenses]);

  return (
    <div className="relative w-full">
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
                {clinicalInfoState.speciality}
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">
                Taxonomy code
              </label>
              <div className="text-sm text-gray-800">
                {clinicalInfoState.taxonomy_code}
              </div>
            </div>
            <div className="col-span-2">
              <label className="block text-sm text-gray-600 mb-2">
                NPI number
              </label>
              <input
                disabled
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter NPI number"
                type="text"
                value={clinicalInfoState.NPI_number}
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
          {licenseState.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      License Type
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      License Number
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      Expiration Date
                    </th>
                    <th
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      State
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {/* Dynamically generated rows for licenses */}
                  {licenseState.map((license) => (
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
            <p className="text-sm text-gray-600">No licenses added</p>
          )}
          <button
            className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-700 mt-5"
            onClick={() => setIsAddLicenseSidebarOpen(true)}
          >
            + Add license
          </button>
        </div>
      </div>

      {/* Sidebars */}
      <EditClinicianSidebar
        clinicalInfoState={clinicalInfoState}
        isOpen={isEditSidebarOpen}
        setClinicalInfoState={setClinicalInfoState}
        onClose={() => setIsEditSidebarOpen(false)}
      />
      <AddLicenseSidebar
        isOpen={isAddLicenseSidebarOpen}
        onClose={() => setIsAddLicenseSidebarOpen(false)}
        setLicenseState={setLicenseState}
        licenseState={licenseState}
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
