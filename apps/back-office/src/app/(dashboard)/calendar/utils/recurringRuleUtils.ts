export function parseRecurringRule(rule: string) {
  if (!rule) return null;

  const parts = rule.split(";").reduce(
    (acc, part) => {
      const [key, value] = part.split("=");
      acc[key] = value;
      return acc;
    },
    {} as Record<string, string>,
  );

  return {
    period: parts.FREQ || "WEEKLY",
    frequency: parts.INTERVAL || "1",
    selectedDays: parts.BYDAY ? parts.BYDAY.split(",") : [],
    monthlyPattern: parts.BYMONTHDAY
      ? "onDateOfMonth"
      : parts.BYDAY?.includes("-1")
        ? "onLastWeekDayOfMonth"
        : "onWeekDayOfMonth",
    endType: parts.COUNT ? "After" : parts.UNTIL ? "On Date" : "After",
    endValue: parts.COUNT || (parts.UNTIL ? parts.UNTIL.slice(0, 8) : "7"),
  };
}
