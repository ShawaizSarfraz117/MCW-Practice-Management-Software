"use client";

import { useEffect, useState } from "react";

interface ActivityEvent {
  Id: string;
  datetime: string;
  event_text: string;
  event_type: string;
  is_hipaa: boolean;
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  };
  User?: {
    email: string;
    Clinician?: {
      first_name: string;
      last_name: string;
    };
  };
}

interface ActivityTableProps {
  showDetails: boolean;
  searchQuery: string;
  timeRange: string;
}

export default function ActivityTable({
  showDetails,
  searchQuery,
  timeRange,
}: ActivityTableProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch("/api/activity");
        if (!response.ok) throw new Error("Failed to fetch events");
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = [...events];

    // Apply time range filter
    if (timeRange !== "All Time") {
      const now = new Date();
      const ranges: { [key: string]: number } = {
        "Last 24 Hours": 24 * 60 * 60 * 1000,
        "Last 7 Days": 7 * 24 * 60 * 60 * 1000,
        "Last 30 Days": 30 * 24 * 60 * 60 * 1000,
        "Last 90 Days": 90 * 24 * 60 * 60 * 1000,
      };

      const timeLimit = ranges[timeRange];
      filtered = filtered.filter((event) => {
        const eventDate = new Date(event.datetime);
        return now.getTime() - eventDate.getTime() <= timeLimit;
      });
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (event) =>
          event.event_type.toLowerCase().includes(query) ||
          event.event_text.toLowerCase().includes(query) ||
          event.Client?.legal_first_name.toLowerCase().includes(query) ||
          event.Client?.legal_last_name.toLowerCase().includes(query) ||
          event.User?.email.toLowerCase().includes(query),
      );
    }

    setFilteredEvents(filtered);
  }, [events, searchQuery, timeRange]);

  if (loading) {
    return <div className="text-center py-8">Loading activity...</div>;
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
          {filteredEvents.map((event) => {
            const date = new Date(event.datetime);

            return (
              <tr key={event.Id} className="hover:bg-gray-50">
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
                    {event.User?.email}
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
