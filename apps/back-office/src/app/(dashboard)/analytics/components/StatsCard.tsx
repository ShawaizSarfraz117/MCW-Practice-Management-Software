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

const incomeData = [
  { date: "Feb 1", value: 250 },
  { date: "Feb 2", value: 400 },
  { date: "Feb 3", value: 600 },
  { date: "Feb 4", value: 500 },
  { date: "Feb 5", value: 1000 },
  { date: "Feb 6", value: 450 },
  { date: "Feb 7", value: 300 },
];

const appointmentData = [{ name: "Show", value: 4 }];
const appointmentLegend = [
  { name: "Show", color: "#4F46E5" },
  { name: "No Show", color: "#F59E0B" },
  { name: "Canceled", color: "#D1D5DB" },
  { name: "Late Canceled", color: "#22C55E" },
  { name: "Clinician Canceled", color: "#3B82F6" },
];

const notesData = [
  { name: "No Note", value: 1 },
  { name: "Unlocked", value: 1 },
  { name: "Supervision", value: 0 },
  { name: "Locked", value: 0 },
];
const NOTES_COLORS = ["#22C55E", "#3B82F6", "#F59E0B", "#D1D5DB"];

export function IncomeChart() {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Income</h3>
          <p className="text-2xl font-semibold">$100</p>
        </div>
        <button className="text-blue-500 text-sm hover:underline">
          View report
        </button>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={incomeData}
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Outstanding balances</h3>
          <p className="text-2xl font-semibold">$300</p>
        </div>
        <button className="text-blue-500 text-sm hover:underline">
          View report
        </button>
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Appointments</h3>
          <p className="text-2xl font-semibold">4</p>
        </div>
        <button className="text-blue-500 text-sm hover:underline">
          View report
        </button>
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
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-gray-500">Notes</h3>
          <p className="text-2xl font-semibold">12</p>
        </div>
        <button className="text-blue-500 text-sm hover:underline">
          View report
        </button>
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
