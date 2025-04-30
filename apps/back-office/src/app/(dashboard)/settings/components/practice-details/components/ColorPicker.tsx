"use client";

import { Button, Label } from "@mcw/ui";

interface ColorPickerProps {
  selectedColor: string | undefined;
  onColorSelect: (color: string) => void;
}

export default function ColorPicker({
  selectedColor,
  onColorSelect,
}: ColorPickerProps) {
  const colors = [
    { name: "gray", class: "bg-gray-400" },
    { name: "purple", class: "bg-purple-500" },
    { name: "blue", class: "bg-blue-400" },
    { name: "green", class: "bg-green-500" },
    { name: "orange", class: "bg-orange-500" },
    { name: "red", class: "bg-red-500" },
    { name: "pink", class: "bg-pink-400" },
  ];

  return (
    <div className="space-y-2">
      <Label className="block text-sm font-medium text-gray-700">Color</Label>
      <p className="text-xs text-gray-500">
        Select a color for your location to surface in the calendar
      </p>
      <div className="flex gap-2 mt-2">
        {colors.map((color) => (
          <Button
            key={color.name}
            aria-label={`Select ${color.name} color`}
            className={`w-8 h-8 rounded-full ${color.class} ${
              selectedColor === color.name
                ? "ring-2 ring-offset-2 ring-gray-400"
                : ""
            }`}
            onClick={() => onColorSelect(color.name)}
          />
        ))}
      </div>
    </div>
  );
}
