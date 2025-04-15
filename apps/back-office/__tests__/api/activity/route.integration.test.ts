import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "@mcw/database";
import type { Audit } from "@mcw/database";
import { GET } from "@/api/activity/route";
import {
  UserPrismaFactory,
  ClientPrismaFactory,
} from "@mcw/database/mock-data";
import { NextRequest } from "next/server";

interface AuditResponse extends Audit {
  Client?: {
    legal_first_name: string;
    legal_last_name: string;
  };
  User?: {
    email: string;
  };
}

describe("Activity API Integration Tests", () => {
  beforeEach(async () => {
    await prisma.audit.deleteMany();
    await prisma.client.deleteMany();
    await prisma.userRole.deleteMany();
    await prisma.user.deleteMany();
  });

  it("GET /api/activity should return all audit logs", async () => {
    // Create test users and clients
    const user1 = await UserPrismaFactory.create();
    const user2 = await UserPrismaFactory.create();
    const client1 = await ClientPrismaFactory.create();
    const client2 = await ClientPrismaFactory.create();

    // Create test audit entries
    const audits = await Promise.all([
      prisma.audit.create({
        data: {
          event_type: "LOGIN",
          event_text: "User logged into the system",
          is_hipaa: false,
          datetime: new Date(),
          user_id: user1.id,
          client_id: client1.id,
        },
      }),
      prisma.audit.create({
        data: {
          event_type: "VIEW",
          event_text: "Viewed client medical records",
          is_hipaa: true,
          datetime: new Date(),
          user_id: user2.id,
          client_id: client2.id,
        },
      }),
    ]);

    const response = await GET(
      new NextRequest(new URL("http://localhost/api/activity")),
    );

    expect(response.status).toBe(200);
    const json = (await response.json()) as AuditResponse[];

    // Verify response structure
    expect(json).toHaveLength(audits.length);

    // Verify audit entries are returned with correct data
    audits.forEach((audit) => {
      const foundAudit = json.find((a) => a.Id === audit.Id);
      expect(foundAudit).toBeDefined();
      expect(foundAudit).toHaveProperty("event_type", audit.event_type);
      expect(foundAudit).toHaveProperty("event_text", audit.event_text);
      expect(foundAudit).toHaveProperty("is_hipaa", audit.is_hipaa);
      expect(foundAudit).toHaveProperty("datetime");
    });

    // Verify first audit entry has correct relations
    const firstAudit = json.find((a) => a.Id === audits[0].Id);
    expect(firstAudit).toHaveProperty(
      "Client.legal_first_name",
      client1.legal_first_name,
    );
    expect(firstAudit).toHaveProperty(
      "Client.legal_last_name",
      client1.legal_last_name,
    );
    expect(firstAudit).toHaveProperty("User.email", user1.email);

    // Verify second audit entry has correct relations
    const secondAudit = json.find((a) => a.Id === audits[1].Id);
    expect(secondAudit).toHaveProperty(
      "Client.legal_first_name",
      client2.legal_first_name,
    );
    expect(secondAudit).toHaveProperty(
      "Client.legal_last_name",
      client2.legal_last_name,
    );
    expect(secondAudit).toHaveProperty("User.email", user2.email);
  });
});
