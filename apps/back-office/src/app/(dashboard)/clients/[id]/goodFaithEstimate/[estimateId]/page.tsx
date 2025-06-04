"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import { useParams } from "next/navigation";
import ClientSection from "./components/ClientSection";
import ProviderSection from "./components/ProviderSection";
import ServiceDetails from "./components/ServiceDetails";
// import { fetchGoodFaithEstimate } from "@/(dashboard)/clients/services/client.service";

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
  const params = useParams();
  const clientName = params.clientName as string;

  // const [goodFaithEstimate, setGoodFaithEstimate] = useState(null);
  // console.log("🚀 ~ GoodFaithEstimate ~ goodFaithEstimate:", goodFaithEstimate)
  // useEffect(() => {
  //   const fetchGoodFaithEstimateData = async () => {
  //     if (params.estimateId) {
  //       const data = await fetchGoodFaithEstimate(params.estimateId as string);
  //       setGoodFaithEstimate(data);
  //     }
  //   };
  //   fetchGoodFaithEstimateData();
  // }, [params]);

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
      <h1 className="text-2xl font-semibold mb-1">Jamie D. Appleseed</h1>
      <div className="text-sm text-gray-500 mb-2 flex flex-wrap gap-2 items-center">
        Adult
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <a href="#" className="text-[#2d8467] hover:underline">
          Schedule appointment
        </a>
        <span className="text-gray-300">|</span>
        <a href="#" className="text-[#2d8467] hover:underline">
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
            <a href="#" className="text-[#2d8467] hover:underline">
              Learn about Good Faith Estimates
            </a>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8">
            <span className="sr-only">Edit</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 00-4-4l-8 8v3z"
              />
            </svg>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <span className="sr-only">Print</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 9V2h12v7M6 18h12v4H6v-4z"
              />
            </svg>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8">
            <span className="sr-only">Download</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3"
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
          setClient={setClient}
          editClient={editClient}
          setEditClient={setEditClient}
        />
        <ProviderSection
          provider={provider}
          setProvider={setProvider}
          editProvider={editProvider}
          setEditProvider={setEditProvider}
        />
      </div>
      <ServiceDetails
        totalCost={totalCost}
        clientName={clientName}
        initialData={initialServiceData}
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
