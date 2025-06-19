"use client";

interface AttendanceSummaryProps {
  summary: {
    totalClients: number;
    totalAppointments: number;
    totalStatuses: number;
  };
  isLoading: boolean;
}

export default function AttendanceSummary({
  summary,
  isLoading,
}: AttendanceSummaryProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="text-center">
              <div className="h-8 bg-gray-200 rounded animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
      <div className="grid grid-cols-3 gap-4 text-center">
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {summary.totalClients}
          </div>
          <div className="text-sm text-gray-600">clients</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {summary.totalAppointments}
          </div>
          <div className="text-sm text-gray-600">appointments</div>
        </div>
        <div>
          <div className="text-2xl font-semibold text-gray-900">
            {summary.totalStatuses}
          </div>
          <div className="text-sm text-gray-600">statuses</div>
        </div>
      </div>
    </div>
  );
}
