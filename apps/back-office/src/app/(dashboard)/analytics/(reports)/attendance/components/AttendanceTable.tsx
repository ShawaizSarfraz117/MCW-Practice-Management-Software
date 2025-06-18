"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";
import { AttendanceData } from "@/(dashboard)/analytics/services/attendance.service";
import Link from "next/link";

interface AttendanceTableProps {
  data: AttendanceData[];
  isLoading: boolean;
}

export default function AttendanceTable({
  data,
  isLoading,
}: AttendanceTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  const getClientName = (appointment: AttendanceData) => {
    const memberships = appointment.ClientGroup?.ClientGroupMembership || [];
    if (memberships.length === 0) return "Unknown Client";

    if (memberships.length === 1) {
      const client = memberships[0].Client;
      return `${client.legal_first_name} ${client.legal_last_name}`;
    }

    // For multiple members (couples, families), show group name or combine names
    const names = memberships.map((membership) => {
      const client = membership.Client;
      return `${client.legal_first_name} ${client.legal_last_name}`;
    });

    return names.join(" & ");
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "show":
        return "text-green-600";
      case "no_show":
        return "text-red-600";
      case "cancelled":
      case "late_cancelled":
      case "clinician_cancelled":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  const formatStatus = (status: string) => {
    switch (status.toLowerCase()) {
      case "no_show":
        return "No Show";
      case "late_cancelled":
        return "Late Cancelled";
      case "clinician_cancelled":
        return "Clinician Cancelled";
      default:
        return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead>Client</TableHead>
              <TableHead>Date of service</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, index) => (
              <TableRow key={index} className="hover:bg-gray-50">
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
                <TableCell>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Client</TableHead>
            <TableHead>Date of service</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                No appointments found for the selected criteria
              </TableCell>
            </TableRow>
          ) : (
            data.map((appointment) => (
              <TableRow key={appointment.id} className="hover:bg-gray-50">
                <TableCell>
                  <Link
                    className="text-primary hover:underline cursor-pointer"
                    href={`/clients/${appointment.client_group_id}?tab=overview`}
                  >
                    {getClientName(appointment)}
                  </Link>
                </TableCell>
                <TableCell>{formatDate(appointment.start_date)}</TableCell>
                <TableCell className={getStatusColor(appointment.status)}>
                  {formatStatus(appointment.status)}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
