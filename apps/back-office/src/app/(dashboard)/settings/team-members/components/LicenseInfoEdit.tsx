"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@mcw/ui";
import statesUS from "@/(dashboard)/clients/services/statesUS.json";

interface LicenseInfoEditProps {
  member: {
    id: string;
    license?: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    };
  };
  onSubmit: (data: {
    license: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    };
  }) => void;
}

export default function LicenseInfoEdit({
  member,
  onSubmit,
}: LicenseInfoEditProps) {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      license: {
        type: (formData.get("type") as string) || "",
        number: (formData.get("number") as string) || "",
        expirationDate: (formData.get("expirationDate") as string) || "",
        state: (formData.get("state") as string) || "",
      },
    };
    onSubmit(data);
  };

  return (
    <form
      className="space-y-4"
      id="license-info-edit-form"
      onSubmit={handleSubmit}
    >
      <div>
        <Label htmlFor="type">License Type</Label>
        <Select defaultValue={member.license?.type} name="type">
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select license type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="LMFT">LMFT</SelectItem>
            <SelectItem value="LCSW">LCSW</SelectItem>
            <SelectItem value="LPC">LPC</SelectItem>
            <SelectItem value="LPCC">LPCC</SelectItem>
            <SelectItem value="LMHC">LMHC</SelectItem>
            <SelectItem value="LCPC">LCPC</SelectItem>
            <SelectItem value="PhD">PhD</SelectItem>
            <SelectItem value="PsyD">PsyD</SelectItem>
            <SelectItem value="MD">MD</SelectItem>
            <SelectItem value="NP">NP</SelectItem>
            <SelectItem value="PA">PA</SelectItem>
            <SelectItem value="RN">RN</SelectItem>
            <SelectItem value="Other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="number">License Number</Label>
        <Input
          className="mt-1"
          defaultValue={member.license?.number}
          id="number"
          name="number"
          required
          placeholder="Enter license number"
        />
      </div>

      <div>
        <Label htmlFor="expirationDate">Expiration Date</Label>
        <Input
          className="mt-1"
          defaultValue={member.license?.expirationDate}
          id="expirationDate"
          name="expirationDate"
          required
          type="date"
        />
      </div>

      <div>
        <Label htmlFor="state">State</Label>
        <Select defaultValue={member.license?.state} name="state">
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Select state" />
          </SelectTrigger>
          <SelectContent>
            {statesUS.map((state) => (
              <SelectItem key={state.abbreviation} value={state.abbreviation}>
                {state.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
