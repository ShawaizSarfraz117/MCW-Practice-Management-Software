"use client";

import { useMemo, useState } from "react";
import { ActivityTable } from "./components/ActivityTable";
import { ActivityFilters } from "./components/ActivityFilters";
import { ActivityTabs } from "./components/ActivityTabs";
import { parse } from "date-fns";

export default function ActivityPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEventType, setSelectedEventType] = useState("all-events");
  const [showDetails, setShowDetails] = useState(true);
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({});

  // Mock data - replace with actual data fetching
  const activities = [
    {
      date: "02/26/2025",
      time: "11:14 AM (EST)",
      event:
        "You created an appointment on 02/27/2025 at 9:15 am for client Shawaiz Sarfraz",
      ipAddress: "139.135.59.57",
      location: "Lahore, Pakistan",
      clientId: "1",
      clientName: "Shawaiz Sarfraz",
      type: "appointment",
    },
    {
      date: "02/26/2025",
      time: "10:45 AM (EST)",
      event: "You updated client profile for John Smith",
      ipAddress: "192.168.1.1",
      location: "New York, USA",
      clientId: "2",
      clientName: "John Smith",
      clientId: "2",
      clientName: "John Smith",
      type: "client-update",
    },
    {
      date: "02/26/2025",
      time: "09:30 AM (EST)",
      event: "Payment processed for client Emma Wilson",
      ipAddress: "172.16.0.100",
      location: "London, UK",
      clientId: "3",
      clientName: "Emma Wilson",
      type: "payment",
    },
    {
      date: "02/25/2025",
      time: "04:15 PM (EST)",
      event: "New client intake form completed by Maria Garcia",
      ipAddress: "10.0.0.50",
      location: "Madrid, Spain",
      clientId: "4",
      clientName: "Maria Garcia",
      clientId: "4",
      clientName: "Maria Garcia",
      type: "client-update",
    },
    {
      date: "02/25/2025",
      time: "02:20 PM (EST)",
      event: "Appointment rescheduled for client David Chen",
      ipAddress: "203.0.113.0",
      location: "Toronto, Canada",
      clientId: "5",
      clientName: "David Chen",
      type: "appointment",
    },
  ];

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleDateRangeChange = (
    from: Date | undefined,
    to: Date | undefined,
  ) => {
    setDateRange({ from, to });
  };

  const handleEventTypeChange = (type: string) => {
    setSelectedEventType(type);
  };

  const handleToggleDetails = () => {
    setShowDetails(!showDetails);
  };

  // Filter activities based on search query, event type, and date range
  // Memoize filtered activities to avoid unnecessary recalculations
  const filteredActivities = useMemo(() => {
    return activities.filter((activity) => {
      // Search filter
      const matchesSearch = activity.event
        .toLowerCase()
        .includes(searchQuery.toLowerCase());

      // Event type filter
      const matchesType =
        selectedEventType === "all-events" ||
        (selectedEventType === "appointments" &&
          activity.type === "appointment") ||
        (selectedEventType === "payments" && activity.type === "payment") ||
        (selectedEventType === "client-updates" &&
          activity.type === "client-update");

      // Date range filter
      let matchesDateRange = true;
      if (dateRange.from || dateRange.to) {
        const activityDate = parse(
          `${activity.date} ${activity.time.split(" ")[0]}`,
          "MM/dd/yyyy hh:mm",
          new Date(),
        );

        if (dateRange.from) {
          // Set from date to start of day
          const fromDate = new Date(dateRange.from);
          fromDate.setHours(0, 0, 0, 0);
          matchesDateRange = matchesDateRange && activityDate >= fromDate;
        }

        if (dateRange.to) {
          // Set to date to end of day
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999);
          matchesDateRange = matchesDateRange && activityDate <= toDate;
        }
      }

      return matchesSearch && matchesType && matchesDateRange;
    });
  }, [
    activities,
    searchQuery,
    selectedEventType,
    dateRange.from,
    dateRange.to,
  ]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Account Activity</h1>
      </div>

      <ActivityTabs />

      <ActivityFilters
        onSearch={handleSearch}
        onDateRangeChange={handleDateRangeChange}
        onEventTypeChange={handleEventTypeChange}
        onToggleDetails={handleToggleDetails}
      />

      <ActivityTable
        activities={filteredActivities}
        showDetails={showDetails}
      />
    </div>
  );
}
