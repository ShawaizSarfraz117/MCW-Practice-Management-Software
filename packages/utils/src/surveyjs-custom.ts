let widgetsInitialized = false;
export async function initializeCustomWidgets(): Promise<void> {
  if (widgetsInitialized) {
    return;
  }

  if (typeof window !== "undefined") {
    try {
      const ui = await import("@mcw/ui");
      if (ui.registerCustomWidgets) {
        ui.registerCustomWidgets();
        widgetsInitialized = true;
      }
    } catch (error) {
      console.error("Failed to initialize custom widgets:", error);
    }
  }
}
