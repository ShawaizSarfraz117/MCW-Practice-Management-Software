"use client";

import { useState } from "react";
import {
  Button,
  Select,
  SelectItem,
  SelectContent,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@mcw/ui";
import { ClientGroupFromAPI } from "../ClientEdit";
import {
  useUpdateClientGroup,
  useUpdateClient,
  updateClientGroup,
} from "@/(dashboard)/clients/services/client.service";
import { useToast } from "@mcw/ui";
import { EditClientForm } from "../EditClientForm";
import { ClientFormValues } from "../../types";

export function GroupInfo({
  clientGroup,
}: {
  clientGroup: ClientGroupFromAPI;
}) {
  const { toast } = useToast();
  // State for form fields
  const [status, setStatus] = useState(
    clientGroup?.is_active ? "Active" : "Inactive",
  );
  const [notes, setNotes] = useState(clientGroup?.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [dateFirstSeen, setDateFirstSeen] = useState(
    clientGroup?.first_seen_at
      ? new Date(clientGroup.first_seen_at).toISOString().split("T")[0]
      : "",
  );

  const updateClientGroupMutation = useUpdateClientGroup();
  const updateClientMutation = useUpdateClient();

  const handleSaveClient = async (formData: {
    status: string;
    notes: string;
    dateFirstSeen: string;
  }) => {
    await updateClientGroupMutation.mutateAsync({
      body: { ...formData, id: clientGroup.id },
    });
    toast({
      title: "Client Group updated successfully",
      variant: "success",
    });
  };

  const handleSave = async (formData: ClientFormValues) => {
    setIsLoading(true);
    await updateClientGroup({
      body: { ...{ status, notes, dateFirstSeen }, id: clientGroup.id },
    });
    setIsLoading(false);
    await updateClientMutation.mutateAsync({
      body: { ...formData, id: clientGroup.ClientGroupMembership[0].client_id },
    });
    toast({
      title: "Client updated successfully",
      variant: "success",
    });
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4">
        <div>
          <h2 className="text-lg font-semibold mb-4">Client Status</h2>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {clientGroup.type === "adult" && (
          <EditClientForm
            clientData={clientGroup.ClientGroupMembership[0]}
            onSave={handleSave}
          />
        )}
        <div className="pt-4 border-t">
          <h2 className="text-lg font-semibold mb-4">About Client</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2" htmlFor="notes">
              Client Notes
            </label>
            <Textarea
              className="w-full h-24"
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="mb-4">
            <label
              className="block text-sm font-medium mb-2"
              htmlFor="dateFirstSeen"
            >
              Date First Seen
            </label>
            <input
              className="border border-gray-300 rounded-md px-3 py-2 w-full max-w-xs"
              id="dateFirstSeen"
              type="date"
              value={dateFirstSeen}
              onChange={(e) => setDateFirstSeen(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-4 pt-4">
        <Button variant="outline">Cancel</Button>
        {clientGroup.type === "adult" ? (
          <Button
            disabled={updateClientMutation.isPending || isLoading}
            form="client-edit-form"
          >
            Save Client
          </Button>
        ) : (
          <Button
            disabled={updateClientGroupMutation.isPending}
            onClick={() => handleSaveClient({ status, notes, dateFirstSeen })}
          >
            Save Client
          </Button>
        )}
        <div className="flex-grow"></div>
        <Button
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
          variant="outline"
        >
          Delete this {clientGroup.type}
        </Button>
      </div>
    </div>
  );
}
