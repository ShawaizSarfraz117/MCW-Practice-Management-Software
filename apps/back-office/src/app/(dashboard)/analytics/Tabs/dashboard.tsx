"use client";

import {
  IncomeChart,
  OutstandingBalancesChart,
  AppointmentsChart,
  NotesChart,
} from "../components/StatsCard";
import { WarningBanner } from "../components/WarningBanner";
import { useAnalytics } from "../hooks/useAnalytics";
import { useState } from "react";

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState<{
    range: "thisMonth" | "lastMonth" | "last30days" | "thisYear" | "custom";
    startDate?: string;
    endDate?: string;
  }>({ range: "thisMonth" });

  const { data: analyticsData, isLoading } = useAnalytics(timeRange);

  return (
    <div className="space-y-6">
      <WarningBanner />
      <div className="space-y-4">
        <IncomeChart
          analyticsData={analyticsData}
          isLoading={isLoading}
          onTimeRangeChange={setTimeRange}
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <OutstandingBalancesChart
            analyticsData={analyticsData}
            isLoading={isLoading}
          />
          <AppointmentsChart
            analyticsData={analyticsData}
            isLoading={isLoading}
          />
          <NotesChart analyticsData={analyticsData} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
}
