import { PracticeInformation } from "@/types/profile";
import {
  Input,
  Select,
  Button,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@mcw/ui";
import { Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { usePracticeInformation } from "./hooks/usePracticeInformation";

export default function PracticePhoneForm({
  setPracticeInfoState,
}: {
  setPracticeInfoState: (state: PracticeInformation) => void;
}) {
  const { practiceInformation } = usePracticeInformation();
  const [phoneNumbers, setPhoneNumbers] = useState<
    { number: string; type: string }[]
  >(practiceInformation?.phone_numbers || []);

  useEffect(() => {
    setPracticeInfoState({
      ...practiceInformation,
      phone_numbers: phoneNumbers,
    });
  }, [phoneNumbers]);

  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">Practice Phone</h3>
      {(phoneNumbers.length > 0
        ? phoneNumbers
        : practiceInformation?.phone_numbers
      )?.map((phone, index) => (
        <div key={index} className="flex items-center space-x-1 mt-2">
          <Input
            className="border-gray-300 h-10 rounded-md w-[310px]"
            placeholder="Phone number"
            value={phone.number}
            onChange={(e) => {
              const newPhoneNumbers = [...phoneNumbers];
              newPhoneNumbers[index].number = e.target.value;
              setPhoneNumbers(newPhoneNumbers);
              setPracticeInfoState({
                ...practiceInformation,
                phone_numbers: newPhoneNumbers,
              });
            }}
          />
          <Select
            defaultValue={phone.type}
            onValueChange={(value) => {
              const newPhoneNumbers = [...phoneNumbers];
              newPhoneNumbers[index].type = value;
              setPhoneNumbers(newPhoneNumbers);
              setPracticeInfoState({
                ...practiceInformation,
                phone_numbers: newPhoneNumbers,
              });
            }}
          >
            <SelectTrigger className="w-28 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mobile">Mobile</SelectItem>
              <SelectItem value="Office">Office</SelectItem>
              <SelectItem value="Home">Home</SelectItem>
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => {
              const newPhoneNumbers = new Set([
                ...phoneNumbers,
                ...practiceInformation.phone_numbers,
              ]);
              newPhoneNumbers.delete(phone);
              setPhoneNumbers(Array.from(newPhoneNumbers));
              setPracticeInfoState({
                ...practiceInformation,
                phone_numbers: Array.from(newPhoneNumbers),
              });
            }}
          >
            <Trash2 className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      ))}
      <Button
        className="mt-5 border-green-300 text-green-700"
        variant="outline"
        onClick={() => {
          setPhoneNumbers([...phoneNumbers, { number: "", type: "Mobile" }]);
          setPracticeInfoState({
            ...practiceInformation,
            phone_numbers: [
              ...practiceInformation.phone_numbers,
              { number: "", type: "Mobile" },
            ],
          });
        }}
      >
        Add Phone Number
      </Button>
    </div>
  );
}
