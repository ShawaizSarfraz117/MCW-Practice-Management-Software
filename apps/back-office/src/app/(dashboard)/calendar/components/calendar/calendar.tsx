"use client";

import { useState, useRef, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import resourceTimeGridPlugin from "@fullcalendar/resource-timegrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { ChevronLeft, ChevronRight, Columns } from "lucide-react";
import {
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  MultiSelect,
  LocationSelect,
} from "@mcw/ui";
import { AppointmentDialog } from "../appointment-dialog";
import { format } from "date-fns";

// Types
interface Clinician {
  value: string;
  label: string;
  group: string;
}

interface Location {
  value: string;
  label: string;
  type: "physical" | "virtual" | "unassigned";
}

interface Event {
  id: string;
  resourceId: string;
  title: string;
  start: string;
  end: string;
  location: string;
}

interface CalendarViewProps {
  initialClinicians: Clinician[];
  initialLocations: Location[];
  initialEvents: Event[];
  onCreateClient?: (date: string, time: string) => void;
  onAppointmentDone?: () => void;
}

const clinicianGroups = {
  clinicians: "CLINICIANS",
  admins: "ADMINS",
};

export function CalendarView({
  initialClinicians,
  initialLocations,
  initialEvents,
  onCreateClient,
  onAppointmentDone,
}: CalendarViewProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedResource, setSelectedResource] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState("resourceTimeGridDay");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedClinicians, setSelectedClinicians] = useState<string[]>(
    initialClinicians.slice(0, 2).map((c) => c.value),
  );
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialLocations.map((loc) => loc.value),
  );
  const [events, _setEvents] = useState(initialEvents);
  const calendarRef = useRef<FullCalendar>(null);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => selectedLocations.includes(event.location));
  }, [events, selectedLocations]);

  const handleDateSelect = (selectInfo: {
    start: Date;
    end: Date;
    resource?: { id: string };
  }) => {
    setSelectedDate(selectInfo.start);
    setSelectedResource(selectInfo.resource?.id || null);
    setIsDialogOpen(true);
  };

  const handleViewChange = (newView: string) => {
    setCurrentView(newView);
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.changeView(newView);
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.today();
      setCurrentDate(new Date());
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.prev();
      setCurrentDate(calendar.getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const calendar = calendarRef.current.getApi();
      calendar.next();
      setCurrentDate(calendar.getDate());
    }
  };

  const getHeaderDateFormat = () => {
    switch (currentView) {
      case "resourceTimeGridDay":
        return format(currentDate, "EEEE, MMMM d, yyyy");
      case "timeGridWeek":
        return format(currentDate, "MMMM yyyy");
      case "dayGridMonth":
        return format(currentDate, "MMMM yyyy");
      default:
        return format(currentDate, "MMMM yyyy");
    }
  };

  const resources = initialClinicians
    .filter((clinician) => selectedClinicians.includes(clinician.value))
    .map((clinician) => ({
      id: clinician.value,
      title: clinician.label,
    }));

  return (
    <div className="flex h-full bg-background">
      <div className="flex-1 flex flex-col">
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
              <span className="text-sm font-medium">
                {getHeaderDateFormat()}
              </span>
            </div>

            {/* Center section */}
            <div className="flex items-center">
              <MultiSelect
                groups={clinicianGroups}
                options={initialClinicians}
                selected={selectedClinicians}
                onChange={setSelectedClinicians}
              />
            </div>

            {/* Right section */}
            <div className="flex items-center space-x-2">
              <div className="flex rounded-md border">
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView === "resourceTimeGridDay"
                      ? "secondary"
                      : "ghost"
                  }
                  onClick={() => handleViewChange("resourceTimeGridDay")}
                >
                  Day
                </Button>
                <Separator orientation="vertical" />
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView === "timeGridWeek" ? "secondary" : "ghost"
                  }
                  onClick={() => handleViewChange("timeGridWeek")}
                >
                  Week
                </Button>
                <Separator orientation="vertical" />
                <Button
                  className="rounded-none text-sm px-3"
                  size="sm"
                  variant={
                    currentView === "dayGridMonth" ? "secondary" : "ghost"
                  }
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

        <div className="flex-1 p-4">
          <FullCalendar
            ref={calendarRef}
            allDaySlot={true}
            allDayText="All day"
            dayHeaderFormat={{
              weekday: "short",
              month: "numeric",
              day: "numeric",
              omitCommas: true,
            }}
            events={filteredEvents}
            headerToolbar={false}
            height="100%"
            initialView={currentView}
            nowIndicator={true}
            plugins={[
              resourceTimeGridPlugin,
              timeGridPlugin,
              dayGridPlugin,
              interactionPlugin,
            ]}
            resources={resources}
            select={handleDateSelect}
            selectable={true}
            slotMaxTime="23:00:00"
            slotMinTime="07:00:00"
            timeZone="America/New_York"
            views={{
              resourceTimeGridDay: {
                type: "resourceTimeGrid",
                duration: { days: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              timeGridWeek: {
                type: "timeGrid",
                duration: { weeks: 1 },
                slotDuration: "01:00:00",
                slotLabelFormat: {
                  hour: "numeric",
                  minute: "2-digit",
                  meridiem: "short",
                },
              },
              dayGridMonth: {
                type: "dayGrid",
                duration: { months: 1 },
                dayHeaderFormat: { weekday: "short" },
              },
            }}
          />
        </div>
      </div>

      <AppointmentDialog
        open={isDialogOpen}
        selectedDate={selectedDate}
        selectedResource={selectedResource}
        onCreateClient={onCreateClient}
        onDone={onAppointmentDone}
        onOpenChange={setIsDialogOpen}
      />
    </div>
  );
}
