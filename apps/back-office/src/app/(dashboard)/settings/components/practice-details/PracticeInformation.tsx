import {
  Input,
  Select,
  Label,
  SelectValue,
  SelectTrigger,
  SelectItem,
  SelectContent,
  Button,
} from "@mcw/ui";
import { usePracticeInformation } from "./hooks/usePracticeInformation";
import { Loading } from "@/components";
import { PracticeInformation } from "@/types/profile";

interface PracticeInformationFormProps {
  practiceInfoState: PracticeInformation;
  setPracticeInfoState: (practiceInfoState: PracticeInformation) => void;
  handleSave: () => void;
}
export default function PracticeInformationForm({
  practiceInfoState,
  setPracticeInfoState,
  handleSave,
}: PracticeInformationFormProps) {
  const { practiceInformation, isLoading } = usePracticeInformation();
  return (
    <>
      {isLoading ? (
        <Loading fullScreen message="Loading practice information..." />
      ) : (
        <div>
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-800">
                Practice Details
              </h1>
              <p className="text-gray-600 mt-1">
                Practice name and location info
              </p>
            </div>
            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSave}
            >
              Save Changes
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="practice-name">Practice Name</Label>
              <Input
                className="border-gray-300"
                defaultValue={practiceInformation?.practice_name}
                id="practice-name"
                value={practiceInfoState?.practice_name}
                onChange={(e) =>
                  setPracticeInfoState({
                    ...practiceInfoState,
                    practice_name: e.target.value,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="practice-email">Practice Email</Label>
              <Input
                className="border-gray-300"
                defaultValue={practiceInformation?.practice_email}
                id="practice-email"
                type="email"
                value={practiceInfoState?.practice_email}
                onChange={(e) =>
                  setPracticeInfoState({
                    ...practiceInfoState,
                    practice_email: e.target.value,
                  })
                }
              />
            </div>
          </div>
          <div className="space-y-2 mt-2">
            <Label htmlFor="time-zone">Time Zone</Label>
            <Select
              defaultValue={practiceInformation?.time_zone}
              value={practiceInfoState?.time_zone}
              onValueChange={(value) =>
                setPracticeInfoState({
                  ...practiceInfoState,
                  time_zone: value,
                })
              }
            >
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
      )}
    </>
  );
}
