"use client";

import { ChevronLeft, ChevronRight, Columns, Settings } from "lucide-react";
import {
  Button,
  Separator,
  MultiSelect,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  LocationSelect,
} from "@mcw/ui";
import { CalendarToolbarProps, clinicianGroups } from "../types";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export function CalendarToolbar({
  currentView,
  isAdmin,
  initialClinicians,
  initialLocations,
  selectedLocations,
  selectedClinicians,
  setSelectedClinicians,
  setSelectedLocations,
  handlePrev,
  handleNext,
  handleToday,
  handleViewChange,
  getHeaderDateFormat,
}: Omit<CalendarToolbarProps, "currentDate">) {
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const router = useRouter();

  const settingsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        settingsRef.current &&
        !settingsRef.current.contains(event.target as Node)
      ) {
        setShowSettingsDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  return (
    <div className="border-b">
      <div className="h-16 px-6 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-2">
          <Button
            className="text-sm"
            size="sm"
            variant="outline"
            onClick={handleToday}
          >
            Today
          </Button>
          <Button size="icon" variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button size="icon" variant="ghost" onClick={handleNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium">{getHeaderDateFormat()}</span>
        </div>

        {/* Center section - only show clinician selector for admin users */}
        <div className="flex items-center">
          {isAdmin && (
            <MultiSelect
              groups={clinicianGroups}
              options={initialClinicians}
              selected={selectedClinicians}
              onChange={setSelectedClinicians}
            />
          )}
        </div>

        {/* Right section with view selector buttons */}
        <div className="flex items-center space-x-2">
          <div className="flex rounded-md border">
            <Button
              className="rounded-none text-sm px-3"
              size="sm"
              variant={
                currentView ===
                (isAdmin ? "resourceTimeGridDay" : "timeGridDay")
                  ? "secondary"
                  : "ghost"
              }
              onClick={() =>
                handleViewChange(
                  isAdmin ? "resourceTimeGridDay" : "timeGridDay",
                )
              }
            >
              Day
            </Button>
            <Separator orientation="vertical" />
            <Button
              className="rounded-none text-sm px-3"
              size="sm"
              variant={
                currentView ===
                (isAdmin ? "resourceTimeGridWeek" : "timeGridWeek")
                  ? "secondary"
                  : "ghost"
              }
              onClick={() =>
                handleViewChange(
                  isAdmin ? "resourceTimeGridWeek" : "timeGridWeek",
                )
              }
            >
              Week
            </Button>
            <Separator orientation="vertical" />
            <Button
              className="rounded-none text-sm px-3"
              size="sm"
              variant={currentView === "dayGridMonth" ? "secondary" : "ghost"}
              onClick={() => handleViewChange("dayGridMonth")}
            >
              Month
            </Button>
          </div>

          <Select defaultValue="status">
            <SelectTrigger className="text-sm">
              <SelectValue>Color: Status</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="type">Type</SelectItem>
            </SelectContent>
          </Select>

          <Button className="h-8 w-8" size="icon" variant="ghost">
            <Columns className="h-4 w-4" />
          </Button>

          <LocationSelect
            options={initialLocations}
            selected={selectedLocations}
            onChange={setSelectedLocations}
          />
          <div
            ref={settingsRef}
            className="bg-gray-100 p-2 rounded-[10px] cursor-pointer hover:bg-gray-300 relative"
            onClick={() => setShowSettingsDropdown((prev) => !prev)}
          >
            <Settings className="h-5 w-5 text-gray-500" />
            {showSettingsDropdown && (
              <div className="absolute right-0 mt-2 w-32 bg-white shadow-lg rounded-md border z-50">
                <div
                  className="px-4 py-2 text-sm text-gray-700 hover:bg-green-100 hover:text-green-800 cursor-pointer"
                  onClick={() => {
                    router.push("/scheduled");
                    setShowSettingsDropdown(false);
                  }}
                >
                  Schedule
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
