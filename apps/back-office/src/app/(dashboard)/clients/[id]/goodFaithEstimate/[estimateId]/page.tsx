"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@mcw/ui";
import { useParams, useRouter } from "next/navigation";
import { fetchGoodFaithEstimate } from "@/(dashboard)/clients/services/client.service";
import { format } from "date-fns";
import Loading from "@/components/Loading";

interface GoodFaithEstimateData {
  id: string;
  clinician_id: string;
  clinician_npi: string;
  clinician_tin: string;
  clinician_location_id: string;
  contact_person_id: string | null;
  clinician_phone: string;
  clinician_email: string;
  provided_date: string;
  expiration_date: string;
  service_start_date: string;
  service_end_date: string;
  total_cost: number;
  notes: string;
  GoodFaithClients: Array<{
    id: string;
    client_id: string;
    good_faith_id: string;
    name: string;
    dob: string;
    address: string;
    city: string;
    state: string;
    zip_code: string;
    phone: string;
    email: string;
    should_voice: boolean;
    should_text: boolean;
    should_email: boolean;
    Client: {
      id: string;
      legal_first_name: string;
      legal_last_name: string;
      date_of_birth: string;
    };
  }>;
  GoodFaithServices: Array<{
    id: string;
    good_faith_id: string;
    service_id: string;
    diagnosis_id: string;
    location_id: string;
    quantity: number;
    fee: number;
    PracticeService: {
      id: string;
      type: string;
      rate: string;
      code: string;
      description: string;
      duration: number;
    };
    Diagnosis: {
      id: string;
      code: string;
      description: string;
    };
    Location: {
      id: string;
      name: string;
      address: string;
    };
  }>;
  Clinician: {
    id: string;
    address: string;
    first_name: string;
    last_name: string;
  };
  Location: {
    id: string;
    name: string;
    address: string;
  };
}

export default function GoodFaithEstimate() {
  const params = useParams();
  const router = useRouter();
  const [goodFaithEstimate, setGoodFaithEstimate] =
    useState<GoodFaithEstimateData | null>(null);

  useEffect(() => {
    const fetchGoodFaithEstimateData = async () => {
      if (params.estimateId) {
        const data = (await fetchGoodFaithEstimate(
          params.estimateId as string,
        )) as GoodFaithEstimateData;
        setGoodFaithEstimate(data);
      }
    };
    fetchGoodFaithEstimateData();
  }, [params]);

  if (!goodFaithEstimate) {
    return <Loading />;
  }

  const handleEdit = () => {
    router.push(
      `/clients/${params.id}/goodFaithEstimate/${params.estimateId}/edit`,
    );
  };

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h2 className="text-xl font-semibold mt-6 mb-2">
            Good Faith Estimate
          </h2>
          <div className="text-sm text-gray-600 mb-4">
            Under the No Surprises Act, practitioners must provide an estimate
            of treatment costs.{" "}
            <a className="text-[#2d8467] hover:underline" href="#">
              Learn about Good Faith Estimates
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            className="h-8 w-8"
            size="icon"
            variant="outline"
            onClick={handleEdit}
          >
            <span className="sr-only">Edit</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </Button>
          <Button className="h-8 w-8" size="icon" variant="outline">
            <span className="sr-only">Print</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M6 9V2h12v7M6 18h12v4H6v-4z"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </Button>
          <Button className="h-8 w-8" size="icon" variant="outline">
            <span className="sr-only">Download</span>
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
              />
            </svg>
          </Button>
          <Button className="bg-[#2d8467] hover:bg-[#236c53] text-white">
            Share
          </Button>
        </div>
      </div>

      {/* Good Faith Estimate Card */}
      <div className="border border-gray-300 rounded-lg bg-white">
        {/* Client and Provider Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-300">
          {/* Client Section */}
          <div className="p-6 border-r border-gray-300">
            <h3 className="font-semibold text-gray-900 mb-4">
              {goodFaithEstimate.GoodFaithClients.length > 1
                ? "Clients"
                : "Client"}
            </h3>

            {goodFaithEstimate.GoodFaithClients.map((client, index) => (
              <div key={client.id}>
                {/* Add separator line for second client and beyond */}
                {index > 0 && (
                  <div className="border-t border-gray-200 pt-6 mt-6" />
                )}

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Name</div>
                  <div className="text-sm">{client.name}</div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Date of birth
                  </div>
                  <div className="text-sm">
                    {format(new Date(client.dob), "MMMM dd, yyyy")}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Address</div>
                  <div className="text-sm">
                    {client.address && `${client.address}`}
                    {client.city && client.address && ", "}
                    {client.city && `${client.city}`}
                    {client.state && (client.city || client.address) && ", "}
                    {client.state && `${client.state}`}
                    {client.zip_code &&
                      (client.state || client.city || client.address) &&
                      " "}
                    {client.zip_code && `${client.zip_code}`}
                    {!client.address &&
                      !client.city &&
                      !client.state &&
                      !client.zip_code &&
                      "Not provided"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Contact information
                  </div>
                  <div className="text-sm">
                    {client.phone && <div>Phone: {client.phone}</div>}
                    {client.email && <div>Email: {client.email}</div>}
                    {!client.phone && !client.email && "Not provided"}
                  </div>
                </div>

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">
                    Contact permissions
                  </div>
                  <div className="text-sm">
                    {client.should_voice && <div>✓ Voice calls</div>}
                    {client.should_text && <div>✓ Text messages</div>}
                    {client.should_email && <div>✓ Email</div>}
                    {!client.should_voice &&
                      !client.should_text &&
                      !client.should_email &&
                      "No permissions granted"}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Provider Section */}
          <div className="p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Provider</h3>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Name</div>
              <div className="text-sm">
                {goodFaithEstimate.Clinician.first_name}{" "}
                {goodFaithEstimate.Clinician.last_name}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm text-gray-600 mb-1">NPI</div>
                <div className="text-sm">{goodFaithEstimate.clinician_npi}</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">TIN</div>
                <div className="text-sm">{goodFaithEstimate.clinician_tin}</div>
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Address</div>
              <div className="text-sm">
                {goodFaithEstimate.Location.address}
              </div>
            </div>

            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-1">Contact person</div>
              <div className="text-sm">
                {goodFaithEstimate.Clinician.first_name}{" "}
                {goodFaithEstimate.Clinician.last_name}
                {goodFaithEstimate.clinician_phone && (
                  <>
                    <br />
                    {goodFaithEstimate.clinician_phone}
                  </>
                )}
                {goodFaithEstimate.clinician_email && (
                  <>
                    <br />
                    {goodFaithEstimate.clinician_email}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Service Details Section */}
        <div className="p-6">
          <h3 className="font-semibold text-gray-900 mb-4">
            Details of services and items for{" "}
            {goodFaithEstimate.GoodFaithClients.map((c) => c.name).join(" & ")}
          </h3>

          <div className="grid grid-cols-3 gap-8 mb-6">
            <div>
              <div className="text-sm text-gray-600 mb-1">Date provided</div>
              <div className="text-sm">
                {format(
                  new Date(goodFaithEstimate.provided_date),
                  "MMM d, yyyy",
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Expiration date</div>
              <div className="text-sm">
                {format(
                  new Date(goodFaithEstimate.expiration_date),
                  "MMM d, yyyy",
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">Service dates</div>
              <div className="text-sm">
                {format(
                  new Date(goodFaithEstimate.service_start_date),
                  "MMM d, yyyy",
                )}{" "}
                -{" "}
                {format(
                  new Date(goodFaithEstimate.service_end_date),
                  "MMM d, yyyy",
                )}
              </div>
            </div>
          </div>

          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-1">Diagnosis codes</div>
            <div className="text-sm">
              {goodFaithEstimate.GoodFaithServices.map(
                (service) => service.Diagnosis.code,
              ).join(", ") || "None"}
            </div>
          </div>

          {/* Services Table */}
          <div className="border border-gray-300 rounded">
            <div className="bg-gray-50 grid grid-cols-6 gap-4 p-3 text-sm font-medium text-gray-700 border-b border-gray-300">
              <div>Service details</div>
              <div>Diagnosis code</div>
              <div>Location</div>
              <div>Quantity</div>
              <div>Fee</div>
              <div>Total</div>
            </div>
            {goodFaithEstimate.GoodFaithServices.map((service) => (
              <div
                key={service.id}
                className="grid grid-cols-6 gap-4 p-3 text-sm border-b border-gray-200 last:border-b-0"
              >
                <div>
                  {service.PracticeService.code} {service.PracticeService.type},{" "}
                  {service.PracticeService.duration} min
                </div>
                <div>{service.Diagnosis.code}</div>
                <div>{service.Location.name}</div>
                <div>{service.quantity}</div>
                <div>${service.fee.toFixed(2)}</div>
                <div>${(service.fee * service.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-end mt-4">
            <div className="text-right">
              <div className="text-sm text-gray-600 mb-1">
                Total estimated cost
              </div>
              <div className="text-xl font-semibold">
                ${goodFaithEstimate.total_cost.toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
