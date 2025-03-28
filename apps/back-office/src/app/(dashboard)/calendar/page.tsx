"use client";

import type React from "react";
// import { MainSidebar } from "./components/main-sidebar";
import { CalendarView } from "./components/calendar/calendar";
import { CreateClientForm } from "./components/client/create-client-form";
import { useState } from "react";
import { IntakeForm } from "./components/intake/intake-form";

// Sample data
const clinicians = [
  { value: "alam", label: "Alam Naqvi", group: "clinicians" },
  { value: "almir", label: "Almir Kazazic", group: "clinicians" },
  { value: "alyssa", label: "Alyssa Merryman", group: "clinicians" },
  { value: "ashley", label: "Ashley Sullivan", group: "clinicians" },
  { value: "bjorn", label: "Bjorn Nagle", group: "clinicians" },
  { value: "cheryl", label: "Cheryl Champagne", group: "admins" },
  { value: "emily-c", label: "Emily Camera", group: "admins" },
  { value: "emily-t", label: "Emily Tripp", group: "admins" },
];

const locations: {
  value: string;
  label: string;
  type: "physical" | "virtual" | "unassigned";
}[] = [
  {
    value: "sp",
    label: "Saint Petersburg McNulty Counseling",
    type: "physical",
  },
  { value: "tampa", label: "Tampa McNulty Counseling", type: "physical" },
  { value: "telehealth", label: "Telehealth", type: "virtual" },
  { value: "tyrone", label: "Tyrone McNulty Counseling", type: "physical" },
  { value: "unassigned", label: "Unassigned", type: "unassigned" },
];

const sampleEvents = [
  {
    id: "1",
    resourceId: "alam",
    title: "Meeting with John",
    start: "2025-02-03T10:00:00",
    end: "2025-02-03T11:30:00",
    location: "sp",
  },
  {
    id: "2",
    resourceId: "almir",
    title: "Therapy Session",
    start: "2025-02-03T13:00:00",
    end: "2025-02-03T14:00:00",
    location: "tampa",
  },
  {
    id: "3",
    resourceId: "alyssa",
    title: "Group Counseling",
    start: "2025-02-04T15:00:00",
    end: "2025-02-04T16:30:00",
    location: "tyrone",
  },
  {
    id: "4",
    resourceId: "ashley",
    title: "Online Consultation",
    start: "2025-02-05T09:00:00",
    end: "2025-02-05T10:00:00",
    location: "telehealth",
  },
];

const CalendarPage: React.FC = () => {
  const [showCreateClient, setShowCreateClient] = useState(false);
  const [appointmentDate, setAppointmentDate] = useState("");
  const [showIntakeForm, setShowIntakeForm] = useState(false);

  const handleCreateClient = (date: string, time: string) => {
    setAppointmentDate(`${date} at ${time}`);
    setShowCreateClient(true);
  };

  const handleAppointmentDone = () => {
    setShowCreateClient(false);
    setShowIntakeForm(true);
  };

  return (
    <div className="flex h-screen">
      {/* <MainSidebar /> */}
      <div className="flex-1">
        <CalendarView
          initialClinicians={clinicians}
          initialEvents={sampleEvents}
          initialLocations={locations}
          onAppointmentDone={handleAppointmentDone}
          onCreateClient={handleCreateClient}
        />

        {showCreateClient && (
          <CreateClientForm
            appointmentDate={appointmentDate}
            onClose={() => setShowCreateClient(false)}
          />
        )}
        {showIntakeForm && (
          <IntakeForm
            clientEmail="almir@example.com"
            clientName="Almir Kazacic"
            onClose={() => setShowIntakeForm(false)}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
