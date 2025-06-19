"use client";

import { useEffect, useState } from "react";
import Loading from "@/components/Loading";

// Define types locally
export interface ActivityEvent {
  id: string;
  datetime: string;
  event_type: string;
  event_text: string;
  User?: {
    email: string;
  } | null;
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  } | null;
  ClientGroup?: {
    name: string;
  } | null;
  is_hipaa: boolean;
  ip_address?: string | null;
  location?: string | null;
}

export interface ActivityTableProps {
  searchQuery: string;
  timeRange: string;
  eventType?: string;
  selectedUserId?: string;
  showDetails?: boolean;
  activeTab?: string;
  fromDate?: string;
  toDate?: string;
}

export default function ActivityTable({
  searchQuery,
  timeRange,
  eventType,
  selectedUserId,
  showDetails = false,
  activeTab,
  fromDate,
  toDate,
}: ActivityTableProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [teamMembers, setTeamMembers] = useState<
    { id: string; fullName: string }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getTimeRangeParam = (range: string) => {
    switch (range) {
      case "Today":
        return "1d";
      case "Last 7 Days":
        return "7d";
      case "Last 30 Days":
        return "30d";
      case "Last 90 Days":
        return "90d";
      default:
        // Check if it's a custom date range
        if (range.includes("-") && fromDate && toDate) {
          return "custom";
        }
        return "30d";
    }
  };

  // Fetch team members on mount
  useEffect(() => {
    const fetchTeamMembers = async () => {
      try {
        const response = await fetch("/api/activity?type=team-members");
        if (response.ok) {
          const data = await response.json();
          setTeamMembers(data);
        }
      } catch (error) {
        console.error("Error fetching team members:", error);
      }
    };
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    const fetchActivities = async () => {
      setLoading(true);
      setError(null);

      try {
        const timeRangeParam = getTimeRangeParam(timeRange);
        let url = `/api/activity?timeRange=${timeRangeParam}`;

        // Add custom date range parameters if applicable
        if (timeRangeParam === "custom" && fromDate && toDate) {
          url += `&fromDate=${encodeURIComponent(fromDate)}&toDate=${encodeURIComponent(toDate)}`;
        }

        // Add tab parameter if activeTab is set
        if (activeTab === "billing") {
          url += `&tab=billing`;
        }

        if (eventType && eventType !== "All Events") {
          url += `&types=${encodeURIComponent(eventType)}`;
        }

        // Map team member name to user ID
        if (selectedUserId && selectedUserId !== "All Team Members") {
          const member = teamMembers.find((m) => m.fullName === selectedUserId);
          if (member) {
            url += `&userId=${encodeURIComponent(member.id)}`;
          }
        }

        const response = await fetch(url);

        if (!response.ok) {
          throw new Error("Failed to fetch activities");
        }

        const data = await response.json();
        setEvents(data.activities || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [timeRange, eventType, selectedUserId, activeTab, fromDate, toDate]);

  // Filter events based on search query
  const filteredEvents = events.filter((event) => {
    if (!searchQuery) return true;

    const searchLower = searchQuery.toLowerCase();
    const description = event.event_text;

    return (
      description.toLowerCase().includes(searchLower) ||
      event.User?.email?.toLowerCase().includes(searchLower) ||
      event.Client?.legal_first_name?.toLowerCase().includes(searchLower) ||
      event.Client?.legal_last_name?.toLowerCase().includes(searchLower) ||
      event.ClientGroup?.name?.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return <Loading className="p-8" message="Loading activity..." />;
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        Error loading activities: {error}
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        No activity events found
        {searchQuery ? ` matching your search "${searchQuery}"` : ""}.
      </div>
    );
  }

  if (filteredEvents.length === 0) {
    return (
      <div className="text-center p-8">
        No activity events found matching your search "{searchQuery}".
      </div>
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Date
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Time
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Event
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {filteredEvents.map((event) => {
            const date = new Date(event.datetime);
            const formattedDate = date.toLocaleDateString("en-US", {
              month: "2-digit",
              day: "2-digit",
              year: "numeric",
            });

            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "numeric",
              minute: "2-digit",
              hour12: true,
              timeZoneName: "short",
            });

            const description = event.event_text;

            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formattedDate}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formattedTime}
                </td>
                <td className="px-6 py-4">
                  <div>
                    <p className="text-sm text-black">
                      {description}
                      {event.Client && (
                        <span>
                          {" "}
                          for{" "}
                          <a className="text-blue-600 hover:underline" href="#">
                            {event.Client.legal_first_name}{" "}
                            {event.Client.legal_last_name}
                          </a>
                        </span>
                      )}
                    </p>
                    {showDetails && (event.ip_address || event.location) && (
                      <p className="text-xs text-gray-500 mt-1">
                        {event.ip_address && `IP Address ${event.ip_address}`}
                        {event.ip_address && event.location && " • "}
                        {event.location && event.location}
                      </p>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
