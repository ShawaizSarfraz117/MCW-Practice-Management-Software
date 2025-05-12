"use client";

import RequestForm from "./RequestForm";
import PendingRequestView from "./PendingRequestView";
import ArchivedRequestView from "./ArchivedRequestView";
import { useState } from "react";

export default function RequestContainer() {
  const [activeTab, setActiveTab] = useState("pending");
  const [isFormOpen, setIsFormOpen] = useState(false);

  return (
    <div className="p-6 space-y-6">
      <div className="mb-2">
        <h1 className="text-2xl font-bold text-gray-900">Request Management</h1>
      </div>

      {/* Custom tabs */}
      <div>
        <div className="flex">
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "pending"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("pending")}
          >
            Pending Requests (1)
          </button>
          <button
            className={`px-4 py-2 font-medium text-sm ${
              activeTab === "archived"
                ? "text-primary border-b-2 border-primary"
                : "text-gray-500 hover:text-gray-800"
            }`}
            onClick={() => setActiveTab("archived")}
          >
            Archived Requests
          </button>
        </div>
      </div>

      {activeTab === "pending" ? (
        <PendingRequestView />
      ) : (
        <ArchivedRequestView />
      )}

      {isFormOpen && <RequestForm setIsFormOpen={setIsFormOpen} />}
    </div>
  );
}
