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
import {
  addDays,
  format,
  isAfter,
  isBefore,
  isSameMonth,
  isSameYear,
  parseISO,
  subDays,
  startOfMonth,
  endOfWeek,
  eachWeekOfInterval,
  eachMonthOfInterval,
  getMonth,
  getYear,
} from "date-fns";

const appointmentData = [
  { name: "Show", value: 18 },
  { name: "No Show", value: 2 },
  { name: "Canceled", value: 1 },
  { name: "Late Canceled", value: 1 },
  { name: "Clinician Canceled", value: 0 },
];
const appointmentLegend = [
  { name: "Show", color: "#4F46E5" },
  { name: "No Show", color: "#F59E0B" },
  { name: "Canceled", color: "#D1D5DB" },
  { name: "Late Canceled", color: "#22C55E" },
  { name: "Clinician Canceled", color: "#3B82F6" },
];

const notesData = [
  { name: "No Note", value: 2 },
  { name: "Unlocked", value: 8 },
  { name: "Supervision", value: 3 },
  { name: "Locked", value: 7 },
];
const NOTES_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#D1D5DB"];

// Generate 90 days of mock income data
const today = new Date();
const allIncomeData = Array.from({ length: 90 }).map((_, i) => {
  const date = addDays(today, -89 + i);
  return {
    date: format(date, "MMM d"),
    iso: format(date, "yyyy-MM-dd"),
    value: Math.floor(700 + Math.random() * 1000),
  };
});

type IncomeDatum = { date: string; iso: string; value: number };

function filterIncomeData(range: string) {
  const now = new Date();
  if (range === "This month") {
    return allIncomeData.filter(
      (d) =>
        isSameMonth(parseISO(d.iso), now) && isSameYear(parseISO(d.iso), now),
    );
  }
  if (range === "Last 30 days") {
    const start = subDays(now, 29);
    return allIncomeData.filter(
      (d) =>
        isAfter(parseISO(d.iso), subDays(start, 1)) &&
        isBefore(parseISO(d.iso), addDays(now, 1)),
    );
  }
  if (range === "Last month") {
    const lastMonth = subDays(startOfMonth(now), 1);
    return allIncomeData.filter(
      (d) =>
        isSameMonth(parseISO(d.iso), lastMonth) &&
        isSameYear(parseISO(d.iso), lastMonth),
    );
  }
  if (range === "This year") {
    return allIncomeData.filter((d) => isSameYear(parseISO(d.iso), now));
  }
  // Custom or fallback: show all
  return allIncomeData;
}

function getWeeklyData(data: IncomeDatum[]): { date: string; value: number }[] {
  // Group by week
  if (!data.length) return [];
  const first = parseISO(data[0].iso);
  const last = parseISO(data[data.length - 1].iso);
  const weeks = eachWeekOfInterval({ start: first, end: last });
  return weeks.map((weekStart) => {
    const weekEnd = endOfWeek(weekStart);
    const weekLabel = `${format(weekStart, "MMM d")}-${format(weekEnd, "MMM d")}`;
    const value = data
      .filter((d) => {
        const date = parseISO(d.iso);
        return date >= weekStart && date <= weekEnd;
      })
      .reduce((sum, d) => sum + d.value, 0);
    return { date: weekLabel, value };
  });
}

function getMonthlyData(
  data: IncomeDatum[],
): { date: string; value: number }[] {
  // Group by month
  if (!data.length) return [];
  const first = parseISO(data[0].iso);
  const last = parseISO(data[data.length - 1].iso);
  const months = eachMonthOfInterval({ start: first, end: last });
  return months.map((monthStart) => {
    const monthLabel = format(monthStart, "MMM yyyy");
    const value = data
      .filter((d) => {
        const date = parseISO(d.iso);
        return (
          getMonth(date) === getMonth(monthStart) &&
          getYear(date) === getYear(monthStart)
        );
      })
      .reduce((sum, d) => sum + d.value, 0);
    return { date: monthLabel, value };
  });
}

export function IncomeChart() {
  const [selectedRange, setSelectedRange] = useState("This month");
  const [customRange, setCustomRange] = useState<
    { startDate: string; endDate: string } | undefined
  >(undefined);

  let filteredData: IncomeDatum[] = [];
  if (selectedRange === "Custom" && customRange) {
    const start = parseISO(
      customRange.startDate.split("/").reverse().join("-"),
    );
    const end = parseISO(customRange.endDate.split("/").reverse().join("-"));
    filteredData = allIncomeData.filter((d) => {
      const date = parseISO(d.iso);
      return date >= start && date <= end;
    });
  } else {
    filteredData = filterIncomeData(selectedRange);
  }
  const total = filteredData.reduce((sum, d) => sum + d.value, 0);
  let chartData = [];
  if (["This month", "Last 30 days", "Last month"].includes(selectedRange)) {
    chartData = getWeeklyData(filteredData);
  } else {
    chartData = getMonthlyData(filteredData);
  }
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Income</h3>
          <p className="text-2xl font-semibold">${total.toLocaleString()}</p>
        </div>
        <Link
          href="/analytics/income"
          className="text-blue-500 text-sm hover:underline"
          aria-label="View income report"
        >
          View report
        </Link>
      </div>
      <div className="mb-4">
        <TimeRangeFilter
          selectedRange={selectedRange}
          onChange={setSelectedRange}
          customRange={customRange}
          onCustomRangeChange={setCustomRange}
        />
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 5, right: 5, left: 35, bottom: 15 }}
          >
            <CartesianGrid vertical={false} stroke="#f0f0f0" />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6B7280", fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Bar
              dataKey="value"
              fill="#3B82F6"
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function OutstandingBalancesChart() {
  return (
    <div className="bg-white  border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Outstanding balances</h3>
          <p className="text-2xl font-semibold">$300</p>
        </div>
        <Link
          href="/analytics/outstanding-balances"
          className="text-blue-500 text-sm hover:underline"
          aria-label="View outstanding balances report"
        >
          View report
        </Link>
      </div>
      <div className="space-y-3 mt-3">
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Clients</span>
            <span>$300</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 w-2/3" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Uninvoiced</span>
            <span>$150</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gray-400 w-1/3" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 mt-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>Unpaid</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-gray-400" />
          <span>Uninvoiced</span>
        </div>
      </div>
    </div>
  );
}

export function AppointmentsChart() {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Appointments</h3>
          <p className="text-2xl font-semibold">4</p>
        </div>
        <Link
          href="/analytics/attendance"
          className="text-blue-500 text-sm hover:underline"
          aria-label="View attendance report"
        >
          View report
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={appointmentData}
                innerRadius={35}
                outerRadius={45}
                fill="#4F46E5"
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                <Cell fill="#4F46E5" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-sm">
            <p className="font-medium">100%</p>
            <p className="text-gray-500">4 Show</p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          {appointmentLegend.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function NotesChart() {
  return (
    <div className="bg-white border rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Notes</h3>
          <p className="text-2xl font-semibold">12</p>
        </div>
        <Link
          href="/analytics/appointment-status"
          className="text-blue-500 text-sm hover:underline"
          aria-label="View notes report"
        >
          View report
        </Link>
      </div>
      <div className="flex items-center gap-6">
        <div className="relative w-32 h-32">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <Pie
                data={notesData}
                innerRadius={35}
                outerRadius={45}
                dataKey="value"
                startAngle={90}
                endAngle={450}
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
            <p className="text-gray-500">2 Notes</p>
          </div>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            <span>No Note</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
            <span>Unlocked</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
            <span>Supervision</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D1D5DB]" />
            <span>Locked</span>
          </div>
        </div>
      </div>
    </div>
  );
}
