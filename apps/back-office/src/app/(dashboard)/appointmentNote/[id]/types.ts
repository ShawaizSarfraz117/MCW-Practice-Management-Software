export interface AppointmentDetails {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  clinician?: {
    user?: {
      first_name: string;
      last_name: string;
    };
  };
  location?: {
    name: string;
  };
  appointmentServices?: Array<{
    id: string;
    service?: {
      name: string;
      base_cost: string;
    };
  }>;
  invoice?: Array<{
    id: string;
    invoice_number: string;
    status: string;
    amount_due: number;
    amount_paid: number;
  }>;
}

export interface ClientAppointment {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  status: string;
  clinician?: {
    user?: {
      first_name: string;
      last_name: string;
    };
  };
}
