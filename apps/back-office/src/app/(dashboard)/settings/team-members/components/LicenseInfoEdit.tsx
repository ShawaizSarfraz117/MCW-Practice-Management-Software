"use client";

import {
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Button,
} from "@mcw/ui";
import { useState, useEffect } from "react";
import { Trash } from "lucide-react";
import statesUS from "@/(dashboard)/clients/services/statesUS.json";

interface License {
  id?: number;
  license_type: string;
  license_number: string;
  expiration_date: string;
  state: string;
}

interface LicenseInfoEditProps {
  member: {
    id: string;
    license?: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    };
    licenses?: License[];
    clinicalInfoId?: number;
  };
  onSubmit: (data: { licenses: License[]; clinical_info_id: number }) => void;
}

export default function LicenseInfoEdit({
  member,
  onSubmit,
}: LicenseInfoEditProps) {
  // Initialize licenses state with empty array
  const [licenses, setLicenses] = useState<License[]>([]);

  // Update licenses state when member changes
  useEffect(() => {
    if (member.licenses && member.licenses.length > 0) {
      // Use the licenses array if available
      setLicenses(
        member.licenses.map((license) => ({
          ...license,
          // Ensure date is formatted correctly for input field
          expiration_date: license.expiration_date
            ? new Date(license.expiration_date).toISOString().split("T")[0]
            : "",
        })),
      );
    } else if (member.license) {
      // Use the single license if available
      setLicenses([
        {
          license_type: member.license.type,
          license_number: member.license.number,
          expiration_date: member.license.expirationDate
            ? new Date(member.license.expirationDate)
                .toISOString()
                .split("T")[0]
            : "",
          state: member.license.state,
        },
      ]);
    } else {
      // Otherwise use a default empty license
      setLicenses([
        {
          license_type: "LMFT",
          license_number: "",
          expiration_date: "",
          state: "AL",
        },
      ]);
    }
  }, [member]);

  const handleAddLicense = () => {
    setLicenses([
      ...licenses,
      {
        license_type: "LMFT",
        license_number: "",
        expiration_date: "",
        state: "AL",
      },
    ]);
  };

  const handleRemoveLicense = (index: number) => {
    setLicenses(licenses.filter((_, i) => i !== index));
  };

  const handleLicenseChange = (
    index: number,
    field: keyof License,
    value: string,
  ) => {
    const updatedLicenses = [...licenses];
    updatedLicenses[index] = {
      ...updatedLicenses[index],
      [field]: value,
    };
    setLicenses(updatedLicenses);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!member.clinicalInfoId) {
      return;
    }

    onSubmit({
      licenses: licenses,
      clinical_info_id: member.clinicalInfoId,
    });
  };

  return (
    <form
      className="space-y-6"
      id="license-info-edit-form"
      onSubmit={handleSubmit}
    >
      {licenses.map((license, index) => (
        <div
          key={index}
          className="space-y-4 pb-6 border-b border-gray-200 relative"
        >
          <div className="absolute right-0 top-0">
            {licenses.length > 1 && (
              <button
                className="text-gray-500 hover:text-red-500"
                type="button"
                onClick={() => handleRemoveLicense(index)}
              >
                <Trash />
              </button>
            )}
          </div>

          <div>
            <Label htmlFor={`license-type-${index}`}>License type</Label>
            <Select
              value={license.license_type}
              onValueChange={(value) =>
                handleLicenseChange(index, "license_type", value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select license type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="LMFT">LMFT</SelectItem>
                <SelectItem value="LCSW">LCSW</SelectItem>
                <SelectItem value="LPC">LPC</SelectItem>
                <SelectItem value="PhD">PhD</SelectItem>
                <SelectItem value="PsyD">PsyD</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor={`license-number-${index}`}>License number</Label>
            <Input
              className="mt-1"
              id={`license-number-${index}`}
              placeholder="Enter license number"
              value={license.license_number}
              onChange={(e) =>
                handleLicenseChange(index, "license_number", e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor={`expiration-date-${index}`}>Expiration date</Label>
            <Input
              className="mt-1"
              id={`expiration-date-${index}`}
              type="date"
              value={license.expiration_date}
              onChange={(e) =>
                handleLicenseChange(index, "expiration_date", e.target.value)
              }
            />
          </div>

          <div>
            <Label htmlFor={`state-${index}`}>State</Label>
            <Select
              value={license.state}
              onValueChange={(value) =>
                handleLicenseChange(index, "state", value)
              }
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {statesUS.map((state) => (
                  <SelectItem
                    key={state.abbreviation}
                    value={state.abbreviation}
                  >
                    {state.abbreviation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      ))}

      <Button
        className="w-full"
        type="button"
        variant="outline"
        onClick={handleAddLicense}
      >
        + Add another license
      </Button>
    </form>
  );
}
