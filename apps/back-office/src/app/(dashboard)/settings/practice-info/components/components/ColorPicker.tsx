"use client";

import { Button, useForm } from "@mcw/ui";
export const colors = [
  { name: "gray", class: "bg-gray-400" },
  { name: "purple", class: "bg-purple-500" },
  { name: "blue", class: "bg-blue-400" },
  { name: "green", class: "bg-green-500" },
  { name: "orange", class: "bg-orange-500" },
  { name: "red", class: "bg-red-500" },
  { name: "pink", class: "bg-pink-400" },
];

export default function ColorPicker({
  form,
}: {
  form: ReturnType<typeof useForm>;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-gray-500">
        Select a color for your location to surface in the calendar
      </p>
      {form.Field({
        name: "color",
        children: (field) => (
          <div className="flex gap-2 mt-2">
            {colors.map((color) => (
              <Button
                key={color.name}
                aria-label={`Select ${color.name} color`}
                className={`w-8 h-8 rounded-full ${color.class} ${
                  field.state.value === color.name
                    ? "ring-2 ring-offset-2 ring-gray-400"
                    : ""
                }`}
                type="button"
                onClick={() => field.handleChange(color.name)}
              />
            ))}
          </div>
        ),
      })}
    </div>
  );
}
