"use client";

import React, { useState } from "react";
import { Footer } from "@/components/footer";
import { Button } from "@mcw/ui";
import { Bell, LogOut } from "lucide-react";
import ClientDocuments from "@/dashboard/components/client-documents";
import ClientDashboard from "@/dashboard/components/client-dashboard";
import ClientBilling from "@/dashboard/components/client-billing";

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("appointments");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* White card header */}
      <div className="container">
        <div className="flex md:flex-row items-center justify-between py-4 px-4">
          <div className="flex-1 flex md:justify-start">
            <span className="text-xl text-gray-400 text-center">
              McNulty Counseling and Wellness
            </span>
          </div>
          <div className="flex items-center gap-6 mt-4 md:mt-0">
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="w-5 h-5 text-gray-400" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign out</span>
            </Button>
          </div>
        </div>
        {/* Navigation Tabs */}
        <div>
          <div className="flex items-center justify-between px-4 py-2">
            <div className="flex gap-6 text-sm">
              <button
                className={`pb-1 ${activeTab === "appointments" ? "text-gray-900 font-bold " : "text-gray-400 hover:text-gray-900 font-medium"}`}
                onClick={() => setActiveTab("appointments")}
              >
                APPOINTMENTS
              </button>
              <button
                className={`pb-1 ${activeTab === "documents" ? "text-gray-900 font-bold " : "text-gray-400 hover:text-gray-900 font-medium"}`}
                onClick={() => setActiveTab("documents")}
              >
                DOCUMENTS
              </button>
              <button
                className={`pb-1 ${activeTab === "billing" ? "text-gray-900 font-bold " : "text-gray-400 hover:text-gray-900 font-medium"}`}
                onClick={() => setActiveTab("billing")}
              >
                BILLING & PAYMENTS
              </button>
            </div>
            {activeTab === "appointments" && (
              <Button size="sm" className="ml-auto">
                REQUEST APPOINTMENT
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Page Title Banner */}
      <div className="w-full bg-[#F8F6F0] py-8 flex items-center justify-center">
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-800">
          {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-start px-2 py-8 w-full">
        {activeTab === "appointments" && <ClientDashboard />}
        {activeTab === "documents" && <ClientDocuments />}
        {activeTab === "billing" && <ClientBilling />}
      </main>

      <Footer />
    </div>
  );
}
