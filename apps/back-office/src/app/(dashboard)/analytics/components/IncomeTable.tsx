"use client";

import { Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@mcw/ui";

export function IncomeTable() {
  return (
    <div className="min-h-full bg-gray-50/50">
      <div className="p-6 space-y-6">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-sm">
          <span className="text-gray-500">Analytics</span>
          <span className="text-gray-500">&gt;</span>
          <span className="text-gray-900">Income</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-gray-900">Income</h1>
          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50">
            Export
            <svg
              className="w-4 h-4"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M2 5L8 11L14 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Date Range */}
        <div className="inline-flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 rounded-md">
          <Calendar className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm font-medium">04/01/2025 - 04/21/2025</span>
        </div>

        {/* Table */}
        <div className="rounded-lg border border-gray-200 bg-white">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="border-gray-200 hover:bg-transparent">
                <TableHead className="text-gray-500">Date</TableHead>
                <TableHead className="text-left text-gray-500">
                  Client payments
                </TableHead>
                <TableHead className="text-left text-gray-500">
                  Gross income
                </TableHead>
                <TableHead className="text-left text-gray-500">
                  Net income
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow className="bg-gray-50 hover:bg-gray-50 border-gray-200">
                <TableCell className="font-medium text-gray-900">
                  Totals
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
                <TableCell className="text-left font-medium text-gray-900">
                  $40
                </TableCell>
              </TableRow>
              <TableRow className="border-gray-200">
                <TableCell className="text-gray-500">04/21/2025</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
                <TableCell className="text-left text-gray-500">--</TableCell>
              </TableRow>
              <TableRow className="border-gray-200">
                <TableCell className="text-gray-500">04/16/2025</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
                <TableCell className="text-left text-gray-500">$20</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
