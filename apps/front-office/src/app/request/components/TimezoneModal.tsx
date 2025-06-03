import { useMemo, useState } from "react";

interface TimezoneModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (timezone: string) => void;
  currentTimezone: string;
}

interface TimezoneOption {
  value: string;
  label: string;
  city: string;
  timezone: string;
}

const timezoneOptions: TimezoneOption[] = [
  { value: "PKT", label: "Karachi", city: "Asia/Karachi", timezone: "PKT" },
  { value: "IST", label: "India", city: "Asia/Kolkata", timezone: "IST" },
  { value: "GMT", label: "London", city: "Europe/London", timezone: "GMT" },
  {
    value: "EST",
    label: "New York",
    city: "America/New_York",
    timezone: "EST",
  },
  {
    value: "PST",
    label: "Los Angeles",
    city: "America/Los_Angeles",
    timezone: "PST",
  },
];

export function TimezoneModal({
  isOpen,
  onClose,
  onUpdate,
  currentTimezone,
}: TimezoneModalProps) {
  const [selectedTimezone, setSelectedTimezone] = useState(currentTimezone);

  const timezoneOptionsWithTime = useMemo(() => {
    const now = new Date();

    return timezoneOptions.map((option) => {
      const formatter = new Intl.DateTimeFormat("en-US", {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: option.city,
      });

      const time = formatter.format(now).toLowerCase();
      return {
        ...option,
        displayText: `${option.label} • ${time}`,
      };
    });
  }, []);

  if (!isOpen) return null;

  const handleUpdate = () => {
    onUpdate(selectedTimezone);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-medium text-gray-900">
              Change timezone
            </h2>
            <button
              className="text-gray-400 hover:text-gray-500"
              onClick={onClose}
            >
              <svg
                className="h-6 w-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  d="M6 18L18 6M6 6l12 12"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                />
              </svg>
            </button>
          </div>

          <p className="text-gray-600 mb-4">
            Select which timezone to display appointment times below.
          </p>

          <div className="relative mb-6">
            <select
              className="w-full border rounded px-4 py-2 appearance-none bg-white pr-10 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              value={selectedTimezone}
              onChange={(e) => setSelectedTimezone(e.target.value)}
            >
              {timezoneOptionsWithTime.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.displayText}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
              <svg
                className="h-4 w-4 text-gray-400"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  clipRule="evenodd"
                  d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                  fillRule="evenodd"
                />
              </svg>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="px-4 py-2 text-gray-700 hover:text-gray-900 text-sm font-medium"
              onClick={onClose}
            >
              CANCEL
            </button>
            <button
              className="px-4 py-2 bg-green-700 text-white rounded text-sm font-medium hover:bg-green-800"
              onClick={handleUpdate}
            >
              UPDATE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
