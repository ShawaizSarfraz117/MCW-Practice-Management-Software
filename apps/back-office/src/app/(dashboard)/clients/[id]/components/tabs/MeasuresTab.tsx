"use client";

import { Button } from "@mcw/ui";
import { Alert, AlertTitle, AlertDescription } from "@mcw/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@mcw/ui";
import { Badge } from "@mcw/ui";
import { X, FileText, Plus } from "lucide-react";
import { useState, useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  ReferenceLine,
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

// Custom dot component for the highlighted data point
const CustomDot = (props: {
  cx?: number;
  cy?: number;
  payload?: { score: number };
}) => {
  const { cx, cy } = props;
  if (cx && cy) {
    return (
      <g>
        <circle
          cx={cx}
          cy={cy}
          fill="#f59e0b"
          r={6}
          stroke="white"
          strokeWidth={2}
        />
      </g>
    );
  }
  return null;
};

// Custom tooltip component
interface TooltipProps {
  active?: boolean;
  payload?: Array<{
    payload: {
      displayDate: string;
      score: number;
      severity?: string;
    };
  }>;
}

const CustomTooltip = ({ active, payload }: TooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-lg">
        <p className="text-sm font-medium">{data.displayDate}</p>
        <p className="text-sm">Score: {data.score}</p>
        {data.severity && (
          <p className="text-sm text-gray-600">Severity: {data.severity}</p>
        )}
      </div>
    );
  }
  return null;
};

// Severity level background component
const SeverityBackground = () => (
  <defs>
    <linearGradient id="severityGradient" x1="0" x2="0" y1="0" y2="1">
      <stop offset="0%" stopColor="#ef4444" stopOpacity={0.1} />
      <stop offset="33%" stopColor="#f97316" stopOpacity={0.1} />
      <stop offset="66%" stopColor="#22c55e" stopOpacity={0.1} />
      <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.1} />
    </linearGradient>
  </defs>
);

// Get color based on survey type
const getSurveyColor = (surveyName: string) => {
  if (surveyName.includes("GAD-7")) return "#f59e0b";
  if (surveyName.includes("PHQ-9")) return "#3b82f6";
  if (surveyName.includes("ARM-5")) return "#10b981";
  return "#6b7280";
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
  const [showNewMeasuresAlert, setShowNewMeasuresAlert] = useState(true);

  // Fetch survey answers for the client
  const { data: surveyAnswersData, isLoading } = useQuery({
    queryKey: ["surveyAnswers", clientId],
    queryFn: async () => {
      const response = await fetch(`/api/survey-answers?client_id=${clientId}`);
      if (!response.ok) throw new Error("Failed to fetch survey answers");
      return response.json();
    },
  });

  // Process survey data for charts
  const chartData = useMemo(() => {
    if (!surveyAnswersData?.data) return { gad7: [], phq9: [], arm5: [] };

    interface ChartDataPoint {
      date: string;
      displayDate: string;
      score: number;
      severity?: string;
    }

    const gad7Data: ChartDataPoint[] = [];
    const phq9Data: ChartDataPoint[] = [];
    const arm5Data: ChartDataPoint[] = [];

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
          arm5Data.push(dataPoint);
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

    return {
      gad7: filterByDateRange(chartData.gad7),
      phq9: filterByDateRange(chartData.phq9),
      arm5: filterByDateRange(chartData.arm5),
    };
  }, [chartData, selectedDateRangeDisplay, customStartDate, customEndDate]);

  // Get pending surveys
  const pendingSurveys =
    surveyAnswersData?.data?.filter(
      (answer: SurveyAnswer) =>
        answer.status === "PENDING" || answer.status === "IN_PROGRESS",
    ) || [];

  interface ChartDataPoint {
    date: string;
    displayDate: string;
    score: number;
    severity?: string;
  }

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

    return (
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-4">
            <h3 className="font-medium text-lg">{surveyType}</h3>
            <span className="text-lg font-medium">{latestScore}</span>
            {data[data.length - 1]?.severity && (
              <Badge variant="outline">{data[data.length - 1].severity}</Badge>
            )}
          </div>
          <div className="flex gap-4">
            {changeFromBaseline !== 0 && (
              <span
                className={`text-sm flex items-center ${changeFromBaseline < 0 ? "text-green-500" : "text-red-500"}`}
              >
                <span className="mr-1">
                  {changeFromBaseline < 0 ? "↓" : "↑"}
                </span>
                {Math.abs(changeFromBaseline)} since baseline
              </span>
            )}
            {changeFromLast !== 0 && (
              <span
                className={`text-sm flex items-center ${changeFromLast < 0 ? "text-green-500" : "text-red-500"}`}
              >
                <span className="mr-1">{changeFromLast < 0 ? "↓" : "↑"}</span>
                {Math.abs(changeFromLast)} since last
              </span>
            )}
          </div>
        </div>

        {/* Chart Container */}
        <div className="relative">
          <div className="flex">
            {/* Main Chart */}
            <div className="flex-1 h-[280px]">
              <ResponsiveContainer height="100%" width="100%">
                <LineChart
                  data={data}
                  margin={{ top: 20, right: 100, left: 20, bottom: 40 }}
                >
                  {surveyType !== "ARM-5" && <SeverityBackground />}
                  <CartesianGrid stroke="#e5e7eb" strokeDasharray="1 1" />

                  {/* Reference lines for severity levels */}
                  {surveyType === "GAD-7" && (
                    <>
                      <ReferenceLine
                        stroke="#ef4444"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={15}
                      />
                      <ReferenceLine
                        stroke="#f97316"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={10}
                      />
                      <ReferenceLine
                        stroke="#22c55e"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={5}
                      />
                    </>
                  )}
                  {surveyType === "PHQ-9" && (
                    <>
                      <ReferenceLine
                        stroke="#ef4444"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={20}
                      />
                      <ReferenceLine
                        stroke="#f97316"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={15}
                      />
                      <ReferenceLine
                        stroke="#fbbf24"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={10}
                      />
                      <ReferenceLine
                        stroke="#22c55e"
                        strokeDasharray="none"
                        strokeOpacity={0.3}
                        y={5}
                      />
                    </>
                  )}

                  <XAxis
                    axisLine={false}
                    dataKey="displayDate"
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />
                  <YAxis
                    axisLine={false}
                    domain={[0, maxScore]}
                    tick={{ fontSize: 12, fill: "#6b7280" }}
                    tickLine={false}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Line
                    dataKey="score"
                    dot={<CustomDot />}
                    stroke={getSurveyColor(surveyType)}
                    strokeWidth={2}
                    type="monotone"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Severity Level Labels */}
            {surveyType !== "ARM-5" && (
              <div className="flex flex-col justify-between h-[280px] py-8 ml-4">
                {surveyType === "GAD-7" && (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-8 bg-red-500 mr-2" />
                      <span className="text-sm text-gray-500">Severe</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-8 bg-orange-500 mr-2" />
                      <span className="text-sm text-gray-500">Moderate</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-8 bg-green-500 mr-2" />
                      <span className="text-sm text-gray-500">Mild</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-8 bg-teal-500 mr-2" />
                      <span className="text-sm text-gray-500">
                        None—minimal
                      </span>
                    </div>
                  </>
                )}
                {surveyType === "PHQ-9" && (
                  <>
                    <div className="flex items-center">
                      <div className="w-3 h-6 bg-red-500 mr-2" />
                      <span className="text-sm text-gray-500">Severe</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-6 bg-orange-500 mr-2" />
                      <span className="text-sm text-gray-500">
                        Moderately Severe
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-6 bg-yellow-500 mr-2" />
                      <span className="text-sm text-gray-500">Moderate</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-6 bg-green-500 mr-2" />
                      <span className="text-sm text-gray-500">Mild</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-3 h-6 bg-teal-500 mr-2" />
                      <span className="text-sm text-gray-500">
                        None-Minimal
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Data Summary */}
        <div className="mt-4 text-sm text-gray-500">
          Showing {data.length} data points for{" "}
          {selectedDateRangeDisplay === "Custom Range"
            ? customDateRange
            : selectedDateRangeDisplay.toLowerCase()}
        </div>
      </div>
    );
  };

  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* New Measures Available Alert */}
      {showNewMeasuresAlert && pendingSurveys.length === 0 && (
        <Alert className="mb-6 bg-white border-[#e5e7eb]">
          <div className="flex justify-between items-start">
            <div>
              <AlertTitle className="text-black font-medium mb-1">
                New measures available
              </AlertTitle>
              <AlertDescription className="text-gray-600">
                Track new measurements such as anxiety (GAD-7), depression
                (PHQ-9), or therapeutic alliance (ARM-5).
              </AlertDescription>
            </div>
            <Button
              className="text-gray-400 hover:text-gray-500"
              size="sm"
              variant="ghost"
              onClick={() => setShowNewMeasuresAlert(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            className="mt-3 bg-[#2d8467] hover:bg-[#236c53]"
            onClick={() => setAssignSurveyOpen(true)}
          >
            Assign measures
          </Button>
        </Alert>
      )}

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
          <Button
            onClick={() => setAssignSurveyOpen(true)}
            size="sm"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            Assign Survey
          </Button>
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
            renderChart(filteredChartData.arm5, "ARM-5", 35)}

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
