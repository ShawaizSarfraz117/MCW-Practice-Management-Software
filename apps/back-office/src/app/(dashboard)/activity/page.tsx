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
  showDetails: boolean;
}

export default function AccountActivitySection() {
  const [state, setState] = useState<ActivityPageState>({
    activeTab: "history",
    searchQuery: "",
    selectedClient: "All Team Members",
    selectedTimeRange: "All Time",
    selectedEventType: "All Events",
    fromDate: "",
    toDate: "",
    showDetails: false,
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
  const setShowDetails = (showDetails: boolean) =>
    setState((prev) => ({ ...prev, showDetails }));

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
          fromDate={state.fromDate}
          searchQuery={state.searchQuery}
          selectedClient={state.selectedClient}
          selectedEventType={state.selectedEventType}
          selectedTimeRange={state.selectedTimeRange}
          setFromDate={setFromDate}
          setSearchQuery={setSearchQuery}
          setSelectedClient={setSelectedClient}
          setSelectedEventType={setSelectedEventType}
          setSelectedTimeRange={setSelectedTimeRange}
          setShowDetails={setShowDetails}
          setToDate={setToDate}
          showDetails={state.showDetails}
          toDate={state.toDate}
        />

        {/* Activity Content */}
        <ActivityTable
          activeTab={state.activeTab}
          eventType={state.selectedEventType}
          fromDate={state.fromDate}
          searchQuery={state.searchQuery}
          selectedUserId={state.selectedClient}
          showDetails={state.showDetails}
          timeRange={state.selectedTimeRange}
          toDate={state.toDate}
        />
      </div>
    </div>
  );
}
