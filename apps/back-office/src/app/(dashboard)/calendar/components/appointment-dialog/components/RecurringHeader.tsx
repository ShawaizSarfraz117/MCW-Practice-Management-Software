import Image from "next/image";
import RefreshIcon from "@/assets/images/refresh-icon.svg";

interface RecurringHeaderProps {
  isExpanded: boolean;
  onToggle: () => void;
  recurringRule: string | null | undefined;
}

function formatRecurringDays(rule: string) {
  if (!rule || !rule.includes("BYDAY")) return "";

  const daysMatch = rule.match(/BYDAY=([^;]+)/);
  if (!daysMatch) return "";

  const days = daysMatch[1].split(",");
  const dayNames = {
    MO: "Monday",
    TU: "Tuesday",
    WE: "Wednesday",
    TH: "Thursday",
    FR: "Friday",
    SA: "Saturday",
    SU: "Sunday",
  };

  return days.map((day) => dayNames[day as keyof typeof dayNames]).join(", ");
}

export function RecurringHeader({
  isExpanded,
  onToggle,
  recurringRule,
}: RecurringHeaderProps) {
  return (
    <div className="flex gap-2 bg-gray-100 px-2 py-3 relative rounded-[5px] text-[#717171]">
      <Image alt="" height={28} src={RefreshIcon} />
      <div className="text-[13px] flex-grow">
        {recurringRule ? (
          <>
            <p>
              Every{" "}
              {recurringRule.includes("INTERVAL=")
                ? recurringRule.match(/INTERVAL=(\d+)/)?.[1] || "1"
                : "1"}{" "}
              {recurringRule.includes("FREQ=WEEKLY")
                ? "Week(s)"
                : recurringRule.includes("FREQ=MONTHLY")
                  ? "Month(s)"
                  : recurringRule.includes("FREQ=DAILY")
                    ? "Day(s)"
                    : ""}
            </p>
            {recurringRule.includes("BYDAY") && (
              <p className="text-blue-500">
                On {formatRecurringDays(recurringRule)}
              </p>
            )}
            <p>
              {recurringRule.includes("COUNT=")
                ? `Ends after ${recurringRule.match(/COUNT=(\d+)/)?.[1]} events`
                : recurringRule.includes("UNTIL=")
                  ? `Ends on ${recurringRule.match(/UNTIL=(\d{8})/)?.[1]?.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}`
                  : "No end date"}
            </p>
          </>
        ) : (
          <p>Recurring appointment</p>
        )}
      </div>
      <button
        className="text-[#0a96d4] text-[13px] font-medium hover:text-[#0880b5]"
        onClick={onToggle}
      >
        {isExpanded ? "Done" : "Edit"}
      </button>
    </div>
  );
}
