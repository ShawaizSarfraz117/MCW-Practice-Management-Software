"use client";

import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import Link from "next/link";
import { useState } from "react";
import { TimeRangeFilter } from "./TimeRangeFilter";
// Chart colors
const appointmentLegend = [
  { name: "Show", color: "#4F46E5" },
  { name: "No Show", color: "#F59E0B" },
  { name: "Canceled", color: "#D1D5DB" },
  { name: "Late Canceled", color: "#22C55E" },
  { name: "Clinician Canceled", color: "#3B82F6" },
];

const NOTES_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#D1D5DB"];

// TODO: Remove mock data once API returns time-series data
// Mock data generation and helper functions are commented out
// as we're now using real API data

interface IncomeChartProps {
  analyticsData?: {
    income: number;
    incomeChart: Array<{ date: string; value: number }>;
  };
  isLoading?: boolean;
  onTimeRangeChange?: (timeRange: {
    range: "thisMonth" | "lastMonth" | "last30days" | "thisYear" | "custom";
    startDate?: string;
    endDate?: string;
  }) => void;
}

export function IncomeChart({
  analyticsData,
  isLoading,
  onTimeRangeChange,
}: IncomeChartProps) {
  const [selectedRange, setSelectedRange] = useState("This month");
  const [customRange, setCustomRange] = useState<
    { startDate: string; endDate: string } | undefined
  >(undefined);

  // Use API data
  const total = analyticsData?.income || 0;
  const chartData = analyticsData?.incomeChart || [];
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Income</h3>
          <p className="text-2xl font-semibold">
            {isLoading ? (
              <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              `$${total.toLocaleString()}`
            )}
          </p>
        </div>
        <Link
          aria-label="View income report"
          className="text-blue-500 text-sm hover:underline"
          href="/analytics/income"
        >
          View report
        </Link>
      </div>
      <div className="mb-4">
        <TimeRangeFilter
          customRange={customRange}
          selectedRange={selectedRange}
          onChange={(range) => {
            setSelectedRange(range);
            if (onTimeRangeChange) {
              const rangeMap: Record<
                string,
                "thisMonth" | "lastMonth" | "last30days" | "thisYear" | "custom"
              > = {
                "This month": "thisMonth",
                "Last month": "lastMonth",
                "Last 30 days": "last30days",
                "This year": "thisYear",
                Custom: "custom",
              };
              onTimeRangeChange({
                range: rangeMap[range] || "thisMonth",
                startDate: customRange?.startDate,
                endDate: customRange?.endDate,
              });
            }
          }}
          onCustomRangeChange={(range) => {
            setCustomRange(range);
            if (range && onTimeRangeChange) {
              onTimeRangeChange({
                range: "custom",
                startDate: range.startDate,
                endDate: range.endDate,
              });
            }
          }}
        />
      </div>
      <div className="h-64">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 35, bottom: 15 }}
          >
            <CartesianGrid stroke="#f0f0f0" vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickLine={false}
            />
            <YAxis
              axisLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
              tickLine={false}
            />
            <Bar
              dataKey="value"
              fill="#3B82F6"
              maxBarSize={40}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

interface OutstandingBalancesChartProps {
  analyticsData?: { outstanding: number; uninvoiced: number };
  isLoading?: boolean;
}

export function OutstandingBalancesChart({
  analyticsData,
  isLoading,
}: OutstandingBalancesChartProps) {
  const outstanding = Number(analyticsData?.outstanding) || 0;
  const uninvoiced = Number(analyticsData?.uninvoiced) || 0;
  const total = outstanding + uninvoiced;

  const outstandingPercent = total > 0 ? (outstanding / total) * 100 : 0;
  const uninvoicedPercent = total > 0 ? (uninvoiced / total) * 100 : 0;

  return (
    <div className="bg-white  border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Outstanding balances</h3>
          <p className="text-2xl font-semibold">
            {isLoading ? (
              <span className="inline-block h-6 w-24 bg-gray-200 rounded animate-pulse" />
            ) : (
              `$${total}`
            )}
          </p>
        </div>
        <Link
          aria-label="View outstanding balances report"
          className="text-blue-500 text-sm hover:underline"
          href="/analytics/outstanding-balances"
        >
          View report
        </Link>
      </div>
      <div className="space-y-3 mt-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Unpaid Invoices</span>
            <span>${outstanding.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-500"
              style={{ width: `${outstandingPercent}%` }}
            />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Uninvoiced</span>
            <span>${uninvoiced.toLocaleString()}</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gray-400"
              style={{ width: `${uninvoicedPercent}%` }}
            />
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Unpaid Invoices</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Uninvoiced Appointments</span>
        </div>
      </div>
    </div>
  );
}

interface AppointmentsChartProps {
  analyticsData?: {
    appointments: number;
    appointmentsChart: Array<{ name: string; value: number }>;
  };
  isLoading?: boolean;
}

export function AppointmentsChart({
  analyticsData,
  isLoading,
}: AppointmentsChartProps) {
  const totalAppointments = analyticsData?.appointments || 0;
  const appointmentData = analyticsData?.appointmentsChart || [];

  // Calculate the largest segment for center display
  const largestSegment = appointmentData.reduce(
    (max, item) => (item.value > max.value ? item : max),
    { name: "Show", value: 0 },
  );
  const largestPercent =
    totalAppointments > 0
      ? Math.round((largestSegment.value / totalAppointments) * 100)
      : 0;

  // Map appointment status names to colors
  const getColorForStatus = (name: string) => {
    const legend = appointmentLegend.find(
      (item) => item.name.toLowerCase() === name.toLowerCase(),
    );
    return legend?.color || "#D1D5DB";
  };

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Appointments</h3>
          <p className="text-2xl font-semibold">
            {isLoading ? (
              <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              totalAppointments
            )}
          </p>
        </div>
        <Link
          aria-label="View attendance report"
          className="text-blue-500 text-sm hover:underline"
          href="/analytics/attendance"
        >
          View report
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={appointmentData}
                dataKey="value"
                endAngle={450}
                fill="#4F46E5"
                innerRadius={35}
                outerRadius={45}
                startAngle={90}
              >
                {appointmentData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={getColorForStatus(entry.name)}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm">
            <p className="font-medium">{largestPercent}%</p>
            <p className="text-gray-500">
              {largestSegment.value} {largestSegment.name}
            </p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          {appointmentData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getColorForStatus(item.name) }}
              />
              <span>
                {item.name} ({item.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

interface NotesChartProps {
  analyticsData?: {
    notes: number;
    notesChart: Array<{ name: string; value: number }>;
  };
  isLoading?: boolean;
}

export function NotesChart({ analyticsData, isLoading }: NotesChartProps) {
  const totalNotes = analyticsData?.notes || 0;
  const notesData = analyticsData?.notesChart || [];

  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Notes</h3>
          <p className="text-2xl font-semibold">
            {isLoading ? (
              <span className="inline-block h-6 w-16 bg-gray-200 rounded animate-pulse" />
            ) : (
              totalNotes
            )}
          </p>
        </div>
        <Link
          aria-label="View notes report"
          className="text-blue-500 text-sm hover:underline"
          href="/analytics/appointment-status"
        >
          View report
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <ResponsiveContainer height="100%" width="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={notesData}
                dataKey="value"
                endAngle={450}
                innerRadius={35}
                outerRadius={45}
                startAngle={90}
              >
                {notesData.map((entry, index) => (
                  <Cell
                    key={`cell-${entry.name}-${index}`}
                    fill={NOTES_COLORS[index]}
                  />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm">
            <p className="font-medium">100%</p>
            <p className="text-gray-500">{totalNotes} Notes</p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          {notesData.map((entry, index) => (
            <div key={entry.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{
                  backgroundColor: NOTES_COLORS[index % NOTES_COLORS.length],
                }}
              />
              <span>{entry.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
