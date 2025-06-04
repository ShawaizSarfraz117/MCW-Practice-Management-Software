"use client";
import { Button, Input } from "@mcw/ui";
import { Pencil } from "lucide-react";
import React from "react";

type Provider = {
  name: string;
  npi: string;
  tin: string;
  location: string;
  address: string;
  contactPerson: string;
  phone: string;
  email: string;
};

type Props = {
  provider: Provider;
  setProvider: React.Dispatch<React.SetStateAction<Provider>>;
  editProvider: boolean;
  setEditProvider: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function ProviderSection({
  provider,
  setProvider,
  editProvider,
  setEditProvider,
}: Props) {
  return (
    <div className="p-4 relative">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-gray-700 text-lg">Provider</span>
        <Button
          variant="ghost"
          size="icon"
          className="ml-2 h-6 w-6"
          onClick={() => setEditProvider(true)}
        >
          <Pencil className="h-4 w-4" />
        </Button>
      </div>
      <hr className="my-2" />
      {!editProvider ? (
        <>
          <div className="mb-2">
            <span className="font-normal text-[16px] text-[#4B5563]">Name</span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {provider.name}
            </span>
          </div>
          <div className="flex flex-row justify-between items-start gap-2">
            <div className="mb-2">
              <span className="font-normal text-[16px] text-[#4B5563]">
                NPI
              </span>
              <br />
              {provider.npi}
            </div>
            <div className="mb-2 mr-[39%]">
              <span className="font-normal text-[16px] text-[#4B5563]">
                TIN
              </span>
              <br />
              {provider.tin}
            </div>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Location
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {provider.location}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Address
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {provider.address}
            </span>
          </div>
          <div className="mb-1">
            <span className="font-normal text-[16px] text-[#4B5563]">
              Contact person
            </span>
            <br />
            <span className="font-normal text-[14px] text-[#1F2937]">
              {provider.contactPerson}
              <br />
              {provider.phone}
              <br />
              {provider.email}
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
              value={provider.name}
              onChange={(e) =>
                setProvider((p) => ({ ...p, name: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="flex flex-row gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                NPI
              </label>
              <Input
                value={provider.npi}
                onChange={(e) =>
                  setProvider((p) => ({ ...p, npi: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                TIN
              </label>
              <Input
                value={provider.tin}
                onChange={(e) =>
                  setProvider((p) => ({ ...p, tin: e.target.value }))
                }
                className="h-10"
              />
            </div>
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Location
            </label>
            <Input
              value={provider.location}
              onChange={(e) =>
                setProvider((p) => ({ ...p, location: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Address
            </label>
            <Input
              value={provider.address}
              onChange={(e) =>
                setProvider((p) => ({ ...p, address: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Contact person
            </label>
            <Input
              value={provider.contactPerson}
              onChange={(e) =>
                setProvider((p) => ({ ...p, contactPerson: e.target.value }))
              }
              className="h-10"
            />
          </div>
          <div className="flex flex-row gap-2 mb-2">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <Input
                value={provider.phone}
                onChange={(e) =>
                  setProvider((p) => ({ ...p, phone: e.target.value }))
                }
                className="h-10"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <Input
                value={provider.email}
                onChange={(e) =>
                  setProvider((p) => ({ ...p, email: e.target.value }))
                }
                className="h-10"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
