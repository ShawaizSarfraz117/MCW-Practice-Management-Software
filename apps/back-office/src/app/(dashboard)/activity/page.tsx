"use client";

import { useState } from "react";
import ActivityTable from "./components/ActivityTable";
import Filters from "./components/Filters";
import TabNavigation, { TabType } from "./components/TabNavigation";

interface ActivityPageState {
  activeTab: TabType;
  searchQuery: string;
  selectedClient: string;
  selectedTimeRange: string;
  selectedEventType: string;
  fromDate: string;
  toDate: string;
}

export default function AccountActivitySection() {
  const [state, setState] = useState<ActivityPageState>({
    activeTab: "history",
    searchQuery: "",
    selectedClient: "Select Client",
    selectedTimeRange: "All Time",
    selectedEventType: "All Events",
    fromDate: "",
    toDate: "",
  });

  // Helper functions to update specific parts of state
  const setActiveTab = (activeTab: TabType) =>
    setState((prev) => ({ ...prev, activeTab }));
  const setSearchQuery = (searchQuery: string) =>
    setState((prev) => ({ ...prev, searchQuery }));
  const setSelectedClient = (selectedClient: string) =>
    setState((prev) => ({ ...prev, selectedClient }));
  const setSelectedTimeRange = (selectedTimeRange: string) =>
    setState((prev) => ({ ...prev, selectedTimeRange }));
  const setSelectedEventType = (selectedEventType: string) =>
    setState((prev) => ({ ...prev, selectedEventType }));
  const setFromDate = (fromDate: string) =>
    setState((prev) => ({ ...prev, fromDate }));
  const setToDate = (toDate: string) =>
    setState((prev) => ({ ...prev, toDate }));

  return (
    <div className="p-6">
      <div className="mb-4">
        <h1 className="text-2xl font-semibold text-gray-900">
          Account Activity
        </h1>
      </div>

      {/* Tab Navigation */}
      <TabNavigation activeTab={state.activeTab} setActiveTab={setActiveTab} />

      <div className="bg-white rounded-lg border shadow-sm">
        {/* Filters Section */}
        <Filters
          searchQuery={state.searchQuery}
          setSearchQuery={setSearchQuery}
          selectedClient={state.selectedClient}
          setSelectedClient={setSelectedClient}
          selectedTimeRange={state.selectedTimeRange}
          setSelectedTimeRange={setSelectedTimeRange}
          selectedEventType={state.selectedEventType}
          setSelectedEventType={setSelectedEventType}
          fromDate={state.fromDate}
          setFromDate={setFromDate}
          toDate={state.toDate}
          setToDate={setToDate}
        />

        {/* Activity Content */}
        {state.activeTab === "history" && (
          <ActivityTable
            searchQuery={state.searchQuery}
            timeRange={state.selectedTimeRange}
          />
        )}

        {state.activeTab === "signin" && (
          <div className="p-8 text-center text-gray-500">
            Sign In Events will be displayed here
          </div>
        )}

        {state.activeTab === "hipaa" && (
          <div className="p-8 text-center text-gray-500">
            HIPAA Audit Log will be displayed here
          </div>
        )}
      </div>
    </div>
  );
}
