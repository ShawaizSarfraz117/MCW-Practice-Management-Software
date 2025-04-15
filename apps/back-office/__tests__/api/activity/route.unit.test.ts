import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/api/activity/route";
import { prisma } from "@mcw/database";
import type { Audit } from "@mcw/database";
import {
  AuditFactory,
  UserFactory,
  ClientFactory,
} from "@mcw/database/mock-data";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
// Mock next-auth
vi.mock("next-auth", () => ({
  getServerSession: vi.fn(),
}));

// Mock the Prisma client
vi.mock("@mcw/database", () => ({
  prisma: {
    audit: {
      findMany: vi.fn(),
      count: vi.fn(),
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
  const mockSession = {
    user: {
      id: "test-user-id",
    },
  };

  beforeEach(() => {
    vi.mocked(getServerSession).mockResolvedValue(mockSession);
  });

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

    // Mock the Prisma count and findMany calls
    const mockCount = prisma.audit.count as unknown as ReturnType<typeof vi.fn>;
    mockCount.mockResolvedValueOnce(auditData.length);

    const mockFindMany = prisma.audit.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockResolvedValueOnce(auditData);

    const request = new NextRequest(
      new URL("http://localhost/api/activity?page=1&limit=20"),
    );

    const response = await GET(request);
    expect(response.status).toBe(200);
    const json = await response.json();

    expect(json.data).toHaveLength(auditData.length);
    expect(json.pagination).toEqual({
      total: auditData.length,
      page: 1,
      limit: 20,
      pages: 1,
    });

    auditData.forEach((audit) => {
      const foundAudit = json.data.find(
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
    const mockFindMany = prisma.audit.findMany as unknown as ReturnType<
      typeof vi.fn
    >;
    mockFindMany.mockRejectedValueOnce(new Error("Database error"));

    const request = new NextRequest(new URL("http://localhost/api/activity"));

    const response = await GET(request);
    expect(response.status).toBe(500);
    const json = await response.json();
    expect(json).toEqual({ error: "Failed to fetch audit logs" });
  });
});
