"use client";
import React, { useState } from "react";
import Link from "next/link";
import {
  Button,
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@mcw/ui";
import DocumentationHistorySidebar from "../components/DocumentationHistorySidebar";

export default function OtherDocuments() {
  const [docType, setDocType] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="px-4 py-8 w-full max-w-6xl mx-auto">
      {/* Breadcrumb and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2 w-full">
        <div className="text-sm text-gray-500 flex flex-wrap items-center gap-1">
          <Link className="hover:underline" href="/clients">
            Clients and contacts
          </Link>
          <span>/</span>
          <Link className="hover:underline" href="#">
            Jamie D. Appleseed's profile
          </Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">Other document</span>
        </div>
        <div className="flex gap-4 mt-2 sm:mt-0 items-center">
          <Button
            className="bg-gray-100 text-gray-800 font-semibold px-4 py-2 rounded shadow-none border border-gray-200 hover:bg-gray-200"
            variant="secondary"
          >
            Send Referrals
          </Button>
          <button
            className="text-[#2d8467] hover:underline font-medium whitespace-nowrap"
            type="button"
            onClick={() => setSidebarOpen(true)}
          >
            Documentation history
          </button>
        </div>
      </div>

      {/* Client Info */}
      <h1 className="text-2xl font-bold mt-4 mb-1 text-gray-900">
        Jamie D. Appleseed
      </h1>
      <div className="text-sm text-gray-500 mb-4 flex flex-wrap gap-2 items-center">
        <span className="bg-gray-200 text-gray-700 rounded px-2 py-0.5 font-semibold text-xs">
          Adult
        </span>
        <span className="text-gray-300">|</span>
        07/12/2024 (0)
        <span className="text-gray-300">|</span>
        <Link className="text-[#2d8467] hover:underline" href="#">
          Schedule appointment
        </Link>
        <span className="text-gray-300">|</span>
        <Link className="text-[#2d8467] hover:underline" href="#">
          Edit
        </Link>
      </div>

      {/* Other Document Heading */}
      <h2 className="text-2xl font-bold text-gray-900 mt-6 mb-4">
        Other document
      </h2>

      {/* Document Type Dropdown */}
      <div className=" mb-6 w-full max-w-2xl">
        <Select value={docType} onValueChange={setDocType}>
          <SelectTrigger className="w-full px-4 py-3 border shadow-none text-base font-medium">
            <SelectValue placeholder="Discharge Summary Note" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="discharge">Discharge Summary Note</SelectItem>
            <SelectItem value="other">Other Document Type</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DocumentationHistorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
    </div>
  );
}
