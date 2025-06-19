import { prisma } from "@mcw/database";

// Entity lookup result
export interface EntityLookupResult {
  [key: string]: string | number | Date | undefined;
}

/**
 * Service for looking up entity details by ID
 * Provides a unified interface for fetching entity names and details
 */
export class EntityLookupService {
  /**
   * Generic lookup method that routes to specific entity lookups
   */
  static async lookup(
    entityType: string,
    entityId: string,
  ): Promise<EntityLookupResult | null> {
    switch (entityType.toLowerCase()) {
      case "user":
        return this.lookupUser(entityId);
      case "client":
        return this.lookupClient(entityId);
      case "clientgroup":
        return this.lookupClientGroup(entityId);
      case "clinician":
        return this.lookupClinician(entityId);
      case "service":
        return this.lookupService(entityId);
      case "location":
        return this.lookupLocation(entityId);
      case "appointment":
        return this.lookupAppointment(entityId);
      case "invoice":
        return this.lookupInvoice(entityId);
      case "payment":
        return this.lookupPayment(entityId);
      case "team":
      case "teammember":
        return this.lookupTeamMember(entityId);
      default:
        return null;
    }
  }

  /**
   * Lookup user details
   */
  static async lookupUser(userId: string): Promise<EntityLookupResult | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        Clinician: {
          select: {
            first_name: true,
            last_name: true,
          },
        },
      },
    });

    if (!user) return null;

    const fullName = user.Clinician
      ? [user.Clinician.first_name, user.Clinician.last_name]
          .filter(Boolean)
          .join(" ")
      : user.email;

    return {
      id: user.id,
      email: user.email,
      firstName: user.Clinician?.first_name || "",
      lastName: user.Clinician?.last_name || "",
      fullName,
      name: fullName,
      user: fullName,
    };
  }

  /**
   * Lookup client details
   */
  static async lookupClient(
    clientId: string,
  ): Promise<EntityLookupResult | null> {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        legal_first_name: true,
        legal_last_name: true,
        preferred_name: true,
      },
    });

    if (!client) return null;

    const firstName = client.preferred_name || client.legal_first_name;
    const fullName = `${firstName} ${client.legal_last_name}`;

    return {
      id: client.id,
      firstName,
      lastName: client.legal_last_name,
      fullName,
      clientName: fullName,
      name: fullName,
      client: fullName,
    };
  }

  /**
   * Lookup client group details
   */
  static async lookupClientGroup(
    clientGroupId: string,
  ): Promise<EntityLookupResult | null> {
    const clientGroup = await prisma.clientGroup.findUnique({
      where: { id: clientGroupId },
      select: {
        id: true,
        name: true,
        type: true,
      },
    });

    if (!clientGroup) return null;

    return {
      id: clientGroup.id,
      name: clientGroup.name,
      clientGroup: clientGroup.name,
      clientGroupName: clientGroup.name,
      type: clientGroup.type,
    };
  }

  /**
   * Lookup clinician details
   */
  static async lookupClinician(
    clinicianId: string,
  ): Promise<EntityLookupResult | null> {
    const clinician = await prisma.clinician.findUnique({
      where: { id: clinicianId },
      select: {
        id: true,
        user_id: true,
        first_name: true,
        last_name: true,
        User: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!clinician) return null;

    const fullName =
      [clinician.first_name, clinician.last_name].filter(Boolean).join(" ") ||
      clinician.User?.email ||
      "Unknown Clinician";

    return {
      id: clinician.id,
      userId: clinician.user_id,
      fullName,
      clinician: fullName,
      clinicianName: fullName,
      name: fullName,
    };
  }

  /**
   * Lookup service details
   */
  static async lookupService(
    serviceId: string,
  ): Promise<EntityLookupResult | null> {
    const service = await prisma.practiceService.findUnique({
      where: { id: serviceId },
      select: {
        id: true,
        code: true,
        type: true,
        description: true,
        rate: true,
      },
    });

    if (!service) return null;

    const serviceName = service.type; // 'type' field contains the service name

    return {
      id: service.id,
      code: service.code,
      name: serviceName,
      service: serviceName,
      serviceName: serviceName,
      description: service.description || "",
      rate: service.rate.toString(),
    };
  }

  /**
   * Lookup location details
   */
  static async lookupLocation(
    locationId: string,
  ): Promise<EntityLookupResult | null> {
    const location = await prisma.location.findUnique({
      where: { id: locationId },
      select: {
        id: true,
        name: true,
        address: true,
        street: true,
        city: true,
        state: true,
        zip: true,
      },
    });

    if (!location) return null;

    // Build full address from available fields
    const addressParts = [
      location.street,
      location.address,
      location.city,
      location.state,
      location.zip,
    ].filter(Boolean);

    const fullAddress = addressParts.join(", ") || location.address || "";

    return {
      id: location.id,
      name: location.name,
      location: location.name,
      locationName: location.name,
      address: fullAddress,
    };
  }

  /**
   * Lookup appointment details
   */
  static async lookupAppointment(
    appointmentId: string,
  ): Promise<EntityLookupResult | null> {
    const appointment = await prisma.appointment.findUnique({
      where: { id: appointmentId },
      select: {
        id: true,
        start_date: true,
        end_date: true,
        status: true,
        type: true,
        title: true,
        appointment_fee: true,
      },
    });

    if (!appointment) return null;

    return {
      id: appointment.id,
      startDate: appointment.start_date,
      endDate: appointment.end_date,
      status: appointment.status,
      type: appointment.type,
      title: appointment.title || "",
      fee: appointment.appointment_fee?.toString() || "0",
    };
  }

  /**
   * Lookup invoice details
   */
  static async lookupInvoice(
    invoiceId: string,
  ): Promise<EntityLookupResult | null> {
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      select: {
        id: true,
        invoice_number: true,
        amount: true,
        status: true,
        type: true,
        due_date: true,
      },
    });

    if (!invoice) return null;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoice_number,
      invoice: `#${invoice.invoice_number}`,
      amount: invoice.amount.toString(),
      status: invoice.status,
      type: invoice.type,
      dueDate: invoice.due_date,
    };
  }

  /**
   * Lookup payment details
   */
  static async lookupPayment(
    paymentId: string,
  ): Promise<EntityLookupResult | null> {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      select: {
        id: true,
        amount: true,
        status: true,
        transaction_id: true,
        payment_date: true,
        credit_card_id: true,
      },
    });

    if (!payment) return null;

    return {
      id: payment.id,
      amount: payment.amount.toString(),
      status: payment.status,
      transactionId: payment.transaction_id || "",
      paymentDate: payment.payment_date,
      creditCardId: payment.credit_card_id || "",
    };
  }

  /**
   * Lookup team member details
   */
  static async lookupTeamMember(
    userId: string,
  ): Promise<EntityLookupResult | null> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        UserRole: {
          include: {
            Role: true,
          },
        },
        Clinician: true,
      },
    });

    if (!user) return null;

    const fullName = user.Clinician
      ? [user.Clinician.first_name, user.Clinician.last_name]
          .filter(Boolean)
          .join(" ")
      : user.email;
    const role = user.UserRole[0]?.Role?.name || "Team Member";
    const isProvider = !!user.Clinician;

    return {
      id: user.id,
      email: user.email,
      firstName: user.Clinician?.first_name || "",
      lastName: user.Clinician?.last_name || "",
      fullName,
      name: fullName,
      teamMember: fullName,
      role,
      isProvider: isProvider ? "Yes" : "No",
    };
  }

  /**
   * Batch lookup multiple entities
   */
  static async batchLookup(
    lookups: Array<{ type: string; id: string }>,
  ): Promise<Record<string, EntityLookupResult | null>> {
    const results: Record<string, EntityLookupResult | null> = {};

    await Promise.all(
      lookups.map(async ({ type, id }) => {
        const key = `${type}:${id}`;
        results[key] = await this.lookup(type, id);
      }),
    );

    return results;
  }

  /**
   * Get display name for any entity
   */
  static async getDisplayName(
    entityType: string,
    entityId: string,
  ): Promise<string> {
    const result = await this.lookup(entityType, entityId);

    if (!result) return "Unknown";

    // Try common name fields in order of preference
    const nameFields = [
      "name",
      "fullName",
      "clientGroup",
      "clinician",
      "service",
      "location",
    ];

    for (const field of nameFields) {
      if (result[field] && typeof result[field] === "string") {
        return result[field] as string;
      }
    }

    // For invoice, use invoice number
    if (result.invoiceNumber) {
      return `#${result.invoiceNumber}`;
    }

    return "Unknown";
  }
}
