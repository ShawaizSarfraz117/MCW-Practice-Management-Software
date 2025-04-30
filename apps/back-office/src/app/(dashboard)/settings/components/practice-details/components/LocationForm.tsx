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
  onValidate?: () => boolean;
}

export default function LocationForm({
  address,
  setAddress,
}: LocationFormProps) {
  return (
    <div className="space-y-2">
      <div>
        <Label className="block text-xs text-gray-500" htmlFor="street">
          Street Address
        </Label>
        <Input
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          id="street"
          type="text"
          value={address.street}
          onChange={(e) => setAddress({ ...address, street: e.target.value })}
          required
        />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <Label className="block text-xs text-gray-500" htmlFor="city">
            City
          </Label>
          <Input
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            id="city"
            type="text"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="block text-xs text-gray-500" htmlFor="state">
            State
          </Label>
          <Input
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            id="state"
            type="text"
            value={address.state}
            onChange={(e) => setAddress({ ...address, state: e.target.value })}
            required
          />
        </div>
        <div>
          <Label className="block text-xs text-gray-500" htmlFor="zip">
            ZIP Code
          </Label>
          <Input
            className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            id="zip"
            type="text"
            value={address.zip}
            onChange={(e) => setAddress({ ...address, zip: e.target.value })}
            required
          />
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
