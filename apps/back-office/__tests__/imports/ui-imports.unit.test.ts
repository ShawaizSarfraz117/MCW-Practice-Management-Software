import { describe, it, expect } from "vitest";

/**
 * Import validation tests
 * These tests verify all required UI components can be imported
 * Would have caught missing FormMessage, Select components
 */
describe("UI Component Imports", () => {
  it("should import all required form components from @mcw/ui", async () => {
    const {
      Input,
      FormControl,
      FormItem,
      FormLabel,
      FormMessage,
      Select,
      SelectContent,
      SelectItem,
      SelectTrigger,
      SelectValue,
    } = await import("@mcw/ui");

    // These assertions would fail if imports are missing
    expect(Input).toBeDefined();
    expect(FormControl).toBeDefined();
    expect(FormItem).toBeDefined();
    expect(FormLabel).toBeDefined();
    expect(FormMessage).toBeDefined();
    expect(Select).toBeDefined();
    expect(SelectContent).toBeDefined();
    expect(SelectItem).toBeDefined();
    expect(SelectTrigger).toBeDefined();
    expect(SelectValue).toBeDefined();
  });

  it("should import validators from centralized module", async () => {
    const { validators } = await import(
      "@/(dashboard)/settings/team-members/components/shared/validators"
    );

    expect(validators).toBeDefined();
    expect(validators.required).toBeDefined();
    expect(validators.email).toBeDefined();
    expect(validators.npi).toBeDefined();
  });

  it("should import StateSelector component", async () => {
    const { StateSelector } = await import(
      "@/(dashboard)/settings/team-members/components/shared/StateSelector"
    );

    expect(StateSelector).toBeDefined();
  });
});
