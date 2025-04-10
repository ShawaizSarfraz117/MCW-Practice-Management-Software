import { Button } from "@mcw/ui";
import { Textarea } from "@mcw/ui";
import { Input } from "@mcw/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import { Bold, Italic, List, ListOrdered, LinkIcon } from "lucide-react";

export default function OverviewTab() {
  return (
    <div className="mt-0 p-4 sm:p-6 pb-16 lg:pb-6">
      {/* Text Editor */}
      <div className="mb-6">
        <div className="flex gap-2 sm:gap-4 mb-2 overflow-x-auto">
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <Bold className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <Italic className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <List className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Button className="h-8 w-8 p-0" size="sm" variant="ghost">
            <LinkIcon className="h-4 w-4" />
          </Button>
        </div>
        <Textarea
          className="min-h-[100px] border-[#e5e7eb] resize-none"
          placeholder="Add Chart Note: include notes from a call with a client or copy & paste the contents of a document"
        />
      </div>

      <div className="text-sm text-gray-500 mb-4">
        02/06/2025 5:07 pm
        <button className="text-blue-500 hover:underline ml-4">
          + Add Note
        </button>
      </div>

      {/* Date Range and Filter */}
      <div className="flex flex-col sm:flex-row sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            className="w-full sm:w-[200px] h-9 bg-white border-[#e5e7eb]"
            value="01/08/2025 - 02/06/2025"
          />
          <Select defaultValue="all">
            <SelectTrigger className="w-full sm:w-[150px] h-9 bg-white border-[#e5e7eb]">
              <SelectValue placeholder="All Items" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Items</SelectItem>
              <SelectItem value="appointments">Appointments</SelectItem>
              <SelectItem value="measures">Measures</SelectItem>
              <SelectItem value="notes">Notes</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="bg-[#2d8467] hover:bg-[#236c53]">New</Button>
      </div>

      {/* Timeline */}
      <div className="space-y-6">
        {/* Scored measure */}
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-500">FEB 8</div>
            <div className="font-medium">Scored measure</div>
            <div className="text-sm text-gray-500">GAD-7</div>
          </div>
          <div className="text-sm text-gray-500">1:00 PM</div>
        </div>

        {/* Appointment #2 */}
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-500">FEB 8</div>
            <div className="font-medium">Appointment #2</div>
            <div className="text-sm text-gray-500">GAD-7</div>
            <button className="text-blue-500 hover:underline text-sm mt-1">
              + Progress Note
            </button>
          </div>
          <div className="text-sm text-gray-500">1:00 PM</div>
        </div>

        {/* Appointment #1 */}
        <div className="flex justify-between">
          <div>
            <div className="text-sm text-gray-500">FEB 8</div>
            <div className="font-medium">Appointment #1</div>
            <div className="text-sm text-gray-500">GAD-7</div>
          </div>
          <div className="text-sm text-gray-500">1:00 PM</div>
        </div>
      </div>
    </div>
  );
}
