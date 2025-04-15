"use client";

import { ChevronLeft, ChevronRight, Columns } from "lucide-react";
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
import { CalendarToolbarProps, clinicianGroups } from "../Types";

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
  return (
    <div className="border-b">
      <div className="h-14 px-4 flex items-center justify-between">
        {/* Left section */}
        <div className="flex items-center space-x-2">
          <Button size="icon" variant="ghost" onClick={handlePrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            className="text-sm"
            size="sm"
            variant="ghost"
            onClick={handleToday}
          >
            Today
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
            <SelectTrigger className="w-[120px] h-8 text-sm">
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
        </div>
      </div>
    </div>
  );
}
