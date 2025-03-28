import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import { createRequest } from "@mcw/utils";
import { GET } from "@/api/clinician/route";
import prismaMock from "@mcw/database/mock";
import { ClinicianFactory, UserFactory } from "@mcw/database/mock-data";

describe("Clinician API Unit Tests", async () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/clinician should return all clinicians", async () => {
    const user0 = UserFactory.build();
    const user1 = UserFactory.build();
    const clinician0 = ClinicianFactory.build({ user_id: user0.id });
    const clinician1 = ClinicianFactory.build({ user_id: user1.id });

    const clinicians = [clinician0, clinician1];

    // Mock the prisma response for findMany
    prismaMock.clinician.findMany.mockResolvedValueOnce(clinicians);

    const req = createRequest("/api/clinician");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify response structure
    expect(json).toHaveLength(clinicians.length);

    // Verify first clinician data
    expect(json[0]).toHaveProperty("id", clinician0.id);
    expect(json[0]).toHaveProperty("user_id", clinician0.user_id);

    // Verify second clinician data
    expect(json[1]).toHaveProperty("id", clinician1.id);
    expect(json[1]).toHaveProperty("user_id", clinician1.user_id);

    // Verify the mock was called with correct parameters
    expect(prismaMock.clinician.findMany).toHaveBeenCalledWith({
      include: {
        User: {
          select: {
            email: true,
          },
        },
      },
    });
  });
});
