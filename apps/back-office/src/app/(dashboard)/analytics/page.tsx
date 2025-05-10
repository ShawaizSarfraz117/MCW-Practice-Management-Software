"use client";

import { AnalyticsHeader } from "./components/AnalyticsHeader";
import { TimeRangeFilter } from "./components/TimeRangeFilter";
import { WarningBanner } from "./components/WarningBanner";
import { useState } from "react";
import {
  IncomeChart,
  OutstandingBalancesChart,
  AppointmentsChart,
  NotesChart,
} from "./components/StatsCard";
import { LineChart, DollarSign } from "lucide-react";
import { IncomeTable } from "./components/IncomeTable";

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showIncomeTable, setShowIncomeTable] = useState(false);

  if (showIncomeTable) {
    return <IncomeTable />;
  }

  return (
    <div className="h-full bg-gray-50">
      <div className="p-6">
        <div className="mb-6">
          <AnalyticsHeader activeTab={activeTab} setActiveTab={setActiveTab} />
        </div>
        {activeTab === "dashboard" ? (
          <div className="space-y-6">
            <WarningBanner />
            <TimeRangeFilter />
            <div className="space-y-4">
              <IncomeChart />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <OutstandingBalancesChart />
                <AppointmentsChart />
                <NotesChart />
              </div>
            </div>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-4">
              View detailed client and billing data.{" "}
              <span className="text-primary hover:underline cursor-pointer">
                Learn more
              </span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <LineChart className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg font-medium">Income</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Reports related to your practice income
                  </p>
                  <div
                    className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer"
                    onClick={() => setShowIncomeTable(true)}
                  >
                    <span>Income</span>
                  </div>
                </div>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-lg font-medium">Billing</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Reports related to client billing and payments
                  </p>
                  <div className="flex items-center gap-2 text-sm text-primary hover:underline cursor-pointer">
                    <span>Outstanding balances</span>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
