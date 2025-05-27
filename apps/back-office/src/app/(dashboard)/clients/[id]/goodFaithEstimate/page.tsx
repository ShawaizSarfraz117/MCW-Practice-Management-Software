"use client";

import React, { useState } from "react";
import { Button } from "@mcw/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ClientSection from "./components/ClientSection";
import ProviderSection from "./components/ProviderSection";
import ServiceDetails from "./components/ServiceDetails";

export default function GoodFaithEstimate() {
  const searchParams = useSearchParams();
  const clientName = searchParams.get("clientName");

  // State for edit mode
  const [editClient, setEditClient] = useState(false);
  const [editProvider, setEditProvider] = useState(false);

  // Example state for form fields (replace with your real data/state management)
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

  const [dateProvided, setDateProvided] = useState("2025-03-29");
  const [timeProvided, setTimeProvided] = useState("19:13");
  const [expirationDate, setExpirationDate] = useState("2026-03-29");
  const [serviceDates, setServiceDates] = useState(
    "Mar 29, 2025 - Sep 29, 2025",
  );
  const [diagnosisCodes, setDiagnosisCodes] = useState("F41.9");
  const [notes, setNotes] = useState("");
  const [services, setServices] = useState([
    {
      detail: "90834 Psychotherapy, 45 min",
      diagnosis: "F41.9",
      location: "Video Office",
      quantity: 1,
      fee: 100,
    },
  ]);
  const totalCost = services.reduce((sum, s) => sum + s.fee * s.quantity, 0);

  function updateService(idx: number, key: string, value: string | number) {
    setServices((services) =>
      services.map((s, i) => (i === idx ? { ...s, [key]: value } : s)),
    );
  }
  function addService() {
    setServices([
      ...services,
      { detail: "", diagnosis: "", location: "", quantity: 1, fee: 100 },
    ]);
  }

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
        dateProvided={dateProvided}
        setDateProvided={setDateProvided}
        timeProvided={timeProvided}
        setTimeProvided={setTimeProvided}
        expirationDate={expirationDate}
        setExpirationDate={setExpirationDate}
        serviceDates={serviceDates}
        setServiceDates={setServiceDates}
        diagnosisCodes={diagnosisCodes}
        setDiagnosisCodes={setDiagnosisCodes}
        notes={notes}
        setNotes={setNotes}
        services={services}
        updateService={updateService}
        addService={addService}
        totalCost={totalCost}
      />
      <div className="flex justify-start gap-4 mt-6">
        <Button variant="outline" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button
          className="bg-[#2d8467] hover:bg-[#236c53] text-white"
          onClick={() => {
            // TODO: Implement save functionality
            console.log("Saving GFE...");
          }}
        >
          Save
        </Button>
      </div>
    </div>
  );
}
