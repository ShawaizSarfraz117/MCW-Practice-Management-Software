import { vi } from "vitest";
import { describe, it, expect, beforeEach } from "vitest";
import type { Clinician, User } from "@mcw/database";
import prismaMock from "@mcw/database/mock";
import { createRequest } from "@mcw/utils";
import { GET } from "@/api/clinician/route";
import { v4 as uuidv4 } from "uuid";

describe("Clinician API Unit Tests", () => {
  // Define test data
  const clinicians: Clinician[] = [
    {
      id: uuidv4(),
      user_id: uuidv4(),
      address: "123 Main St",
      percentage_split: 50,
      first_name: "John",
      last_name: "Doe",
      is_active: true,
    },
    {
      id: uuidv4(),
      user_id: uuidv4(),
      address: "456 Main St",
      percentage_split: 50,
      first_name: "Jane",
      last_name: "Doe",
      is_active: true,
    },
  ];

  const users: User[] = [
    {
      id: clinicians[0].user_id,
      email: "john.doe@example.com",
      password_hash: "password",
      last_login: null,
    },
    {
      id: clinicians[1].user_id,
      email: "jane.doe@example.com",
      password_hash: "password",
      last_login: null,
    },
  ];

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("GET /api/clinician should return all clinicians", async () => {
    // Mock the prisma response for findMany
    prismaMock.clinician.findMany.mockResolvedValue(
      clinicians.map((clinician, index) => ({
        ...clinician,
        User: users[index], // Include the related User data for each clinician
      })),
    );

    const req = createRequest("/api/clinician");
    const response = await GET(req);

    expect(response.status).toBe(200);
    const json = await response.json();

    // Verify response structure
    expect(json).toHaveLength(clinicians.length);

    // Verify first clinician data
    expect(json[0]).toHaveProperty("id", clinicians[0].id);
    expect(json[0]).toHaveProperty("User.email", users[0].email);

    // Verify second clinician data
    expect(json[1]).toHaveProperty("id", clinicians[1].id);
    expect(json[1]).toHaveProperty("User.email", users[1].email);

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
