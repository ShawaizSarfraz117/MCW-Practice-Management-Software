"use client";

import Link from "next/link";
import { LineChart, DollarSign, Building2 } from "lucide-react";

export default function Reports() {
  return (
    <>
      <p className="text-sm text-gray-500 mb-4">
        View detailed client and billing data.{" "}
        <span className="text-primary hover:underline cursor-pointer">
          Learn more
        </span>
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-6 border rounded-lg shadow-sm space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <LineChart className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-medium">Income</span>
            </div>
            <p className="text-sm text-gray-500">
              Reports related to your practice income
            </p>
            <Link
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              href="/analytics/income"
            >
              <span>Income</span>
            </Link>
          </div>
        </div>
        <div className="bg-white border p-6 rounded-lg shadow-sm space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-medium">Billing</span>
            </div>
            <p className="text-sm text-gray-500">
              Reports related to client billing and payments
            </p>
            <Link
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              href="/analytics/outstanding-balances"
            >
              <span>Outstanding balances</span>
            </Link>
          </div>
        </div>
        <div className="bg-white border p-6 rounded-lg shadow-sm space-y-4">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="text-lg font-medium">
                Clients & Appointments
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Reports related to appointments and client communication
            </p>
            <Link
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              href="/analytics/attendance"
            >
              <span>Attendance</span>
            </Link>
            <Link
              className="flex items-center gap-2 text-sm text-primary hover:underline"
              href="/analytics/appointment-status"
            >
              <span>Appointment status</span>
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
