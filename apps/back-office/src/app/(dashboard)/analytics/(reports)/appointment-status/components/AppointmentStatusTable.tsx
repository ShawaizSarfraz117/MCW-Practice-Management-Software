"use client";

import { AppointmentStatusItem } from "@/(dashboard)/analytics/services/appointment-status.service";
import Link from "next/link";

interface AppointmentStatusTableProps {
  data: AppointmentStatusItem[];
  isLoading: boolean;
}

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount);
};

const getStatusBadge = (status: string) => {
  const baseClasses =
    "inline-flex items-center px-2 py-1 text-xs font-medium rounded-full";

  switch (status) {
    case "PAID":
      return `${baseClasses} bg-green-100 text-green-800`;
    case "UNPAID":
      return `${baseClasses} bg-red-100 text-red-800`;
    case "PARTIAL":
      return `${baseClasses} bg-yellow-100 text-yellow-800`;
    case "UNINVOICED":
      return `${baseClasses} bg-gray-100 text-gray-800`;
    default:
      return `${baseClasses} bg-gray-100 text-gray-800`;
  }
};

export default function AppointmentStatusTable({
  data,
  isLoading,
}: AppointmentStatusTableProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Appointment Details
          </h3>
        </div>
        <div className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Appointment Details
          </h3>
        </div>
        <div className="p-6 text-center text-gray-500">
          No appointment data found for the selected date range.
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          Appointment Details
        </h3>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date of Service
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Client
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Billing Code
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rate Per Unit
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Units
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Fee
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Charge
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Uninvoiced
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Unpaid
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.map((appointment) => (
              <tr key={appointment.appointmentId} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-primary hover:underline cursor-pointer">
                  {appointment.dateOfService}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-medium">
                  <Link
                    className="text-primary hover:underline cursor-pointer"
                    href={`/clients/${appointment.clientGroupId}?tab=overview`}
                  >
                    {appointment.client}
                  </Link>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {appointment.billingCode}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(appointment.ratePerUnit)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {appointment.units}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(appointment.totalFee)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={getStatusBadge(appointment.status)}>
                    {appointment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {formatCurrency(appointment.charge)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {appointment.uninvoiced > 0
                    ? formatCurrency(appointment.uninvoiced)
                    : "--"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {appointment.paid > 0 ? (
                    <span className="text-green-600 font-medium">
                      {formatCurrency(appointment.paid)}
                    </span>
                  ) : (
                    "--"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                  {appointment.unpaid > 0 ? (
                    <span className="text-red-600 font-medium">
                      {formatCurrency(appointment.unpaid)}
                    </span>
                  ) : (
                    "--"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
