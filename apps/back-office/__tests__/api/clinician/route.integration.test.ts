import { describe, it, expect, beforeEach } from "vitest";
import type { Clinician, User } from "@mcw/database";
import { prisma } from "@mcw/database";
import { createRequest, createRequestWithBody } from "@mcw/utils";
import { v4 as uuidv4 } from "uuid";

import { DELETE, GET, POST, PUT } from "@/api/clinician/route";

describe("Clinician API", () => {
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

  beforeEach(async () => {
    await prisma.clinician.deleteMany();
    await prisma.user.deleteMany();
    await prisma.user.createMany({
      data: users,
    });
    await prisma.clinician.createMany({
      data: clinicians,
    });
  });

  it(`GET /api/clinician/?id=${clinicians[0].id}`, async () => {
    const req = createRequest(`/api/clinician/?id=${clinicians[0].id}`);

    const response = await GET(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toHaveProperty("id", clinicians[0].id);
    expect(json).toHaveProperty("User.email", users[0].email);
  });

  it("GET /api/clinician", async () => {
    const req = createRequest("/api/clinician");

    const response = await GET(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toHaveLength(clinicians.length);
  });

  it("POST /api/clinician", async () => {
    await prisma.clinician.delete({
      where: {
        user_id: users[0].id,
      },
    });

    const clinicianBody = {
      user_id: users[0].id,
      address: "123 Main St",
      percentage_split: 50,
      first_name: "John",
      last_name: "Doe",
      is_active: true,
    };

    const req = createRequestWithBody("/api/clinician", clinicianBody);

    const response = await POST(req);

    expect(response.status).toBe(201);

    const json = await response.json();

    expect(json).toEqual({
      ...clinicianBody,
      id: expect.any(String),
    });
  });

  it(`DELETE /api/clinician/?id=${clinicians[0].id}`, async () => {
    const req = createRequest(`/api/clinician/?id=${clinicians[0].id}`, {
      method: "DELETE",
    });

    const response = await DELETE(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual({
      message: "Clinician deactivated successfully",
      clinician: {
        ...clinicians[0],
        is_active: false,
      },
    });
  });

  it("PUT /api/clinician", async () => {
    const clinician = clinicians[0];
    const updatedClinician = {
      ...clinician,
      first_name: "John 2",
    };
    const req = createRequestWithBody("/api/clinician", updatedClinician, {
      method: "PUT",
    });

    const response = await PUT(req);

    expect(response.status).toBe(200);

    const json = await response.json();

    expect(json).toEqual({
      ...clinician,
      first_name: "John 2",
    });
  });
});
