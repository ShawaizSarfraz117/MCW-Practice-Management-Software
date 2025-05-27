"use client";
import { Button, Input } from "@mcw/ui";
import { Pencil } from "lucide-react";
import React from "react";

type Client = {
  name: string;
  dob: string;
  address: string;
  contact: string;
};

type Props = {
  client: Client;
  setClient: React.Dispatch<React.SetStateAction<Client>>;
  editClient: boolean;
  setEditClient: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ClientSection({
  client,
  setClient,
  editClient,
  setEditClient,
}: Props) {
  return (
    <div className="p-4 border-b sm:border-b-0 sm:border-r border-gray-200 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-700 text-lg">Client</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-6 w-6"
          onClick={() => setEditClient(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <hr className="my-2" />
      {!editClient ? (
        <>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">Name</span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {client.name}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Date of birth
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {client.dob}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Address
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {client.address}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Contact permission
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {client.contact}
            </span>
          </div>
        </>
      ) : (
        <>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Name
            </label>
            <Input
              value={client.name}
              onChange={(e) =>
                setClient((c) => ({ ...c, name: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Date of birth
            </label>
            <Input
              value={client.dob}
              onChange={(e) =>
                setClient((c) => ({ ...c, dob: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <Input
              value={client.address}
              onChange={(e) =>
                setClient((c) => ({ ...c, address: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Contact permission
            </label>
            <Input
              value={client.contact}
              onChange={(e) =>
                setClient((c) => ({ ...c, contact: e.target.value }))
              }
              className="h-10"
            />
          </div>
        </>
      )}
    </div>
  );
}
