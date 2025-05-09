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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@mcw/ui";

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
  onClose: () => void;
}

export default function LicenseInfoEdit({
  member,
  onClose,
}: LicenseInfoEditProps) {
  const queryClient = useQueryClient();

  const { mutate: updateLicenseInfo } = useMutation({
    mutationFn: async (data: {
      type: string;
      number: string;
      expirationDate: string;
      state: string;
    }) => {
      const response = await fetch(`/api/clinician/${member.id}/license`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update license info");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teamMember", member.id] });
      toast({
        title: "Success",
        description: "License information updated successfully",
      });
      onClose();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update license information",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateLicenseInfo({
      type: formData.get("type") as string,
      number: formData.get("number") as string,
      expirationDate: formData.get("expirationDate") as string,
      state: formData.get("state") as string,
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
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
            <SelectItem value="PhD">PhD</SelectItem>
            <SelectItem value="PsyD">PsyD</SelectItem>
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
            <SelectItem value="AL">Alabama</SelectItem>
            <SelectItem value="AK">Alaska</SelectItem>
            <SelectItem value="AZ">Arizona</SelectItem>
            {/* Add more states as needed */}
          </SelectContent>
        </Select>
      </div>
    </form>
  );
}
