"use client";

import { PaginationData } from "@/types/auditTypes";
import { ActivityEvent, ActivityTableProps } from "@/types/auditTypes";
import { useEffect, useState } from "react";

export default function ActivityTable({
  showDetails,
  searchQuery,
  timeRange,
}: ActivityTableProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 20,
    pages: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchEvents = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20",
      });

      // Add time range filter
      if (timeRange !== "All Time") {
        const now = new Date();
        const startDate = new Date();

        switch (timeRange) {
          case "Last 24 Hours":
            startDate.setHours(startDate.getHours() - 24);
            break;
          case "Last 7 Days":
            startDate.setDate(startDate.getDate() - 7);
            break;
          case "Last 30 Days":
            startDate.setDate(startDate.getDate() - 30);
            break;
          case "Last 90 Days":
            startDate.setDate(startDate.getDate() - 90);
            break;
        }

        params.set("startDate", startDate.toISOString());
        params.set("endDate", now.toISOString());
      }

      // Add search query as event type filter if it matches an event type
      if (searchQuery) {
        params.set("eventType", searchQuery.toUpperCase());
      }

      const response = await fetch(`/api/activity?${params.toString()}`);
      if (!response.ok) throw new Error("Failed to fetch events");
      const { data, pagination: paginationData } = await response.json();
      setEvents(data);
      setPagination(paginationData);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents(1); // Reset to first page when filters change
  }, [searchQuery, timeRange]);

  if (loading && pagination.page === 1) {
    return <div className="text-center py-8">Loading activity...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8">
        No activity events found
        {searchQuery ? ` matching your search "${searchQuery}"` : ""}.
      </div>
    );
  }

  return (
    <div className="border rounded-md">
      <table className="w-full">
        <thead className="bg-gray-50 text-left text-sm text-gray-500">
          <tr>
            <th className="px-4 py-3 font-medium">Date</th>
            <th className="px-4 py-3 font-medium">Time</th>
            <th className="px-4 py-3 font-medium">Event</th>
            {showDetails && <th className="px-4 py-3 font-medium">User</th>}
          </tr>
        </thead>
        <tbody className="divide-y">
          {events.map((event) => {
            const date = new Date(event.datetime);

            return (
              <tr key={event.id} className="hover:bg-gray-50">
                <td className="px-4 py-4 text-sm">
                  {date.toLocaleDateString()}
                </td>
                <td className="px-4 py-4 text-sm">
                  {date.toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                    timeZoneName: "short",
                  })}
                </td>
                <td className="px-4 py-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {event.event_type}
                    </p>
                    <p className="text-sm text-gray-600">{event.event_text}</p>
                    {showDetails && event.Client && (
                      <p className="text-xs text-gray-500 mt-1">
                        Client: {event.Client.legal_first_name}{" "}
                        {event.Client.legal_last_name}
                      </p>
                    )}
                  </div>
                </td>
                {showDetails && (
                  <td className="px-4 py-4 text-sm text-gray-600">
                    {event.User?.email || "N/A"}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
        <div className="text-sm text-gray-500">
          Showing {events.length} of {pagination.total} results
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50"
            disabled={pagination.page === 1}
            onClick={() => fetchEvents(pagination.page - 1)}
          >
            Previous
          </button>
          <button
            className="px-3 py-1 text-sm bg-white border rounded-md disabled:opacity-50"
            disabled={pagination.page === pagination.pages}
            onClick={() => fetchEvents(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
