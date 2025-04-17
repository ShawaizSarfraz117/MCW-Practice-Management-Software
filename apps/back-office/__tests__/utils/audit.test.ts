import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import { createAuditLog, AuditEventTypes } from "@/utils/index";
import {
  UserPrismaFactory,
  ClientPrismaFactory,
} from "@mcw/database/mock-data";

describe("Audit Utils", () => {
  beforeEach(async () => {
    await prisma.audit.deleteMany();
    await prisma.client.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  it("should create an audit log entry with all fields", async () => {
    // Create test user and client
    const user = await UserPrismaFactory.create();
    const client = await ClientPrismaFactory.create();

    const auditData = {
      event_type: AuditEventTypes.CLIENT.CREATE,
      event_text: "Created new client record",
      client_id: client.id,
      user_id: user.id,
      is_hipaa: true,
    };

    const audit = await createAuditLog(auditData);

    expect(audit).toBeDefined();
    expect(audit.Id).toBeDefined();
    if (audit.event_type) {
      expect(audit.event_type.trim()).toBe(auditData.event_type);
    } else {
      throw new Error("event_type should not be null in this test case");
    }
    expect(audit.event_text).toBe(auditData.event_text);
    expect(audit.client_id).toBe(auditData.client_id);
    expect(audit.user_id).toBe(auditData.user_id);
    expect(audit.is_hipaa).toBe(auditData.is_hipaa);
    expect(audit.datetime).toBeDefined();
  });

  it("should create an audit log entry without optional fields", async () => {
    const user = await UserPrismaFactory.create();

    const auditData = {
      event_type: AuditEventTypes.USER.LOGIN,
      event_text: "User logged in",
      user_id: user.id,
    };

    const audit = await createAuditLog(auditData);

    expect(audit).toBeDefined();
    expect(audit.Id).toBeDefined();
    if (audit.event_type) {
      expect(audit.event_type.trim()).toBe(auditData.event_type);
    } else {
      throw new Error("event_type should not be null in this test case");
    }
    expect(audit.event_text).toBe(auditData.event_text);
    expect(audit.user_id).toBe(auditData.user_id);
    expect(audit.client_id).toBeNull();
    expect(audit.is_hipaa).toBe(false); // Default value
    expect(audit.datetime).toBeDefined();
  });

  it("should throw an error when audit log creation fails due to invalid foreign key", async () => {
    // Create a user first
    const user = await UserPrismaFactory.create();
    const userId = user.id;

    // Delete the user to make the ID invalid
    await prisma.user.delete({ where: { id: userId } });

    // Try to create an audit log with the now-invalid user ID
    const auditData = {
      event_type: AuditEventTypes.USER.LOGIN,
      event_text: "User logged in",
      user_id: userId, // This ID no longer exists in the database
    };

    await expect(createAuditLog(auditData)).rejects.toThrow();
  });

  it("should create audit logs with different event types", async () => {
    const user = await UserPrismaFactory.create();
    const client = await ClientPrismaFactory.create();

    // Test different event types
    const eventTypes = [
      { type: AuditEventTypes.CLIENT.CREATE, text: "Created client" },
      { type: AuditEventTypes.CLIENT.UPDATE, text: "Updated client" },
      { type: AuditEventTypes.APPOINTMENT.CREATE, text: "Created appointment" },
      { type: AuditEventTypes.DOCUMENT.VIEW, text: "Viewed document" },
    ];

    for (const event of eventTypes) {
      const auditData = {
        event_type: event.type,
        event_text: event.text,
        user_id: user.id,
        client_id: client.id,
      };

      const audit = await createAuditLog(auditData);

      expect(audit).toBeDefined();
      if (audit.event_type) {
        expect(audit.event_type.trim()).toBe(event.type);
      } else {
        throw new Error("event_type should not be null in this test case");
      }
      expect(audit.event_text).toBe(event.text);
    }

    // Verify all audit logs were created
    const allAudits = await prisma.audit.findMany({
      where: { user_id: user.id },
    });
    expect(allAudits).toHaveLength(eventTypes.length);
  });
});
