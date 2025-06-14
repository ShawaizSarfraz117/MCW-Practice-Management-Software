import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Mock } from "vitest";
import { fetchSurveyTemplates } from "@/(dashboard)/clients/[id]/diagnosisAndTreatmentPlan/services/surveyTemplate.service";

// Mock fetch
global.fetch = vi.fn();

describe("Survey Template Service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchSurveyTemplates", () => {
    it("should fetch survey templates successfully", async () => {
      const mockResponse = {
        data: [
          {
            id: "123",
            name: "Behavioral Health Treatment Plan",
            content: { sections: [] },
            type: "diagnosis_treatment_plan",
            is_active: true,
            created_at: "2024-01-01T00:00:00Z",
            updated_at: "2024-01-01T00:00:00Z",
          },
        ],
        pagination: {
          page: 1,
          limit: 20,
          total: 1,
          totalPages: 1,
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchSurveyTemplates(
        "diagnosis_treatment_plan",
        true,
      );

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/survey-templates?type=diagnosis_treatment_plan&is_active=true&include_answers=false",
      );
      expect(result).toEqual(mockResponse);
    });

    it("should fetch all templates when no filters provided", async () => {
      const mockResponse = {
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      };

      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await fetchSurveyTemplates();

      expect(global.fetch).toHaveBeenCalledWith(
        "/api/survey-templates?include_answers=false",
      );
      expect(result).toEqual(mockResponse);
    });

    it("should return empty data when fetch fails", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "Failed to fetch templates" }),
      });

      const result = await fetchSurveyTemplates("diagnosis_treatment_plan");

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should handle network errors gracefully", async () => {
      (global.fetch as Mock).mockRejectedValueOnce(new Error("Network error"));

      const result = await fetchSurveyTemplates();

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });

    it("should handle malformed response gracefully", async () => {
      (global.fetch as Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ invalid: "response" }),
      });

      const result = await fetchSurveyTemplates();

      expect(result).toEqual({
        data: [],
        pagination: {
          page: 1,
          limit: 20,
          total: 0,
          totalPages: 0,
        },
      });
    });
  });
});
