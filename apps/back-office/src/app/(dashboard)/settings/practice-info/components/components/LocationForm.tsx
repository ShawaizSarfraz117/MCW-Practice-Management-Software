"use client";

import { Input, Label } from "@mcw/ui";

interface LocationFormProps {
  address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  };
  setAddress: (address: {
    street: string;
    city: string;
    state: string;
    zip: string;
  }) => void;
  errors?: {
    street?: boolean;
    city?: boolean;
    state?: boolean;
    zip?: boolean;
  };
}

export default function LocationForm({
  address,
  setAddress,
  errors = {},
}: LocationFormProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label
          className="flex items-center text-sm font-medium text-gray-700"
          htmlFor="street"
        >
          Street Address
          <span className="text-red-500 ml-1">*</span>
        </Label>
        <Input
          required
          className={`w-full ${errors.street ? "border-red-500" : "border-gray-300"}`}
          id="street"
          type="text"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
        />
        {errors.street && (
          <p className="text-sm text-red-500">Street address is required</p>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label
            className="flex items-center text-sm font-medium text-gray-700"
            htmlFor="city"
          >
            City
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            required
            className={`w-full ${errors.city ? "border-red-500" : "border-gray-300"}`}
            id="city"
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
          />
          {errors.city && (
            <p className="text-sm text-red-500">City is required</p>
          )}
        </div>
        <div>
          <Label
            className="flex items-center text-sm font-medium text-gray-700"
            htmlFor="state"
          >
            State
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            required
            className={`w-full ${errors.state ? "border-red-500" : "border-gray-300"}`}
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
          />
          {errors.state && (
            <p className="text-sm text-red-500">State is required</p>
          )}
        </div>
        <div>
          <Label
            className="flex items-center text-sm font-medium text-gray-700"
            htmlFor="zip"
          >
            ZIP Code
            <span className="text-red-500 ml-1">*</span>
          </Label>
          <Input
            required
            className={`w-full ${errors.zip ? "border-red-500" : "border-gray-300"}`}
            id="zip"
            type="text"
            value={address.zip}
            onChange={(e) => setAddress({ ...address, zip: e.target.value })}
          />
          {errors.zip && (
            <p className="text-sm text-red-500">Valid ZIP code is required</p>
          )}
        </div>
      </div>
      <p className="text-xs text-gray-500 mt-1">
        This address is automatically hidden on the Client Portal, and is only
        visible on billing documents if it is chosen as the Client Billing
        address.
      </p>
    </div>
  );
}
