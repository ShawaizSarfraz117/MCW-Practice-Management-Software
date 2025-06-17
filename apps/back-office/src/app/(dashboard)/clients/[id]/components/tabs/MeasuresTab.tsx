"use client";

import { Button } from "@mcw/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mcw/ui";
import { Badge } from "@mcw/ui";
import { FileText } from "lucide-react";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
} from "recharts";
import DateRangePicker from "@/(dashboard)/activity/components/DateRangePicker";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";
import { formatDistanceToNow } from "date-fns";
import AssignSurveyDialog from "./AssignSurveyDialog";
import CompleteSurveyDialog from "./CompleteSurveyDialog";

interface SurveyScore {
  totalScore: number;
  severity?: string;
  interpretation?: string;
  flaggedItems?: string[];
  // ARM-5 specific subscale scores
  bond?: number;
  partnership?: number;
  confidence?: number;
}

interface SurveyAnswer {
  id: string;
  template_id: string;
  client_id: string;
  content?: Record<string, unknown>;
  score?: SurveyScore;
  status: string;
  assigned_at: string;
  completed_at?: string;
  SurveyTemplate: {
    id: string;
    name: string;
    type: string;
    description: string;
  };
}

interface MeasuresTabProps {
  clientId: string;
}

interface ChartDataPoint {
  date: string;
  displayDate: string;
  score: number;
  severity?: string;
}

interface ARM5DataPoint {
  date: string;
  displayDate: string;
  month: string;
  bond: number;
  partnership: number;
  confidence: number;
  total: number;
}

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
      startDate = new Date(2020, 0, 1);
      break;
  }

  return { startDate, endDate };
};

export default function MeasuresTab({ clientId }: MeasuresTabProps) {
  const queryClient = useQueryClient();
  const [dateRangePickerOpen, setDateRangePickerOpen] = useState(false);
  const [selectedDateRangeDisplay, setSelectedDateRangeDisplay] =
    useState<string>("All time");
  const [customDateRange, setCustomDateRange] = useState<string>("");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [assignSurveyOpen, setAssignSurveyOpen] = useState(false);
  const [completeSurveyOpen, setCompleteSurveyOpen] = useState(false);
  const [selectedSurveyAnswer, setSelectedSurveyAnswer] =
    useState<SurveyAnswer | null>(null);

  // Fetch survey answers for the client
  const { data: surveyAnswersData, isLoading } = useQuery({
    queryKey: ["surveyAnswers", clientId],
    queryFn: async () => {
      // Note: clientId here is actually the client_group_id from the URL
      const response = await fetch(
        `/api/survey-answers?client_group_id=${clientId}`,
      );
      if (!response.ok) throw new Error("Failed to fetch survey answers");
      return response.json();
    },
  });

  // Process survey data for charts
  const chartData = useMemo(() => {
    if (!surveyAnswersData?.data) return { gad7: [], phq9: [], arm5: [] };

    const gad7Data: ChartDataPoint[] = [];
    const phq9Data: ChartDataPoint[] = [];
    const arm5Data: ARM5DataPoint[] = [];

    surveyAnswersData.data
      .filter(
        (answer: SurveyAnswer) => answer.status === "COMPLETED" && answer.score,
      )
      .sort(
        (a: SurveyAnswer, b: SurveyAnswer) =>
          new Date(a.completed_at!).getTime() -
          new Date(b.completed_at!).getTime(),
      )
      .forEach((answer: SurveyAnswer) => {
        const date = new Date(answer.completed_at!);
        const dataPoint = {
          date: date.toISOString().split("T")[0],
          displayDate: date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          score: answer.score?.totalScore || 0,
          severity: answer.score?.severity,
        };

        if (answer.SurveyTemplate.name.includes("GAD-7")) {
          gad7Data.push(dataPoint);
        } else if (answer.SurveyTemplate.name.includes("PHQ-9")) {
          phq9Data.push(dataPoint);
        } else if (answer.SurveyTemplate.name.includes("ARM-5")) {
          // Extract individual scores from content
          const content = answer.content as Record<string, string>;
          const scoreMap: Record<string, number> = {
            "Item 1": 1,
            "Item 2": 2,
            "Item 3": 3,
            "Item 4": 4,
            "Item 5": 5,
            "Item 6": 6,
            "Item 7": 7,
          };

          // ARM-5 Sub-scale mapping based on the documentation:
          // Bond: Question 1 (arm5_q1)
          // Partnership: Questions 2-3 (arm5_q2, arm5_q3 average)
          // Confidence: Questions 4-5 (arm5_q4, arm5_q5 average)
          const bond = scoreMap[content?.arm5_q1] || 0;
          const partnership =
            ((scoreMap[content?.arm5_q2] || 0) +
              (scoreMap[content?.arm5_q3] || 0)) /
            2;
          const confidence =
            ((scoreMap[content?.arm5_q4] || 0) +
              (scoreMap[content?.arm5_q5] || 0)) /
            2;
          const total = (bond + partnership + confidence) / 3;

          arm5Data.push({
            date: date.toISOString().split("T")[0],
            displayDate: date.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
            }),
            month: date.toLocaleDateString("en-US", {
              month: "short",
            }),
            bond,
            partnership,
            confidence,
            total,
          });
        }
      });

    return { gad7: gad7Data, phq9: phq9Data, arm5: arm5Data };
  }, [surveyAnswersData]);

  // Filter data based on selected date range
  const filteredChartData = useMemo(() => {
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

    const filterByDateRange = (data: ChartDataPoint[]) => {
      return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    };

    const filterARM5ByDateRange = (data: ARM5DataPoint[]) => {
      return data.filter((item) => {
        const itemDate = new Date(item.date);
        return itemDate >= startDate && itemDate <= endDate;
      });
    };

    return {
      gad7: filterByDateRange(chartData.gad7),
      phq9: filterByDateRange(chartData.phq9),
      arm5: filterARM5ByDateRange(chartData.arm5),
    };
  }, [chartData, selectedDateRangeDisplay, customStartDate, customEndDate]);

  // Get pending surveys
  const pendingSurveys =
    surveyAnswersData?.data?.filter(
      (answer: SurveyAnswer) =>
        answer.status === "PENDING" || answer.status === "IN_PROGRESS",
    ) || [];

  const renderChart = (
    data: ChartDataPoint[],
    surveyType: string,
    maxScore: number,
  ) => {
    if (data.length === 0) return null;

    const latestScore = data[data.length - 1]?.score;
    const firstScore = data[0]?.score;
    const previousScore =
      data.length > 1 ? data[data.length - 2]?.score : firstScore;
    const changeFromBaseline = latestScore - firstScore;
    const changeFromLast = latestScore - previousScore;

    // Custom Y-axis ticks for GAD-7 and PHQ-9
    let yAxisTicks: number[] = [];
    if (surveyType === "GAD-7") {
      yAxisTicks = [0, 5, 10, 15, 21];
    } else if (surveyType === "PHQ-9") {
      yAxisTicks = [0, 5, 10, 15, 20, 27];
    }

    return (
      <Card className="mb-6 rounded-xl border border-gray-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-6">
            {/* Left section with title and stats (modern, compact) */}
            <div className="w-28">
              <h3 className="font-medium text-base mb-2">{surveyType}</h3>
              <div className="space-y-1 text-sm">
                <div
                  className={`flex items-center ${changeFromBaseline < 0 ? "text-green-600" : changeFromBaseline > 0 ? "text-red-600" : "text-gray-600"}`}
                >
                  <span className="mr-1">
                    {changeFromBaseline < 0
                      ? "↓"
                      : changeFromBaseline > 0
                        ? "↑"
                        : ""}
                  </span>
                  <span>
                    {changeFromBaseline === 0
                      ? "0"
                      : Math.abs(changeFromBaseline)}{" "}
                    since baseline
                  </span>
                </div>
                <div
                  className={`flex items-center ${changeFromLast < 0 ? "text-green-600" : changeFromLast > 0 ? "text-red-600" : "text-gray-600"}`}
                >
                  <span className="mr-1">
                    {changeFromLast < 0 ? "↓" : changeFromLast > 0 ? "↑" : ""}
                  </span>
                  <span>
                    {changeFromLast === 0 ? "0" : Math.abs(changeFromLast)}{" "}
                    since last
                  </span>
                </div>
              </div>
            </div>
            {/* Chart section (horizontal, modern) */}
            <div className="flex-1">
              <div className="flex items-start">
                {/* Main chart */}
                <div className="flex-1 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="displayDate"
                        axisLine={{ stroke: "#9ca3af" }}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: "#6b7280" }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        domain={[0, maxScore]}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                        width={24}
                        ticks={yAxisTicks.length > 0 ? yAxisTicks : undefined}
                      />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-2 border border-gray-200 rounded shadow-lg">
                                <p className="text-xs font-medium">
                                  {data.displayDate}
                                </p>
                                <p className="text-xs">Score: {data.score}</p>
                                {data.severity && (
                                  <p className="text-xs text-gray-600">
                                    Severity: {data.severity}
                                  </p>
                                )}
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#6b7280"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const isLast =
                            data.indexOf(payload) === data.length - 1;
                          if (cx && cy) {
                            if (isLast) {
                              return (
                                <g key={`last-${cx}-${cy}`}>
                                  <circle
                                    cx={cx}
                                    cy={cy}
                                    r={8}
                                    fill="#22c55e"
                                    stroke="white"
                                    strokeWidth={2}
                                  />
                                  <text
                                    x={cx}
                                    y={cy}
                                    textAnchor="middle"
                                    dominantBaseline="middle"
                                    fill="white"
                                    fontSize="11"
                                    fontWeight="500"
                                  >
                                    {payload.score}
                                  </text>
                                </g>
                              );
                            }
                            return (
                              <g key={`dot-${cx}-${cy}`}>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={3.5}
                                  fill="white"
                                  stroke="#6b7280"
                                  strokeWidth={1.5}
                                />
                                <circle cx={cx} cy={cy} r={2} fill="#6b7280" />
                              </g>
                            );
                          }
                          return (
                            <g key={`empty-${cx}-${cy}`}>
                              <circle cx={0} cy={0} r={0} fill="transparent" />
                            </g>
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Severity scale (thin, modern, small labels) */}
                <div className="flex items-center">
                  <div className="flex items-stretch h-[220px]">
                    <div className="w-1 rounded overflow-hidden relative">
                      {surveyType === "GAD-7" ? (
                        <div
                          className="h-full"
                          style={{
                            background:
                              "linear-gradient(to bottom, #ef4444 0%, #ef4444 28.5%, #f59e0b 28.5%, #f59e0b 52.5%, #22c55e 52.5%, #22c55e 76%, #06b6d4 76%, #06b6d4 100%)",
                          }}
                        />
                      ) : (
                        <div
                          className="h-full"
                          style={{
                            background:
                              "linear-gradient(to bottom, #dc2626 0%, #dc2626 25.9%, #f87171 25.9%, #f87171 44.4%, #f59e0b 44.4%, #f59e0b 63%, #fbbf24 63%, #fbbf24 81.5%, #22c55e 81.5%, #22c55e 100%)",
                          }}
                        />
                      )}
                    </div>
                    <div className="ml-2 flex flex-col justify-between text-xs text-gray-600">
                      {surveyType === "GAD-7" ? (
                        <>
                          <span>Severe</span>
                          <span>Moderate</span>
                          <span>Mild</span>
                          <span>None</span>
                        </>
                      ) : (
                        <>
                          <span>Severe</span>
                          <span>Mod. severe</span>
                          <span>Moderate</span>
                          <span>Mild</span>
                          <span>None</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Custom tooltip for ARM-5
  const ARM5CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: ARM5DataPoint }>;
  }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
          <p className="text-sm font-medium">{data.displayDate}</p>
          <p className="text-sm">Bond: {data.bond}</p>
          <p className="text-sm">Partnership: {data.partnership}</p>
          <p className="text-sm">Confidence: {data.confidence.toFixed(1)}</p>
          <p className="text-sm font-medium">Total: {data.total.toFixed(1)}</p>
        </div>
      );
    }
    return null;
  };

  const renderARM5Chart = (data: ARM5DataPoint[]) => {
    if (data.length === 0) return null;

    const latestData = data[data.length - 1];
    const firstData = data[0];
    const previousData = data.length > 1 ? data[data.length - 2] : firstData;

    const totalChangeFromBaseline = latestData.total - firstData.total;
    const totalChangeFromLast = latestData.total - previousData.total;

    return (
      <Card className="mb-6 rounded-xl border border-gray-200 bg-white">
        <CardContent className="p-5">
          <div className="flex items-start gap-6">
            {/* Left stats */}
            <div className="w-28">
              <h3 className="font-medium text-base mb-2">ARM-5</h3>
              <div className="mb-2 font-semibold text-[17px]">Total:</div>
              <div className="space-y-1 text-sm">
                <div
                  className={`flex items-center ${totalChangeFromBaseline < 0 ? "text-red-600" : totalChangeFromBaseline > 0 ? "text-green-600" : "text-gray-600"}`}
                >
                  <span className="mr-1">
                    {totalChangeFromBaseline < 0
                      ? "↓"
                      : totalChangeFromBaseline > 0
                        ? "↑"
                        : ""}
                  </span>
                  <span>
                    {Math.abs(totalChangeFromBaseline).toFixed(1)} since
                    baseline
                  </span>
                </div>
                <div
                  className={`flex items-center ${totalChangeFromLast < 0 ? "text-red-600" : totalChangeFromLast > 0 ? "text-green-600" : "text-gray-600"}`}
                >
                  <span className="mr-1">
                    {totalChangeFromLast < 0
                      ? "↓"
                      : totalChangeFromLast > 0
                        ? "↑"
                        : ""}
                  </span>
                  <span>
                    {Math.abs(totalChangeFromLast).toFixed(1)} since last
                  </span>
                </div>
              </div>
            </div>
            {/* Chart and legend */}
            <div className="flex-1">
              <div className="flex items-start">
                {/* Main chart */}
                <div className="flex-1 h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={data}
                      margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="#e5e7eb"
                        strokeDasharray="0"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="month"
                        axisLine={{ stroke: "#9ca3af" }}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#6b7280" }}
                        ticks={[...new Set(data.map((d) => d.month))]}
                      />
                      <YAxis
                        domain={[0, 7]}
                        tick={{ fontSize: 11, fill: "#6b7280" }}
                        axisLine={{ stroke: "#e5e7eb" }}
                        tickLine={false}
                        width={24}
                        ticks={[0, 1, 2, 3, 4, 5, 6, 7]}
                      />
                      <Tooltip content={<ARM5CustomTooltip />} />
                      {/* Total line (blue) - Circle */}
                      <Line
                        type="monotone"
                        dataKey="total"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy } = props;
                          if (cx && cy) {
                            return (
                              <g key={`total-${cx}-${cy}`}>
                                <circle
                                  cx={cx}
                                  cy={cy}
                                  r={5}
                                  fill="#3b82f6"
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              </g>
                            );
                          }
                          return (
                            <g key={`total-empty-${cx}-${cy}`}>
                              <circle cx={0} cy={0} r={0} fill="transparent" />
                            </g>
                          );
                        }}
                      />

                      {/* Bond line (red) - Diamond */}
                      <Line
                        type="monotone"
                        dataKey="bond"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy } = props;
                          if (cx && cy) {
                            return (
                              <g key={`bond-${cx}-${cy}`}>
                                <polygon
                                  points={`${cx},${cy - 5} ${cx + 5},${cy} ${cx},${cy + 5} ${cx - 5},${cy}`}
                                  fill="#ef4444"
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              </g>
                            );
                          }
                          return (
                            <g key={`bond-empty-${cx}-${cy}`}>
                              <circle cx={0} cy={0} r={0} fill="transparent" />
                            </g>
                          );
                        }}
                      />

                      {/* Partnership line (purple) - Triangle */}
                      <Line
                        type="monotone"
                        dataKey="partnership"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy } = props;
                          if (cx && cy) {
                            return (
                              <g key={`partnership-${cx}-${cy}`}>
                                <polygon
                                  points={`${cx},${cy - 5} ${cx + 4.5},${cy + 4} ${cx - 4.5},${cy + 4}`}
                                  fill="#8b5cf6"
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              </g>
                            );
                          }
                          return (
                            <g key={`partnership-empty-${cx}-${cy}`}>
                              <circle cx={0} cy={0} r={0} fill="transparent" />
                            </g>
                          );
                        }}
                      />

                      {/* Confidence line (cyan) - Square */}
                      <Line
                        type="monotone"
                        dataKey="confidence"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy } = props;
                          if (cx && cy) {
                            return (
                              <g key={`confidence-${cx}-${cy}`}>
                                <rect
                                  x={cx - 4.5}
                                  y={cy - 4.5}
                                  width={9}
                                  height={9}
                                  fill="#06b6d4"
                                  stroke="white"
                                  strokeWidth={1}
                                />
                              </g>
                            );
                          }
                          return (
                            <g key={`confidence-empty-${cx}-${cy}`}>
                              <circle cx={0} cy={0} r={0} fill="transparent" />
                            </g>
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend with different shapes */}
                <div className="ml-6 flex items-center">
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <circle cx="6" cy="6" r="4" fill="#3b82f6" />
                      </svg>
                      <span>Total</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <polygon points="6,1 11,6 6,11 1,6" fill="#ef4444" />
                      </svg>
                      <span>Bond</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <polygon points="6,2 9,10 3,10" fill="#8b5cf6" />
                      </svg>
                      <span>Partnership</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg width="12" height="12" viewBox="0 0 12 12">
                        <rect x="2" y="2" width="8" height="8" fill="#06b6d4" />
                      </svg>
                      <span>Confidence</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Pending Surveys */}
      {pendingSurveys.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium text-lg mb-3">Pending Assessments</h3>
          <div className="grid gap-3">
            {pendingSurveys.map((survey: SurveyAnswer) => (
              <Card
                key={survey.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => {
                  setSelectedSurveyAnswer(survey);
                  setCompleteSurveyOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-base">
                        {survey.SurveyTemplate.name}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Assigned{" "}
                        {formatDistanceToNow(new Date(survey.assigned_at))} ago
                      </CardDescription>
                    </div>
                    <Badge
                      variant={
                        survey.status === "IN_PROGRESS"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {survey.status === "IN_PROGRESS"
                        ? "In Progress"
                        : "Pending"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <Button variant="outline" size="sm" className="w-full">
                    {survey.status === "IN_PROGRESS" ? "Continue" : "Start"}{" "}
                    Assessment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Date Range Picker */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-auto max-w-[200px]">
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
              onClose={() => setDateRangePickerOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* Charts */}
      {isLoading ? (
        <div className="text-center py-8 text-gray-500">
          Loading survey data...
        </div>
      ) : (
        <>
          {filteredChartData.gad7.length > 0 &&
            renderChart(filteredChartData.gad7, "GAD-7", 21)}
          {filteredChartData.phq9.length > 0 &&
            renderChart(filteredChartData.phq9, "PHQ-9", 27)}
          {filteredChartData.arm5.length > 0 &&
            renderARM5Chart(filteredChartData.arm5)}

          {filteredChartData.gad7.length === 0 &&
            filteredChartData.phq9.length === 0 &&
            filteredChartData.arm5.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No completed assessments for the selected date range.</p>
                <p className="text-sm mt-1">
                  Assign a new survey to get started.
                </p>
              </div>
            )}
        </>
      )}

      {/* Dialogs */}
      <AssignSurveyDialog
        open={assignSurveyOpen}
        onOpenChange={setAssignSurveyOpen}
        clientId={clientId}
        onSuccess={() => {
          queryClient.invalidateQueries({
            queryKey: ["surveyAnswers", clientId],
          });
          toast({
            title: "Survey assigned",
            description: "The survey has been assigned to the client.",
          });
        }}
      />

      {selectedSurveyAnswer && (
        <CompleteSurveyDialog
          open={completeSurveyOpen}
          onOpenChange={setCompleteSurveyOpen}
          surveyAnswer={selectedSurveyAnswer}
          onSuccess={() => {
            queryClient.invalidateQueries({
              queryKey: ["surveyAnswers", clientId],
            });
            setCompleteSurveyOpen(false);
            setSelectedSurveyAnswer(null);
            toast({
              title: "Survey completed",
              description: "The survey has been completed and scored.",
            });
          }}
        />
      )}
    </div>
  );
}
