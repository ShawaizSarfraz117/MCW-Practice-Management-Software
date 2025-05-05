import {
  Input,
  Select,
  Label,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
} from "@mcw/ui";

export default function PracticeInformationForm() {
  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="practice-name">Practice Name</Label>
          <Input
            className="border-gray-300"
            defaultValue="Alma Naser"
            id="practice-name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="practice-email">Practice Email</Label>
          <Input
            className="border-gray-300"
            defaultValue="alma@mindfully.com"
            id="practice-email"
            type="email"
          />
        </div>
      </div>
      <div className="space-y-2 mt-2">
        <Label htmlFor="time-zone">Time Zone</Label>
        <Select defaultValue="eastern">
          <SelectTrigger className="w-full border-gray-300">
            <SelectValue placeholder="Select time zone" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="eastern">
              Eastern Time (US & Canada) UTC-05:00
            </SelectItem>
            <SelectItem value="central">
              Central Time (US & Canada) UTC-06:00
            </SelectItem>
            <SelectItem value="mountain">
              Mountain Time (US & Canada) UTC-07:00
            </SelectItem>
            <SelectItem value="pacific">
              Pacific Time (US & Canada) UTC-08:00
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
