/* eslint-disable max-lines-per-function */

import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { useRouter, useParams } from "next/navigation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TemplateSelectionPage from "@/(dashboard)/clients/[id]/diagnosisAndTreatmentPlan/template-selection/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

// Mock services
vi.mock("@/(dashboard)/clients/services/client.service", () => ({
  fetchSingleClientGroup: vi.fn(),
}));

// Mock hooks
vi.mock("@/(dashboard)/settings/template-library/hooks/useTemplates", () => ({
  useTemplates: vi.fn(),
}));

// Mock template types
vi.mock("@/types/templateTypes", () => ({
  TemplateType: {
    SCORED_MEASURES: "scored_measures",
    INTAKE_FORMS: "intake_forms",
    PROGRESS_NOTES: "progress_notes",
    DIAGNOSIS_AND_TREATMENT_PLANS: "diagnosis_and_treatment_plans",
    OTHER_DOCUMENTS: "other_documents",
    UPLOADED_FILES: "uploaded_files",
  },
}));

// Mock components
vi.mock("@/(dashboard)/clients/[id]/components/ClientInfoHeader", () => ({
  ClientInfoHeader: vi.fn(({ onDocumentationHistoryClick }) => (
    <div data-testid="client-info-header">
      <button onClick={onDocumentationHistoryClick}>
        Documentation History
      </button>
    </div>
  )),
}));

vi.mock(
  "@/(dashboard)/clients/[id]/components/DocumentationHistorySidebar",
  () => ({
    default: vi.fn(({ open, onClose }) =>
      open ? (
        <div data-testid="documentation-sidebar">
          <button onClick={onClose}>Close</button>
        </div>
      ) : null,
    ),
  }),
);

describe("Template Selection Page", () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
      back: mockBack,
    });
    (useParams as Mock).mockReturnValue({
      id: "test-client-group-id",
    });
  });

  const renderComponent = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <TemplateSelectionPage />
      </QueryClientProvider>,
    );
  };

  const cleanup = () => {
    queryClient.clear();
  };

  it("should render the page with loading state", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (useTemplates as Mock).mockReturnValue({
      data: null,
      isLoading: true,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    expect(screen.getByText("Select Treatment Plan Template")).toBeDefined();
    expect(screen.getByText("Loading templates...")).toBeDefined();
  });

  it("should display templates when loaded", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    const mockTemplates = [
      {
        id: "template-1",
        name: "Standard Treatment Plan",
        description: "A comprehensive treatment plan template",
        type: "diagnosis_and_treatment_plans",
        is_default: true,
        is_active: true,
      },
      {
        id: "template-2",
        name: "Brief Treatment Plan",
        description: "A concise treatment plan template",
        type: "diagnosis_and_treatment_plans",
        is_default: false,
        is_active: true,
      },
    ];

    (useTemplates as Mock).mockReturnValue({
      data: { data: mockTemplates },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText("Standard Treatment Plan")).toBeDefined();
    });

    expect(screen.getByText("Brief Treatment Plan")).toBeDefined();
    expect(screen.getByText("Default")).toBeDefined();
  });

  it("should handle template selection", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    const mockTemplates = [
      {
        id: "template-1",
        name: "Standard Treatment Plan",
        type: "diagnosis_and_treatment_plans",
        is_active: true,
      },
    ];

    (useTemplates as Mock).mockReturnValue({
      data: { data: mockTemplates },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    await waitFor(() => {
      const templateElements = screen.getAllByText("Standard Treatment Plan");
      expect(templateElements.length).toBeGreaterThan(0);
    });

    // Click the first template - use text element directly
    const templates = screen.getAllByText("Standard Treatment Plan");
    fireEvent.click(templates[0]);

    // Wait for visual changes that indicate selection
    await waitFor(() => {
      // Look for other visual indicators of selection without accessing DOM nodes
      const continueButton = screen.getByRole("button", {
        name: /continue with selected template/i,
      });
      // If a template is selected, the continue button should be enabled
      expect(continueButton).not.toBeDisabled();
    });
  });

  it("should navigate when continuing with selected template", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    const mockTemplates = [
      {
        id: "template-1",
        name: "Standard Treatment Plan",
        type: "diagnosis_and_treatment_plans",
        is_active: true,
      },
    ];

    (useTemplates as Mock).mockReturnValue({
      data: { data: mockTemplates },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    // Wait for templates to load and get the first template text
    const templateTexts = await screen.findAllByText("Standard Treatment Plan");
    expect(templateTexts.length).toBeGreaterThan(0);

    // Click on the template text to select it
    fireEvent.click(templateTexts[0]);

    // Wait for the template to be selected by checking if continue button is enabled
    await waitFor(() => {
      const continueBtn = screen.getByRole("button", {
        name: /continue with selected template/i,
      });
      expect(continueBtn).not.toBeDisabled();
    });

    // Now click the continue button
    const continueButton = screen.getByRole("button", {
      name: /continue with selected template/i,
    });
    fireEvent.click(continueButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/clients/test-client-group-id/diagnosisAndTreatmentPlan/new",
      );
    });
  });

  it("should navigate when skipping template", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (useTemplates as Mock).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    const skipButton = await screen.findByRole("button", {
      name: /continue without template/i,
    });
    fireEvent.click(skipButton);

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(
        "/clients/test-client-group-id/diagnosisAndTreatmentPlan/new",
      );
    });
  });

  it("should show no templates message when none available", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (useTemplates as Mock).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    const noTemplatesElements = await screen.findAllByText(
      "No templates available",
    );
    expect(noTemplatesElements.length).toBeGreaterThan(0);
    const manageTemplatesElements = screen.getAllByText("Manage Templates");
    expect(manageTemplatesElements.length).toBeGreaterThan(0);
  });

  it("should handle back navigation", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (useTemplates as Mock).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    const backButtons = await screen.findAllByText("Back");
    // Use the last one
    fireEvent.click(backButtons[backButtons.length - 1]);

    expect(mockBack).toHaveBeenCalled();
  });

  it("should toggle documentation sidebar", async () => {
    const { useTemplates } = await import(
      "@/(dashboard)/settings/template-library/hooks/useTemplates"
    );
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (useTemplates as Mock).mockReturnValue({
      data: { data: [] },
      isLoading: false,
    });

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    renderComponent();

    // Open sidebar
    const docHistoryButton = await screen.findByText("Documentation History");
    fireEvent.click(docHistoryButton);

    expect(screen.getByTestId("documentation-sidebar")).toBeDefined();

    // Close sidebar
    const closeButton = screen.getByText("Close");
    fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("documentation-sidebar")).toBeNull();
    });
  });
});
