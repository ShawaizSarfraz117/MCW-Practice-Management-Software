import { FC, useState } from "react";
import { Button, RadioGroup, RadioGroupItem } from "@mcw/ui";

interface AppointmentForProps {
  onSelect: (value: "me" | "partner-and-me" | "someone-else") => void;
}

export const AppointmentFor: FC<AppointmentForProps> = ({ onSelect }) => {
  const [selectedOption, setSelectedOption] = useState<
    "me" | "partner-and-me" | "someone-else" | null
  >(null);

  const options = [
    { value: "me", label: "Me" },
    { value: "partner-and-me", label: "My partner and me" },
    { value: "someone-else", label: "Someone else" },
  ];

  const handleSelect = () => {
    if (selectedOption) {
      onSelect(selectedOption);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-medium text-gray-900">
        Who is this appointment for?
      </h2>
      <p className="text-gray-600">
        You can request this appointment for yourself, on behalf of someone
        else, or for both you and your partner. Please choose below.
      </p>

      <RadioGroup
        value={selectedOption || ""}
        onValueChange={(value) =>
          setSelectedOption(value as typeof selectedOption)
        }
        className="space-y-4"
      >
        {options.map((option) => (
          <div key={option.value} className="flex items-center space-x-3">
            <RadioGroupItem value={option.value} id={option.value} />
            <label
              htmlFor={option.value}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {option.label}
            </label>
          </div>
        ))}
      </RadioGroup>

      <div className="flex justify-end pt-6">
        <Button
          onClick={handleSelect}
          disabled={!selectedOption}
          variant="default"
          className="rounded-none bg-green-700 hover:bg-green-800"
        >
          NEXT
        </Button>
      </div>
    </div>
  );
};
