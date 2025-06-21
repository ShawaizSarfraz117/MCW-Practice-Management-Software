import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { withErrorHandling } from "@mcw/utils";
import { clientCareSettingsService } from "@/utils/client-care-settings.service";
import { backofficeAuthOptions } from "../auth/[...nextauth]/auth-options";

/**
 * GET /api/client-care-settings
 * Retrieve all or specific category settings for client care
 *
 * Query params:
 * - category: "portal" | "widget" | "calendar" | "contactForm" (optional)
 * - clinician_id: UUID (optional, defaults to current user)
 *
 * Note: Portal settings are per-clinician, while calendar, widget, and contact form
 * settings are practice-wide (clinician_id is ignored for these categories)
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(backofficeAuthOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const clinicianId = searchParams.get("clinician_id") || session.user.id;
  const category = searchParams.get("category") as
    | "portal"
    | "widget"
    | "calendar"
    | "contactForm"
    | "demographicsForm"
    | "documentFormat"
    | null;

  try {
    let data;

    if (category) {
      // Validate category
      const validCategories = [
        "portal",
        "widget",
        "calendar",
        "contactForm",
        "demographicsForm",
        "documentFormat",
      ];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          {
            error:
              "Invalid category. Must be one of: portal, widget, calendar, contactForm, demographicsForm, documentFormat",
          },
          { status: 400 },
        );
      }

      data = await clientCareSettingsService.getCategorySettings(
        clinicianId,
        category,
      );
    } else {
      // Get all settings
      data = await clientCareSettingsService.getAllSettings(clinicianId);
    }

    return NextResponse.json({
      message: "Client care settings retrieved successfully",
      data,
    });
  } catch (error) {
    console.error("Error fetching client care settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 },
    );
  }
});

/**
 * PUT /api/client-care-settings
 * Update settings for a specific category
 *
 * Body:
 * - category: "portal" | "widget" | "calendar" | "contactForm"
 * - settings: Partial settings object for the category
 *
 * Note: Portal settings are per-clinician, while calendar, widget, and contact form
 * settings are practice-wide (affecting all clinicians)
 */
export const PUT = withErrorHandling(async (request: NextRequest) => {
  const session = await getServerSession(backofficeAuthOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clinicianId = session.user.id;
  const body = await request.json();
  const { category, settings } = body;

  if (!category) {
    return NextResponse.json(
      { error: "Category is required" },
      { status: 400 },
    );
  }

  // Validate category
  const validCategories = [
    "portal",
    "widget",
    "calendar",
    "contactForm",
    "demographicsForm",
    "documentFormat",
  ];
  if (!validCategories.includes(category)) {
    return NextResponse.json(
      {
        error:
          "Invalid category. Must be one of: portal, widget, calendar, contactForm, demographicsForm, documentFormat",
      },
      { status: 400 },
    );
  }

  try {
    const updatedSettings =
      await clientCareSettingsService.updateCategorySettings(
        clinicianId,
        category,
        settings,
      );

    return NextResponse.json({
      message: "Client care settings updated successfully",
      data: updatedSettings,
    });
  } catch (error) {
    console.error("Error updating client care settings:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update settings",
      },
      { status: 400 },
    );
  }
});
