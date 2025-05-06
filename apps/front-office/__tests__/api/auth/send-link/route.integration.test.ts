import { describe, it, expect, vi, beforeEach } from "vitest";
import { sendEmail } from "@/utils/email";
import { POST } from "@/api/auth/send-link/route";
import prismaMock from "@mcw/database/mock";
import { createRequest } from "@mcw/utils";

vi.mock("@mcw/database", () => ({
  prisma: prismaMock,
}));

vi.mock("@/utils/email", () => ({
  sendEmail: vi.fn(),
}));

describe("POST /sendLink", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 500 if JWT_SECRET is not set", async () => {
    process.env.JWT_SECRET = "";
    const request = createRequest("/api/auth/send-link", {
      method: "POST",
      body: JSON.stringify({ email: "test@example.com" }),
    });
    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Server configuration error",
      statusCode: 500,
    });
  });

  it("should return 400 if email is invalid", async () => {
    const request = createRequest("/api/auth/send-link", {
      method: "POST",
      body: JSON.stringify({ email: "invalid-email" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      message: "Invalid email format",
      statusCode: 400,
    });
  });

  it("should create a new login link and send email if client is new", async () => {
    process.env.JWT_SECRET = "testsecret";
    const email = "newclient@example.com";
    const request = createRequest("/api/auth/send-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValue(null);
    prismaMock.clientLoginLink.create.mockResolvedValue({ id: 1, email });
    prismaMock.clientLoginLink.update.mockResolvedValue({
      id: 1,
      token: "newtoken",
    });
    sendEmail.mockResolvedValue(true);

    const response = await POST(request);
    expect(response.status).toBe(201);
    expect(await response.json()).toEqual({
      message: "Client registered and Login Link sent",
      statusCode: 201,
    });
    expect(prismaMock.clientLoginLink.create).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      email,
      "Client Registered and Login Link Sent",
      expect.any(String),
    );
  });

  it("should update existing login link and send email if client exists", async () => {
    process.env.JWT_SECRET = "testsecret";
    const email = "existingclient@example.com";
    const request = createRequest("/api/auth/send-link", {
      method: "POST",
      body: JSON.stringify({ email }),
    });

    prismaMock.clientLoginLink.findFirst.mockResolvedValue({ id: 1, email });
    prismaMock.clientLoginLink.update.mockResolvedValue({
      id: 1,
      token: "existingtoken",
    });
    sendEmail.mockResolvedValue(true);

    const response = await POST(request);
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      message: "New Login Link Sent to the Client",
      statusCode: 200,
    });
    expect(prismaMock.clientLoginLink.update).toHaveBeenCalled();
    expect(sendEmail).toHaveBeenCalledWith(
      email,
      "New Login Link Sent to the Client",
      expect.any(String),
    );
  });

  it("should handle unexpected errors gracefully", async () => {
    process.env.JWT_SECRET = "testsecret";
    const request = createRequest("/api/auth/send-link", {
      method: "POST",
      body: JSON.stringify({ email: "errorclient@example.com" }),
    });

    prismaMock.clientLoginLink.findFirst.mockRejectedValue(
      new Error("Database error"),
    );

    const response = await POST(request);
    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      message: "Internal server error",
      statusCode: 500,
    });
  });
});
