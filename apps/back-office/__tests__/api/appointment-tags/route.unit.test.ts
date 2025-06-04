import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  GET,
  POST,
  PUT,
  DELETE,
  updatePaymentStatusTag,
  updateNoteStatusTag,
} from "@/api/appointment-tags/route";
import prismaMock from "@mcw/database/mock";
import { createRequest, createRequestWithBody } from "@mcw/utils";

describe("Appointment Tags API - Unit Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/appointment-tags", () => {
    it("should return all tags when no appointmentId is provided", async () => {
      const mockTags = [
        { id: "tag-1", name: "Appointment Paid", color: "#10b981" },
        { id: "tag-2", name: "Appointment Unpaid", color: "#ef4444" },
        { id: "tag-3", name: "New Client", color: "#3b82f6" },
      ];

      prismaMock.tag.findMany.mockResolvedValueOnce(mockTags);

      const request = createRequest("/api/appointment-tags");
      const response = await GET(request);
      const data = await response.json();

      expect(prismaMock.tag.findMany).toHaveBeenCalledWith({
        orderBy: { name: "asc" },
      });
      expect(data).toEqual(mockTags);
      expect(response.status).toBe(200);
    });

    it("should return tags for a specific appointment", async () => {
      const mockAppointmentTags = [
        {
          id: "at-1",
          appointment_id: "appt-1",
          tag_id: "tag-1",
          Tag: { id: "tag-1", name: "Appointment Unpaid", color: "#ef4444" },
        },
        {
          id: "at-2",
          appointment_id: "appt-1",
          tag_id: "tag-2",
          Tag: { id: "tag-2", name: "No Note", color: "#f59e0b" },
        },
      ];

      prismaMock.appointmentTag.findMany.mockResolvedValueOnce(
        mockAppointmentTags,
      );

      const request = createRequest(
        "/api/appointment-tags?appointmentId=appt-1",
      );
      const response = await GET(request);
      const data = await response.json();

      expect(prismaMock.appointmentTag.findMany).toHaveBeenCalledWith({
        where: { appointment_id: "appt-1" },
        include: { Tag: true },
      });
      expect(data).toEqual(mockAppointmentTags);
      expect(response.status).toBe(200);
    });

    it("should handle errors gracefully", async () => {
      prismaMock.tag.findMany.mockRejectedValueOnce(
        new Error("Database error"),
      );

      const request = createRequest("/api/appointment-tags");
      const response = await GET(request);
      const data = await response.json();

      expect(data).toEqual({ error: "Failed to fetch tags" });
      expect(response.status).toBe(500);
    });
  });

  describe("POST /api/appointment-tags", () => {
    it("should add a tag to an appointment", async () => {
      const mockAppointmentTag = {
        id: "at-1",
        appointment_id: "appt-1",
        tag_id: "tag-1",
        Tag: { id: "tag-1", name: "Appointment Paid", color: "#10b981" },
      };

      prismaMock.appointmentTag.findFirst.mockResolvedValueOnce(null);
      prismaMock.appointmentTag.create.mockResolvedValueOnce(
        mockAppointmentTag,
      );

      const request = createRequestWithBody("/api/appointment-tags", {
        appointmentId: "appt-1",
        tagId: "tag-1",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(prismaMock.appointmentTag.create).toHaveBeenCalledWith({
        data: {
          appointment_id: "appt-1",
          tag_id: "tag-1",
        },
        include: { Tag: true },
      });
      expect(data).toEqual(mockAppointmentTag);
      expect(response.status).toBe(201);
    });

    it("should return error if tag is already assigned", async () => {
      prismaMock.appointmentTag.findFirst.mockResolvedValueOnce({
        id: "at-1",
        appointment_id: "appt-1",
        tag_id: "tag-1",
      });

      const request = createRequestWithBody("/api/appointment-tags", {
        appointmentId: "appt-1",
        tagId: "tag-1",
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({
        error: "Tag already assigned to this appointment",
      });
      expect(response.status).toBe(400);
    });

    it("should return error if required fields are missing", async () => {
      const request = createRequestWithBody("/api/appointment-tags", {
        appointmentId: "appt-1",
        // missing tagId
      });

      const response = await POST(request);
      const data = await response.json();

      expect(data).toEqual({ error: "appointmentId and tagId are required" });
      expect(response.status).toBe(400);
    });
  });

  describe("PUT /api/appointment-tags", () => {
    it("should replace all tags for an appointment", async () => {
      const updatedTags = [
        {
          id: "at-1",
          appointment_id: "appt-1",
          tag_id: "tag-1",
          Tag: { id: "tag-1", name: "Appointment Paid", color: "#10b981" },
        },
        {
          id: "at-2",
          appointment_id: "appt-1",
          tag_id: "tag-3",
          Tag: { id: "tag-3", name: "Note Added", color: "#22c55e" },
        },
      ];

      prismaMock.appointmentTag.deleteMany.mockResolvedValueOnce({ count: 2 });
      prismaMock.appointmentTag.createMany.mockResolvedValueOnce({ count: 2 });
      prismaMock.appointmentTag.findMany.mockResolvedValueOnce(updatedTags);

      const request = createRequestWithBody(
        "/api/appointment-tags",
        {
          appointmentId: "appt-1",
          tagIds: ["tag-1", "tag-3"],
        },
        { method: "PUT" },
      );

      const response = await PUT(request);
      const data = await response.json();

      expect(prismaMock.appointmentTag.deleteMany).toHaveBeenCalledWith({
        where: { appointment_id: "appt-1" },
      });
      expect(prismaMock.appointmentTag.createMany).toHaveBeenCalledWith({
        data: [
          { appointment_id: "appt-1", tag_id: "tag-1" },
          { appointment_id: "appt-1", tag_id: "tag-3" },
        ],
      });
      expect(data).toEqual(updatedTags);
      expect(response.status).toBe(200);
    });
  });

  describe("DELETE /api/appointment-tags", () => {
    it("should remove a tag from an appointment", async () => {
      const mockAppointmentTag = {
        id: "at-1",
        appointment_id: "appt-1",
        tag_id: "tag-1",
      };

      prismaMock.appointmentTag.findFirst.mockResolvedValueOnce(
        mockAppointmentTag,
      );
      prismaMock.appointmentTag.delete.mockResolvedValueOnce(
        mockAppointmentTag,
      );

      const request = createRequest(
        "/api/appointment-tags?appointmentId=appt-1&tagId=tag-1",
        {
          method: "DELETE",
        },
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(prismaMock.appointmentTag.findFirst).toHaveBeenCalledWith({
        where: {
          appointment_id: "appt-1",
          tag_id: "tag-1",
        },
      });
      expect(prismaMock.appointmentTag.delete).toHaveBeenCalledWith({
        where: {
          id: "at-1",
        },
      });
      expect(data).toEqual({ message: "Tag removed successfully" });
      expect(response.status).toBe(200);
    });

    it("should return error if required parameters are missing", async () => {
      const request = createRequest(
        "/api/appointment-tags?appointmentId=appt-1",
        {
          method: "DELETE",
        },
      );
      const response = await DELETE(request);
      const data = await response.json();

      expect(data).toEqual({ error: "appointmentId and tagId are required" });
      expect(response.status).toBe(400);
    });
  });

  describe("Helper Functions", () => {
    describe("updatePaymentStatusTag", () => {
      it("should update payment status tag to paid", async () => {
        const mockTags = [
          { id: "tag-1", name: "Appointment Paid", color: "#10b981" },
          { id: "tag-2", name: "Appointment Unpaid", color: "#ef4444" },
        ];

        prismaMock.tag.findMany.mockResolvedValueOnce(mockTags);
        prismaMock.appointmentTag.deleteMany.mockResolvedValueOnce({
          count: 1,
        });
        prismaMock.appointmentTag.create.mockResolvedValueOnce({
          id: "at-1",
          appointment_id: "appt-1",
          tag_id: "tag-1",
        });

        await updatePaymentStatusTag("appt-1", true);

        expect(prismaMock.appointmentTag.deleteMany).toHaveBeenCalledWith({
          where: {
            appointment_id: "appt-1",
            tag_id: { in: ["tag-1", "tag-2"] },
          },
        });
        expect(prismaMock.appointmentTag.create).toHaveBeenCalledWith({
          data: {
            appointment_id: "appt-1",
            tag_id: "tag-1",
          },
        });
      });

      it("should update payment status tag to unpaid", async () => {
        const mockTags = [
          { id: "tag-1", name: "Appointment Paid", color: "#10b981" },
          { id: "tag-2", name: "Appointment Unpaid", color: "#ef4444" },
        ];

        prismaMock.tag.findMany.mockResolvedValueOnce(mockTags);
        prismaMock.appointmentTag.deleteMany.mockResolvedValueOnce({
          count: 1,
        });
        prismaMock.appointmentTag.create.mockResolvedValueOnce({
          id: "at-1",
          appointment_id: "appt-1",
          tag_id: "tag-2",
        });

        await updatePaymentStatusTag("appt-1", false);

        expect(prismaMock.appointmentTag.create).toHaveBeenCalledWith({
          data: {
            appointment_id: "appt-1",
            tag_id: "tag-2",
          },
        });
      });
    });

    describe("updateNoteStatusTag", () => {
      it("should update note status tag", async () => {
        const mockTags = [
          { id: "tag-1", name: "Note Added", color: "#22c55e" },
          { id: "tag-2", name: "No Note", color: "#f59e0b" },
        ];

        prismaMock.tag.findMany.mockResolvedValueOnce(mockTags);
        prismaMock.appointmentTag.deleteMany.mockResolvedValueOnce({
          count: 1,
        });
        prismaMock.appointmentTag.create.mockResolvedValueOnce({
          id: "at-1",
          appointment_id: "appt-1",
          tag_id: "tag-1",
        });

        await updateNoteStatusTag("appt-1", true);

        expect(prismaMock.appointmentTag.deleteMany).toHaveBeenCalledWith({
          where: {
            appointment_id: "appt-1",
            tag_id: { in: ["tag-1", "tag-2"] },
          },
        });
        expect(prismaMock.appointmentTag.create).toHaveBeenCalledWith({
          data: {
            appointment_id: "appt-1",
            tag_id: "tag-1",
          },
        });
      });
    });
  });
});
