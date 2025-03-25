// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import prismaMock from "@mcw/database/mock";
import type { Clinician } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";

vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
}));

import { DELETE, GET, POST, PUT } from "./route";

describe("Clinician API", () => {
  let clinicians: Clinician[];

  beforeEach(() => {
    clinicians = [
      {
        id: "1",
        first_name: "John",
        last_name: "Doe",
        address: "123 Main St",
        percentage_split: 50,
        is_active: true,
        user_id: "1",
      },
      {
        id: "2",
        first_name: "Jane",
        last_name: "Doe",
        address: "456 Main St",
        percentage_split: 50,
        is_active: true,
        user_id: "2",
      },
    ];
  });

  it("GET /api/clinician/?id=1", async () => {
    const req = createRequest("/api/clinician/?id=1");

    prismaMock.clinician.findUnique.mockResolvedValueOnce(clinicians[0]);

    const response = await GET(req);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(clinicians[0]);
  });

  it("GET /api/clinician", async () => {
    const req = createRequest("/api/clinician");

    prismaMock.clinician.findMany.mockResolvedValue(clinicians);

    const response = await GET(req);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual(clinicians);
  });

  it("POST /api/clinician", async () => {
    const req = createRequestWithBody("/api/clinician", clinicians[0]);

    prismaMock.clinician.create.mockResolvedValue(clinicians[0]);

    const response = await POST(req);

    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toEqual(clinicians[0]);
  });

  it("DELETE /api/clinician", async () => {
    const req = createRequest("/api/clinician/?id=1", {
      method: "DELETE",
    });

    prismaMock.clinician.findUnique.mockResolvedValue(clinicians[0]);
    prismaMock.clinician.delete.mockResolvedValue({
      ...clinicians[0],
      is_active: false,
    });

    const response = await DELETE(req);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      message: "Clinician deactivated successfully",
      clinician: {
        ...clinicians[0],
        is_active: false,
      },
    });
  });

  it("PUT /api/clinician", async () => {
    const req = createRequestWithBody("/api/clinician", clinicians[0], {
      method: "PUT",
    });

    prismaMock.clinician.findUnique.mockResolvedValue(clinicians[0]);
    prismaMock.clinician.update.mockResolvedValue({
      ...clinicians[0],
      first_name: "John 2",
    });

    const response = await PUT(req);

    expect(response.status).toBe(200);

    await expect(response.json()).resolves.toEqual({
      ...clinicians[0],
      first_name: "John 2",
    });
  });
});
