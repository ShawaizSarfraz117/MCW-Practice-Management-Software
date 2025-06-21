import { Button } from "@mcw/ui";

export function PracticeSettingsStep({
  startTime,
  setStartTime,
  requestBefore,
  setRequestBefore,
  requestAdvance,
  setRequestAdvance,
  onNext,
}: {
  startTime: string;
  setStartTime: (value: string) => void;
  requestBefore: string;
  setRequestBefore: (value: string) => void;
  requestAdvance: string;
  setRequestAdvance: (value: string) => void;
  onNext: () => void;
}) {
  return (
    <>
      <div className="flex-1 px-4 md:px-8 pb-8">
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 md:p-8">
          <div className="font-semibold text-[#1F2937] text-lg mb-1">
            Practice Settings
          </div>
          <div className="text-sm text-[#6B7280] mb-6">
            Practice settings are managed by team members with administrator
            access
          </div>
          <div className="font-semibold text-[#1F2937] text-base mb-1">
            Scheduling preferences
          </div>
          <div className="text-sm text-[#6B7280] mb-6">
            Apply to all online appointment requests at your practice
          </div>
          <div className="mb-6">
            <label className="block text-sm text-[#374151] font-medium mb-2">
              Appointment start times
            </label>
            <select
              className="w-full h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            >
              <option>On the half hour (9:00, 9:30)</option>
              <option>On the hour (9:00, 10:00)</option>
            </select>
          </div>
          <div className="mb-2">
            <label className="block text-sm text-[#374151] font-medium mb-2">
              Requests can be made
            </label>
            <div className="flex flex-row gap-2 items-center">
              <select
                className="w-full md:w-auto h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
                value={requestBefore}
                onChange={(e) => setRequestBefore(e.target.value)}
              >
                <option>24 hours before start time</option>
                <option>12 hours before start time</option>
                <option>48 hours before start time</option>
              </select>
              <span className="text-sm text-[#6B7280] mx-2">and up to</span>
              <select
                className="w-full md:w-auto h-11 px-3 border border-[#D1D5DB] rounded-md text-base bg-white focus:outline-none focus:ring-2 focus:ring-[#188153]"
                value={requestAdvance}
                onChange={(e) => setRequestAdvance(e.target.value)}
              >
                <option>1 week in advance</option>
                <option>2 weeks in advance</option>
                <option>1 month in advance</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end items-center px-8 pb-8 pt-2 bg-white rounded-b-2xl sticky bottom-0 z-10">
        <Button
          className="bg-[#188153] hover:bg-[#146945] text-white font-medium rounded-md px-8 h-11 text-base"
          onClick={onNext}
        >
          Next
        </Button>
      </div>
    </>
  );
}
