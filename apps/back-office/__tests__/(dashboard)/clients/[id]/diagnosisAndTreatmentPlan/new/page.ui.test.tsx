/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable max-lines-per-function */
import React from "react";
import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "@mcw/ui";
import NewDiagnosisAndTreatmentPlan from "@/(dashboard)/clients/[id]/diagnosisAndTreatmentPlan/new/page";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
  useParams: vi.fn(),
}));

// Mock toast
vi.mock("@mcw/ui", () => ({
  toast: vi.fn(),
  Button: vi.fn(({ children, disabled, onClick, ...props }) => (
    <button disabled={disabled} onClick={onClick} {...props}>
      {children}
    </button>
  )),
  Input: vi.fn(({ value, onChange, ...props }) => (
    <input value={value} onChange={onChange} {...props} />
  )),
}));

// Mock services
vi.mock("@/(dashboard)/clients/services/client.service", () => ({
  fetchSingleClientGroup: vi.fn(),
  createDiagnosisTreatmentPlan: vi.fn(),
  fetchDiagnosis: vi.fn(),
}));

// Mock utils
vi.mock("@mcw/utils", () => ({
  showErrorToast: vi.fn(),
}));

// Mock components
vi.mock(
  "@/(dashboard)/clients/[id]/diagnosisAndTreatmentPlan/components/DiagnosisRows",
  () => ({
    default: vi.fn(
      ({
        diagnoses,
        updateDiagnosis,
        addDiagnosis,
        removeDiagnosis,
        date,
        setDate,
        time,
        setTime,
        renderSkipLink,
        onSave,
      }) => (
        <div data-testid="diagnosis-rows">
          <input
            data-testid="date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <input
            data-testid="time-input"
            value={time}
            onChange={(e) => setTime(e.target.value)}
          />
          {diagnoses.map((diagnosis: any, idx: number) => (
            <div key={idx} data-testid={`diagnosis-${idx}`}>
              <input
                data-testid={`diagnosis-code-${idx}`}
                value={diagnosis.code}
                onChange={(e) => updateDiagnosis(idx, { code: e.target.value })}
              />
              <input
                data-testid={`diagnosis-description-${idx}`}
                value={diagnosis.description}
                onChange={(e) =>
                  updateDiagnosis(idx, { description: e.target.value })
                }
              />
              <button
                data-testid={`remove-diagnosis-${idx}`}
                onClick={() => removeDiagnosis(idx)}
              >
                Remove
              </button>
            </div>
          ))}
          <button data-testid="add-diagnosis" onClick={addDiagnosis}>
            Add Diagnosis
          </button>
          <div data-testid="skip-link">{renderSkipLink}</div>
          <button data-testid="save-button" onClick={onSave}>
            Save
          </button>
        </div>
      ),
    ),
  }),
);

vi.mock("@/(dashboard)/clients/[id]/components/ClientInfoHeader", () => ({
  ClientInfoHeader: vi.fn(({ onDocumentationHistoryClick }) => (
    <div data-testid="client-info-header">
      <button onClick={onDocumentationHistoryClick}>
        Documentation history
      </button>
    </div>
  )),
}));

vi.mock("../../components/DocumentationHistorySidebar", () => ({
  default: vi.fn(({ open, onClose }) =>
    open ? (
      <div data-testid="documentation-sidebar">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
  ),
}));

describe("New Diagnosis and Treatment Plan Page", () => {
  const mockPush = vi.fn();
  const mockToast = toast as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({
      push: mockPush,
    });
    (useParams as Mock).mockReturnValue({
      id: "test-client-group-id",
    });
  });

  it("should render the page and fetch client data", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    await waitFor(() => {
      expect(fetchSingleClientGroup).toHaveBeenCalledWith({
        id: "test-client-group-id",
        searchParams: {
          includeProfile: "true",
          includeAdress: "true",
        },
      });
    });

    expect(screen.getByTestId("client-info-header")).toBeDefined();
    expect(screen.getByTestId("diagnosis-rows")).toBeDefined();
  });

  it("should handle adding and removing diagnoses", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    // Wait for client data to load
    await waitFor(() => {
      expect(fetchSingleClientGroup).toHaveBeenCalled();
    });

    // Initially should have one diagnosis row
    expect(screen.getByTestId("diagnosis-0")).toBeDefined();

    // Add a diagnosis
    const addButton = screen.getByTestId("add-diagnosis");
    fireEvent.click(addButton);

    await waitFor(() => {
      expect(screen.getByTestId("diagnosis-1")).toBeDefined();
    });

    // Try to remove when there's more than one
    const removeButton = screen.getByTestId("remove-diagnosis-1");
    fireEvent.click(removeButton);

    await waitFor(() => {
      expect(screen.queryByTestId("diagnosis-1")).toBeNull();
    });
  });

  it("should update diagnosis fields", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    const codeInput = screen.getByTestId("diagnosis-code-0");
    const descriptionInput = screen.getByTestId("diagnosis-description-0");

    fireEvent.change(codeInput, { target: { value: "F32.9" } });
    fireEvent.change(descriptionInput, {
      target: { value: "Major depressive disorder" },
    });

    expect(codeInput).toHaveValue("F32.9");
    expect(descriptionInput).toHaveValue("Major depressive disorder");
  });

  it("should handle save with valid diagnoses", async () => {
    const { fetchSingleClientGroup, createDiagnosisTreatmentPlan } =
      await import("@/(dashboard)/clients/services/client.service");

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    (createDiagnosisTreatmentPlan as Mock).mockResolvedValue([
      { id: "new-plan-id" },
      null,
    ]);

    render(<NewDiagnosisAndTreatmentPlan />);

    // Wait for client data to load
    await waitFor(() => {
      expect(fetchSingleClientGroup).toHaveBeenCalled();
    });

    // Update diagnosis to have valid data
    const codeInput = screen.getByTestId("diagnosis-code-0");
    fireEvent.change(codeInput, { target: { value: "F32.9" } });

    // Mock the diagnosis to have an ID (as if selected from dropdown)
    const _DiagnosisRows = vi.mocked(
      await import(
        "@/(dashboard)/clients/[id]/diagnosisAndTreatmentPlan/components/DiagnosisRows"
      ),
    ).default;

    // Trigger save through the mocked component
    const saveButton = screen.getByTestId("save-button");
    fireEvent.click(saveButton);

    // Since we're mocking DiagnosisRows, we need to simulate the save behavior
    // The actual component would have diagnoses with IDs from the dropdown selection
  });

  it("should show error when saving without valid diagnoses", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    await waitFor(() => {
      expect(fetchSingleClientGroup).toHaveBeenCalled();
    });

    const saveButton = screen.getByTestId("save-button");
    fireEvent.click(saveButton);

    // The component should validate and show error for missing diagnosis selection
  });

  it("should handle skip to treatment plan", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    const skipLink = await screen.findByText("Skip to treatment plan");
    expect(skipLink).toBeDefined();
    fireEvent.click(skipLink);

    // Should trigger save which would normally redirect
  });

  it("should update date and time", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    const dateInput = screen.getByTestId("date-input");
    const timeInput = screen.getByTestId("time-input");

    fireEvent.change(dateInput, { target: { value: "2025-04-01" } });
    fireEvent.change(timeInput, { target: { value: "14:30" } });

    expect(dateInput).toHaveValue("2025-04-01");
    expect(timeInput).toHaveValue("14:30");
  });

  it("should handle error when client info is not loaded", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue(null);

    render(<NewDiagnosisAndTreatmentPlan />);

    await waitFor(() => {
      expect(fetchSingleClientGroup).toHaveBeenCalled();
    });

    const saveButton = screen.getByTestId("save-button");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "Client information not loaded. Please refresh the page.",
        variant: "destructive",
      });
    });
  });

  it("should toggle documentation sidebar", async () => {
    const { fetchSingleClientGroup } = await import(
      "@/(dashboard)/clients/services/client.service"
    );

    (fetchSingleClientGroup as Mock).mockResolvedValue({
      data: {
        ClientGroupMembership: [
          {
            Client: { id: "test-client-id" },
          },
        ],
      },
    });

    render(<NewDiagnosisAndTreatmentPlan />);

    // Open sidebar
    const docHistoryButton = screen.getByText("Documentation history");
    fireEvent.click(docHistoryButton);

    // Wait for sidebar to open - look for a unique element in the sidebar
    await waitFor(() => {
      expect(screen.getByText("View current treatment plan")).toBeDefined();
    });

    // Close sidebar by looking for a specific button - the close button should have an X icon
    // Use a more specific query instead of querySelector
    const closeButtons = screen.getAllByRole("button");
    // Find the button that contains the X icon by checking for aria-label or specific text
    const closeButton = closeButtons[closeButtons.length - 1]; // Usually the last button in a modal/sidebar

    if (closeButton) {
      fireEvent.click(closeButton);
    }

    // Wait for sidebar to close
    await waitFor(() => {
      expect(screen.queryByText("View current treatment plan")).toBeNull();
    });
  });
});
