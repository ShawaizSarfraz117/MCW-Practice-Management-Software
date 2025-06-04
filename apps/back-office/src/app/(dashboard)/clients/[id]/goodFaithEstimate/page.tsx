"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ClientSection from "./components/ClientSection";
import ProviderSection from "./components/ProviderSection";
import ServiceDetails from "./components/ServiceDetails";

interface ServiceDetailsFormData {
  dateProvided: string;
  timeProvided: string;
  expirationDate: string;
  serviceDates: string;
  diagnosisCodes: string;
  notes: string;
  services: Array<{
    detail: string;
    diagnosis: string;
    location: string;
    quantity: number;
    fee: number;
  }>;
}

export default function GoodFaithEstimate() {
  const searchParams = useSearchParams();
  const clientName = searchParams.get("clientName") ?? "";

  const [editClient, setEditClient] = useState(false);
  const [editProvider, setEditProvider] = useState(false);

  const [client, setClient] = useState({
    name: "Jamie D. Appleseed",
    dob: "July 12, 2024",
    address: "123 Main Street\nAnytown, CA 12345",
    contact: "Email\n7275101326\nalam@mcnultycw.com",
  });
  const [provider, setProvider] = useState({
    name: "Alam Naqvi",
    npi: "123",
    tin: "123",
    location: "Video Office",
    address: "",
    contactPerson: "Alam Naqvi",
    phone: "(123) 213-2133",
    email: "alam@mcnultycw.com",
  });

  const initialServiceData = {
    dateProvided: "2025-03-29",
    timeProvided: "19:13",
    expirationDate: "2026-03-29",
    serviceDates: "Mar 29, 2025 - Sep 29, 2025",
    diagnosisCodes: "F41.9",
    notes: "",
    services: [
      {
        detail: "90834 Psychotherapy, 45 min",
        diagnosis: "F41.9",
        location: "Video Office",
        quantity: 1,
        fee: 100,
      },
    ],
  };

  const totalCost = initialServiceData.services.reduce(
    (sum, s) => sum + s.fee * s.quantity,
    0,
  );

  const handleServiceSubmit = (data: ServiceDetailsFormData) => {
    console.log("Form submitted:", data);
    // Handle form submission here
  };

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
        <div className="px-4 sm:px-6 py-4 text-sm text-gray-500 overflow-x-auto whitespace-nowrap">
          <Link className="hover:text-gray-700" href="/clients">
            Clients and contacts
          </Link>
          <span className="mx-1">/</span>
          <span>{clientName}&apos;s profile</span>
          <span className="mx-1">/</span>
          <span>Good Faith Estimate</span>
        </div>
      </div>
      <h1 className="text-2xl font-semibold mb-1">Jamie D. Appleseed</h1>
      <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-2 items-center">
        Adult
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <a className="text-[#2d8467] hover:underline" href="#">
          Schedule appointment
        </a>
        <span className="text-gray-300">|</span>
        <a className="text-[#2d8467] hover:underline" href="#">
          Edit
        </a>
      </div>
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
          <Button className="h-8 w-8" size="icon" variant="outline">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 border border-gray-200 rounded-lg overflow-hidden mb-6">
        <ClientSection
          client={client}
          editClient={editClient}
          setClient={setClient}
          setEditClient={setEditClient}
        />
        <ProviderSection
          editProvider={editProvider}
          provider={provider}
          setEditProvider={setEditProvider}
          setProvider={setProvider}
        />
      </div>
      <ServiceDetails
        clientName={clientName}
        initialData={initialServiceData}
        totalCost={totalCost}
        onSubmit={handleServiceSubmit}
      />
      <div className="flex justify-start gap-4 mt-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] text-white"
          onClick={() => {}}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
