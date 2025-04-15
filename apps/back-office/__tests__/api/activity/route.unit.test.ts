import { describe, it, expect, vi } from "vitest";
import { GET } from "@/api/activity/route";
import { prisma } from "@mcw/database";
import type { Audit } from "@mcw/database";
import {
  AuditFactory,
  UserFactory,
  ClientFactory,
} from "@mcw/database/mock-data";

// Mock the Prisma client
vi.mock("@mcw/database", () => ({
  prisma: {
    audit: {
      findMany: vi.fn(),
    },
  },
}));

interface AuditWithRelations extends Audit {
  Client?: {
    legal_first_name: string | null;
    legal_last_name: string | null;
  };
  User?: {
    email: string;
  };
}

describe("Activity API Unit Tests", () => {
  it("GET /api/activity should return all audit logs", async () => {
    // Create mock data
    const user = UserFactory.build();
    const client = ClientFactory.build();
    const auditData: AuditWithRelations[] = [
      {
        Id: AuditFactory.build().id,
        client_id: client.id,
        user_id: user.id,
        event_type: "CLIENT_CREATE",
        event_text: "Created new client record",
        is_hipaa: false,
        datetime: new Date(),
        Client: {
          legal_first_name: client.legal_first_name || null,
          legal_last_name: client.legal_last_name || null,
        },
        User: {
          email: user.email,
        },
      },
      {
        Id: AuditFactory.build().id,
        client_id: client.id,
        user_id: user.id,
        event_type: "CLIENT_UPDATE",
        event_text: "Updated client information",
        is_hipaa: true,
        datetime: new Date(),
        Client: {
          legal_first_name: client.legal_first_name || null,
          legal_last_name: client.legal_last_name || null,
        },
        User: {
          email: user.email,
        },
      },
    ];

    // Mock the Prisma findMany call
    const mockFindMany = prisma.audit.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockResolvedValueOnce(auditData);

    const response = await GET();

    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json).toHaveLength(auditData.length);
    auditData.forEach((audit) => {
      const foundAudit = json.find(
        (a: AuditWithRelations) => a.Id === audit.Id,
      );
      expect(foundAudit).toBeDefined();
      expect(foundAudit).toHaveProperty("Id", audit.Id);
      expect(foundAudit).toHaveProperty("client_id", audit.client_id);
      expect(foundAudit).toHaveProperty("user_id", audit.user_id);
      expect(foundAudit.event_type?.trim()).toBe(audit.event_type);
      expect(foundAudit).toHaveProperty("event_text", audit.event_text);
      expect(foundAudit).toHaveProperty("is_hipaa", audit.is_hipaa);
      expect(foundAudit.Client).toBeDefined();
      expect(foundAudit.User).toBeDefined();
    });
  });

  it("GET /api/activity should handle database errors", async () => {
    // Mock the Prisma findMany call to throw an error
    const mockFindMany = prisma.audit.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockRejectedValueOnce(new Error("Database error"));

    const response = await GET();

    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to fetch audit logs" });
  });
});
