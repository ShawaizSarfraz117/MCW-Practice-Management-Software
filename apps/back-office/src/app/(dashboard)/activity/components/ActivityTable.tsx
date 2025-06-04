"use client";

import { useEffect, useState } from "react";

// Define types locally
export interface ActivityEvent {
  id: string;
  datetime: string;
  event_type: string;
  event_text: string;
  User: {
    email: string;
  };
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  };
  is_hipaa: boolean;
}

export interface ActivityTableProps {
  searchQuery: string;
  timeRange: string;
}

export default function ActivityTable({
  searchQuery,
  timeRange,
}: ActivityTableProps) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock events for demonstration
  const mockEvents: ActivityEvent[] = [
    {
      id: "1",
      datetime: "2025-02-26T11:14:00.000Z",
      event_type: "APPOINTMENT_CREATED",
      event_text:
        "You created an appointment on 02/27/2025 at 9:15 am for client Shawaiz Sarfraz",
      User: { email: "doctor@example.com" },
      Client: { legal_first_name: "Shawaiz", legal_last_name: "Sarfraz" },
      is_hipaa: false,
    },
    {
      id: "2",
      datetime: "2025-02-26T10:45:00.000Z",
      event_type: "PROFILE_UPDATED",
      event_text: "You updated client profile for John Smith",
      User: { email: "doctor@example.com" },
      Client: { legal_first_name: "John", legal_last_name: "Smith" },
      is_hipaa: true,
    },
    {
      id: "3",
      datetime: "2025-02-26T09:30:00.000Z",
      event_type: "PAYMENT_PROCESSED",
      event_text: "Payment processed for client Emma Wilson",
      User: { email: "admin@example.com" },
      Client: { legal_first_name: "Emma", legal_last_name: "Wilson" },
      is_hipaa: false,
    },
    {
      id: "4",
      datetime: "2025-02-25T16:15:00.000Z",
      event_type: "FORM_COMPLETED",
      event_text: "New client intake form completed by Maria Garcia",
      User: { email: "admin@example.com" },
      Client: { legal_first_name: "Maria", legal_last_name: "Garcia" },
      is_hipaa: true,
    },
    {
      id: "5",
      datetime: "2025-02-25T14:20:00.000Z",
      event_type: "APPOINTMENT_RESCHEDULED",
      event_text: "Appointment rescheduled for client David Chen",
      User: { email: "doctor@example.com" },
      Client: { legal_first_name: "David", legal_last_name: "Chen" },
      is_hipaa: false,
    },
  ];

  // Map of IP addresses and locations (in a real app, this would come from the API)
  const locationMap = {
    "1": { ip: "139.135.59.57", location: "Lahore, Pakistan" },
    "2": { ip: "192.168.1.1", location: "New York, USA" },
    "3": { ip: "172.16.0.100", location: "London, UK" },
    "4": { ip: "10.0.0.50", location: "Madrid, Spain" },
    "5": { ip: "203.0.113.0", location: "Toronto, Canada" },
  };

  useEffect(() => {
    // Simulate API fetch with mock data
    setTimeout(() => {
      setEvents(mockEvents);
      setLoading(false);
    }, 500);
  }, [searchQuery, timeRange]);

  if (loading) {
    return <div className="text-center p-8">Loading activity...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center p-8">
        No activity events found
        {searchQuery ? ` matching your search "${searchQuery}"` : ""}.
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
          {events.map((event) => {
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

            // Get location data from our map based on event id
            const locationData =
              locationMap[event.id as keyof typeof locationMap];

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
                    <p className="text-sm text-black">{event.event_text}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      IP Address {locationData?.ip} • {locationData?.location}
                    </p>
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
