import { Button } from "@mcw/ui";
import { Alert, AlertTitle, AlertDescription } from "@mcw/ui";
import { X } from "lucide-react";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
  Dot,
} from "recharts";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";

// Extended sample data for GAD-7 chart with more data points
const allGadData = [
  { date: "2024-12-01", score: 18, displayDate: "Dec 1" },
  { date: "2024-12-15", score: 16, displayDate: "Dec 15" },
  { date: "2025-01-05", score: 15, displayDate: "Jan 5" },
  { date: "2025-01-20", score: 17, displayDate: "Jan 20" },
  { date: "2025-02-03", score: 14, displayDate: "Feb 3" },
  { date: "2025-02-18", score: 12, displayDate: "Feb 18" },
  { date: "2025-03-10", score: 16, displayDate: "Mar 10" },
  { date: "2025-03-14", score: 14, displayDate: "Mar 14" },
  { date: "2025-03-17", score: 14, displayDate: "Mar 17" },
];

// Helper function to get date range based on selection
const getDateRangeFromSelection = (selection: string) => {
  const now = new Date();
  let startDate = new Date();
  let endDate = new Date(now);

  switch (selection) {
    case "All time":
      startDate = new Date(2020, 0, 1);
      break;
    case "Last 30 days":
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      break;
    case "This Month":
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "Last Month":
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      break;
    case "This Year":
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case "Last Year":
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      endDate = new Date(now.getFullYear() - 1, 11, 31);
      break;
    default:
      // For custom ranges, we'll handle this separately
      startDate = new Date(2020, 0, 1);
      break;
  }

  return { startDate, endDate };
};

// Custom dot component for the highlighted data point
const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: { score: number };
}) => {
  const { cx, cy, payload } = props;
  if (payload?.score === 14 && cx && cy) {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          r={12}
          fill="#f59e0b"
          stroke="white"
          strokeWidth={2}
        />
        <text
          x={cx}
          y={cy + 4}
          textAnchor="middle"
          fill="white"
          fontSize="12"
          fontWeight="bold"
        >
          {payload.score}
        </text>
      </g>
    );
  }
  return <Dot cx={cx} cy={cy} r={4} fill="#f59e0b" />;
};

// Severity level background component
const SeverityBackground = () => (
  <defs>
    <linearGradient id="severityGradient" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
      <stop offset="33%" stopColor="#f97316" stopOpacity={0.1} />
      <stop offset="66%" stopColor="#22c55e" stopOpacity={0.1} />
      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1} />
    </linearGradient>
  </defs>
);

export default function MeasuresTab() {
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedDateRangeDisplay, setSelectedDateRangeDisplay] =
    useState<string>("All time");
  const [customDateRange, setCustomDateRange] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");

  // Filter data based on selected date range
  const filteredGadData = useMemo(() => {
    let startDate: Date;
    let endDate: Date;

    if (
      selectedDateRangeDisplay === "Custom Range" &&
      customStartDate &&
      customEndDate
    ) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      const range = getDateRangeFromSelection(selectedDateRangeDisplay);
      startDate = range.startDate;
      endDate = range.endDate;
    }

    return allGadData.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= endDate;
    });
  }, [selectedDateRangeDisplay, customStartDate, customEndDate]);

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* New Measures Available Alert */}
      <Alert className="mb-6 bg-white border-[#e5e7eb]">
        <div className="flex justify-between items-start">
          <div>
            <AlertTitle className="text-black font-medium mb-1">
              New measures available
            </AlertTitle>
            <AlertDescription className="text-gray-600">
              Track new measurements such as therapeutic alliance, pain,
              functioning, or other symptoms.
            </AlertDescription>
          </div>
          <Button
            className="text-gray-400 hover:text-gray-500"
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <Button className="mt-3 bg-[#2d8467] hover:bg-[#236c53]">
          View measures
        </Button>
      </Alert>

      {/* Completed Measure */}
      <div className="mb-6">
        <div className="relative w-auto max-w-[200px] mb-4">
          <div
            className="w-auto h-9 bg-white border-[#e5e7eb] border rounded cursor-pointer flex items-center px-3 text-sm whitespace-nowrap"
            onClick={() => setDateRangePickerOpen(true)}
          >
            {selectedDateRangeDisplay === "Custom Range"
              ? customDateRange
              : selectedDateRangeDisplay}
          </div>
          <DateRangePicker
            isOpen={dateRangePickerOpen}
            onClose={() => setDateRangePickerOpen(false)}
            onApply={(startDate, endDate, displayOption) => {
              setSelectedDateRangeDisplay(displayOption);
              if (displayOption === "Custom Range") {
                setCustomDateRange(`${startDate} - ${endDate}`);
                setCustomStartDate(startDate);
                setCustomEndDate(endDate);
              } else {
                setCustomStartDate("");
                setCustomEndDate("");
              }
              setDateRangePickerOpen(false);
            }}
            onCancel={() => setDateRangePickerOpen(false)}
          />
        </div>

        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-lg">GAD-7</h3>
            <span className="text-lg font-medium">
              {filteredGadData.length > 0
                ? filteredGadData[filteredGadData.length - 1].score
                : "N/A"}
            </span>
          </div>
          <div className="flex gap-4">
            <span className="text-green-500 text-sm flex items-center">
              <span className="mr-1">↓</span> 2 since baseline
            </span>
            <span className="text-green-500 text-sm flex items-center">
              <span className="mr-1">↓</span> 2 since last
            </span>
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative">
          <div className="flex">
            {/* Main Chart */}
            <div className="flex-1 h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={filteredGadData}
                  margin={{ top: 20, right: 100, left: 20, bottom: 40 }}
                >
                  <SeverityBackground />
                  <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" />

                  {/* Reference lines for severity levels */}
                  <ReferenceLine
                    y={15}
                    stroke="#ef4444"
                    strokeDasharray="none"
                    strokeOpacity={0.3}
                  />
                  <ReferenceLine
                    y={10}
                    stroke="#f97316"
                    strokeDasharray="none"
                    strokeOpacity={0.3}
                  />
                  <ReferenceLine
                    y={5}
                    stroke="#22c55e"
                    strokeDasharray="none"
                    strokeOpacity={0.3}
                  />

                  <XAxis
                    dataKey="displayDate"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />
                  <YAxis
                    domain={[0, 21]}
                    ticks={[0, 5, 10, 15, 21]}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                  />

                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#f59e0b"
                    strokeWidth={2}
                    dot={<CustomDot />}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Level Labels */}
            <div className="flex flex-col justify-between h-[280px] py-8 ml-4">
              <div className="flex items-center">
                <div className="w-3 h-8 bg-red-500 mr-2"></div>
                <span className="text-sm text-gray-500">Severe</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-8 bg-orange-500 mr-2"></div>
                <span className="text-sm text-gray-500">Moderate</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-8 bg-green-500 mr-2"></div>
                <span className="text-sm text-gray-500">Mild</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-8 bg-teal-500 mr-2"></div>
                <span className="text-sm text-gray-500">None—minimal</span>
              </div>
            </div>
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {filteredGadData.length} data points for{" "}
          {selectedDateRangeDisplay === "Custom Range"
            ? customDateRange
            : selectedDateRangeDisplay.toLowerCase()}
        </div>
      </div>
    </div>
  );
}
