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
export default function PracticePhoneForm({
  phoneNumbers,
  addPhoneNumber,
  removePhoneNumber,
}: {
  phoneNumbers: { number: string; type: string }[];
  addPhoneNumber: () => void;
  removePhoneNumber: (index: number) => void;
}) {
  return (
    <div className="space-y-2">
      <h3 className="text-base font-medium">Practice Phone</h3>
      {phoneNumbers.map((phone, index) => (
        <div key={index} className="flex items-center space-x-1 mt-2">
          <Input
            placeholder="Phone number"
            className="border-gray-300 h-10 rounded-md w-[310px]"
          />
          <Select defaultValue={phone.type}>
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
            variant="ghost"
            size="icon"
            onClick={() => removePhoneNumber(index)}
          >
            <Trash2 className="h-5 w-5 text-gray-400" />
          </Button>
        </div>
      ))}
      <Button
        variant="outline"
        className="mt-5 border-green-300 text-green-700"
        onClick={addPhoneNumber}
      >
        Add Phone Number
      </Button>
    </div>
  );
}
