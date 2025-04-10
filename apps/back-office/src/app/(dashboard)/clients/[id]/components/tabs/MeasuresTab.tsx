import { Button } from "@mcw/ui";
import { Alert, AlertTitle, AlertDescription } from "@mcw/ui";
import { X } from "lucide-react";

export default function MeasuresTab() {
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
        <div className="text-sm text-gray-500 mb-4">Completed by Jamie A.</div>

        <div className="flex justify-between items-center mb-4">
          <h3 className="font-medium">GAD-7</h3>
          <div className="flex gap-4">
            <span className="text-green-500 text-sm">+2 since baseline</span>
            <span className="text-green-500 text-sm">+2 since last</span>
          </div>
        </div>

        {/* Graph */}
        <div className="relative h-[200px] mb-2">
          {/* Scale Labels */}
          <div className="absolute right-0 top-0 text-sm text-gray-500">
            Severe
          </div>
          <div className="absolute right-0 top-[33%] text-sm text-gray-500">
            Moderate
          </div>
          <div className="absolute right-0 top-[66%] text-sm text-gray-500">
            Mild
          </div>
          <div className="absolute right-0 bottom-0 text-sm text-gray-500">
            None—
            <br />
            minimal
          </div>

          {/* Horizontal Lines */}
          <div className="absolute left-0 right-16 top-0 border-t border-gray-200" />
          <div className="absolute left-0 right-16 top-[33%] border-t border-gray-200" />
          <div className="absolute left-0 right-16 top-[66%] border-t border-gray-200" />
          <div className="absolute left-0 right-16 bottom-0 border-t border-gray-200" />

          {/* Graph Line */}
          <div className="absolute left-[20%] right-16 top-[33%] border-t border-gray-300" />

          {/* Data Point */}
          <div className="absolute left-[60%] top-[33%] transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-[#f59e0b] text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-medium">
              10
            </div>
          </div>
        </div>

        {/* Date Labels */}
        <div className="flex justify-between pr-16">
          <div className="text-sm text-gray-500">Feb 7</div>
          <div className="text-sm text-gray-500">Feb 12</div>
        </div>
      </div>
    </div>
  );
}
