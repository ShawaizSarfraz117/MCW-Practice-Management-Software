"use client";

import { useEffect, useState } from "react";
import EditClinicianSidebar from "./EditClinicianSidebar";
import AddLicenseSidebar, { LicenseInfo } from "./AddLicenseSidebar";
import { useQuery } from "@tanstack/react-query";
import { Button, Input, Label } from "@mcw/ui";

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
            <h1 className="text-2xl font-semibold text-gray-800">
              Clinical Info
            </h1>
            <Button
              className="text-blue-600 text-sm font-medium hover:text-blue-700"
              variant="outline"
              onClick={() => setIsEditSidebarOpen(true)}
            >
              Edit
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-6">
            <div>
              <Label className="block text-sm text-gray-600 mb-2">
                Specialty
              </Label>
              <div className="text-sm text-gray-800">
                {clinicalInfoState.speciality}
              </div>
            </div>
            <div>
              <Label className="block text-sm text-gray-600 mb-2">
                Taxonomy code
              </Label>
              <div className="text-sm text-gray-800">
                {clinicalInfoState.taxonomy_code}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="block text-sm text-gray-600 mb-2">
                NPI number
              </Label>
              <Input
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
          <Button
            className="flex items-center text-blue-600 text-sm font-medium hover:text-blue-700 mt-5"
            variant="outline"
            onClick={() => setIsAddLicenseSidebarOpen(true)}
          >
            + Add license
          </Button>
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
        licenseState={licenseState}
        setLicenseState={setLicenseState}
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
