import Link from "next/link";

interface ActivityTableProps {
  activities: {
    date: string;
    time: string;
    event: string;
    ipAddress?: string;
    location?: string;
    clientId?: string;
    clientName?: string;
  }[];
  showDetails?: boolean;
}

export function ActivityTable({
  activities,
  showDetails = true,
}: ActivityTableProps) {
  const formatEventText = (
    event: string,
    clientId?: string,
    clientName?: string,
  ) => {
    if (!clientName) return event;

    const parts = event.split(clientName);
    if (parts.length === 2) {
      return (
        <>
          {parts[0]}
          <Link
            href={`/clients/${clientId}`}
            className="text-[#2d8467] hover:underline"
          >
            {clientName}
          </Link>
          {parts[1]}
        </>
      );
    }
    return event;
  };

  return (
    <div className="rounded-md border">
      <div className="grid grid-cols-[1fr_1fr_3fr] gap-4 bg-gray-50 p-4 text-sm font-medium text-gray-600">
        <div>Date</div>
        <div>Time</div>
        <div>Event</div>
      </div>
      <div className="divide-y">
        {activities.map((activity, index) => (
          <div
            key={`${activity.date}-${activity.time}-${index}`}
            className="grid grid-cols-[1fr_1fr_3fr] gap-4 p-4 text-sm"
          >
            key={index}
            className="grid grid-cols-[1fr_1fr_3fr] gap-4 p-4 text-sm"
          >
            <div>{activity.date}</div>
            <div>{activity.time}</div>
            <div>
              <div>
                {formatEventText(
                  activity.event,
                  activity.clientId,
                  activity.clientName,
                )}
              </div>
              {showDetails && activity.ipAddress && activity.location && (
                <div className="mt-1 text-xs text-gray-500">
                  IP Address {activity.ipAddress} • {activity.location}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
