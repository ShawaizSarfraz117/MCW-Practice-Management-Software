import { useState } from "react";
import { cn } from "@mcw/utils";

interface RecurringData {
  period: string;
  frequency: string;
  selectedDays: string[];
  monthlyPattern: string;
  endType: string;
  endValue: string;
}

interface RecurringSettingsProps {
  recurringData: RecurringData;
  onSave: (data: RecurringData) => void;
  activeDays?: string[];
}

export function RecurringSettings({
  recurringData,
  onSave,
  activeDays = [],
}: RecurringSettingsProps) {
  const [localData, setLocalData] = useState(recurringData);

  const handleChange = (changes: Partial<RecurringData>) => {
    const newData = { ...localData, ...changes };
    setLocalData(newData);
    onSave(newData);
  };

  const enabledDays =
    activeDays.length > 0
      ? activeDays
      : ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];

  return (
    <div className="mt-4 space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-32">
            <label className="text-[13px] text-[#717171] font-medium">
              Every
            </label>
            <input
              className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              min="1"
              type="number"
              value={localData.frequency}
              onChange={(e) => handleChange({ frequency: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <label className="text-[13px] text-[#717171] font-medium">
              Repeats
            </label>
            <select
              className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={localData.period}
              onChange={(e) =>
                handleChange({
                  period: e.target.value,
                  selectedDays:
                    e.target.value === "WEEKLY" ? [enabledDays[0]] : [],
                })
              }
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>

        {localData.period === "WEEKLY" && (
          <div>
            <label className="text-[13px] text-[#717171] font-medium">
              Repeat on
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {[
                { code: "SU", label: "S" },
                { code: "MO", label: "M" },
                { code: "TU", label: "T" },
                { code: "WE", label: "W" },
                { code: "TH", label: "T" },
                { code: "FR", label: "F" },
                { code: "SA", label: "S" },
              ].map(({ code, label }) => {
                const isEnabled = enabledDays.includes(code);
                return (
                  <button
                    key={code}
                    className={cn(
                      "flex-1 h-8 text-sm rounded-none border",
                      isEnabled
                        ? "border-gray-200 "
                        : "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed",
                      localData.selectedDays.includes(code) &&
                        isEnabled &&
                        "bg-[#16A34A] text-white border-[#16A34A]",
                    )}
                    disabled={!isEnabled}
                    onClick={() => {
                      if (!isEnabled) return;
                      const days = localData.selectedDays.includes(code)
                        ? localData.selectedDays.filter((d) => d !== code)
                        : [...localData.selectedDays, code];

                      const dayOrder = [
                        "SU",
                        "MO",
                        "TU",
                        "WE",
                        "TH",
                        "FR",
                        "SA",
                      ];
                      const sortedDays = days.sort(
                        (a, b) => dayOrder.indexOf(a) - dayOrder.indexOf(b),
                      );

                      handleChange({ selectedDays: sortedDays });
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {localData.period === "MONTHLY" && (
          <div>
            <label className="text-[13px] text-[#717171] font-medium">
              Repeats on
            </label>
            <select
              className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              value={localData.monthlyPattern}
              onChange={(e) => handleChange({ monthlyPattern: e.target.value })}
            >
              <option value="onDateOfMonth">Same date each month</option>
              <option value="onWeekDayOfMonth">Same weekday each month</option>
              <option value="onLastWeekDayOfMonth">
                Last weekday of month
              </option>
            </select>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-[13px] text-[#717171] font-medium">
                Ends
              </label>
              <select
                className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                value={localData.endType}
                onChange={(e) => {
                  const newEndType = e.target.value;
                  handleChange({
                    endType: newEndType,
                    endValue:
                      newEndType === "After"
                        ? "7"
                        : new Date().toISOString().split("T")[0],
                  });
                }}
              >
                <option value="After">After</option>
                <option value="On Date">On date</option>
              </select>
            </div>
            <div className="w-40">
              {localData.endType === "After" ? (
                <div>
                  <label className="text-[13px] text-[#717171] font-medium">
                    Events
                  </label>
                  <input
                    className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    min="1"
                    type="number"
                    value={localData.endValue}
                    onChange={(e) => handleChange({ endValue: e.target.value })}
                  />
                </div>
              ) : (
                <div>
                  <label className="text-[13px] text-[#717171] font-medium">
                    End date
                  </label>
                  <input
                    className="mt-1 block w-full rounded-[5px] border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                    type="date"
                    value={localData.endValue}
                    onChange={(e) => handleChange({ endValue: e.target.value })}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
