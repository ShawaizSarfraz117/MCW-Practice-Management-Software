"use client";

import { Input, Label, useForm } from "@mcw/ui";

export default function LocationForm({
  form,
}: {
  form: ReturnType<typeof useForm>;
}) {
  return (
    <div className="space-y-2">
      {/* Street */}
      {form.Field({
        name: "street",
        children: (field) => (
          <>
            <Label
              className="flex items-center text-sm font-medium text-gray-700"
              htmlFor="street"
            >
              Street Address
              <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              required
              className={`w-full ${field.state.meta.errors?.[0] ? "border-red-500" : "border-gray-300"}`}
              id="street"
              type="text"
              value={field.state.value as string}
              onChange={(e) => field.handleChange(e.target.value)}
            />
            {field.state.meta.errors?.[0] && (
              <p className="text-sm text-red-500">
                {field.state.meta.errors?.[0]}
              </p>
            )}
          </>
        ),
      })}
      <div className="grid grid-cols-3 gap-2">
        {/* City */}
        {form.Field({
          name: "city",
          children: (field) => (
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
                className={`w-full ${field.state.meta.errors?.[0] ? "border-red-500" : "border-gray-300"}`}
                id="city"
                type="text"
                value={field.state.value as string}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors?.[0]}
                </p>
              )}
            </div>
          ),
        })}
        {/* State */}
        {form.Field({
          name: "state",
          children: (field) => (
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
                className={`w-full ${field.state.meta.errors?.[0] ? "border-red-500" : "border-gray-300"}`}
                id="state"
                type="text"
                value={field.state.value as string}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors?.[0]}
                </p>
              )}
            </div>
          ),
        })}
        {/* ZIP */}
        {form.Field({
          name: "zip",
          children: (field) => (
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
                className={`w-full ${field.state.meta.errors?.[0] ? "border-red-500" : "border-gray-300"}`}
                id="zip"
                type="text"
                value={field.state.value as string}
                onChange={(e) => field.handleChange(e.target.value)}
              />
              {field.state.meta.errors?.[0] && (
                <p className="text-sm text-red-500">
                  {field.state.meta.errors?.[0]}
                </p>
              )}
            </div>
          ),
        })}
      </div>
      <p className="text-xs text-gray-500 mt-1">
        This address is automatically hidden on the Client Portal, and is only
        visible on billing documents if it is chosen as the Client Billing
        address.
      </p>
    </div>
  );
}
