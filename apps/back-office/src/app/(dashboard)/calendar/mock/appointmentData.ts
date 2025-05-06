export const staticClients = [
  { id: 1, name: "Client One" },
  { id: 2, name: "Client Two" },
  { id: 3, name: "Client Three" },
];

export const appointmentStatusOptions = [
  { label: "Show", value: "SHOW" },
  { label: "No Show", value: "NO_SHOW" },
  { label: "Cancelled", value: "CANCELLED" },
  { label: "Late Canceled", value: "LATE_CANCELED" },
  { label: "Clinician Canceled", value: "CLINICIAN_CANCELED" },
  { label: "Scheduled", value: "SCHEDULED" },
];

export const mappedClients = staticClients.map((client) => ({
  label: client.name,
  value: client.id.toString(),
}));
