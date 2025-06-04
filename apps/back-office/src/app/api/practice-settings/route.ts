import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { getBackOfficeSession } from "@/utils/helpers";
import { z } from "zod";
import { logger } from "@mcw/logger";

type PracticeSettingValue = string | number | boolean | object;
const practiceSettingsPayload = z.record(z.string(), z.any()).refine(
  (data) => {
    // Check that all keys are non-empty strings
    const hasEmptyKeys = Object.keys(data).some((key) => key.trim() === "");
    if (hasEmptyKeys) return false;

    // Check that no values are null or undefined
    const hasNullValues = Object.values(data).some(
      (value) => value === null || value === undefined,
    );
    if (hasNullValues) return false;

    return true;
  },
  {
    message:
      "Keys must be non-empty strings and values cannot be null or undefined",
  },
);

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const keys = searchParams.get("keys");

    let whereClause = {};
    if (keys) {
      // Filter by specific keys if provided
      const keyArray = keys.split(",");
      whereClause = {
        key: {
          in: keyArray,
        },
      };
    }

    // Fetch practice settings
    const settings = await prisma.practiceSettings.findMany({
      where: whereClause,
    });

    // Convert to object format
    const settingsObject = settings.reduce(
      (acc, setting) => {
        // Try to parse JSON values, fallback to string
        let value: PracticeSettingValue = setting.value;
        try {
          value = JSON.parse(setting.value);
        } catch {
          // If not valid JSON, keep as string
          if (setting.value === "true") value = true;
          else if (setting.value === "false") value = false;
        }

        acc[setting.key] = value;
        return acc;
      },
      {} as Record<string, PracticeSettingValue>,
    );

    return NextResponse.json(settingsObject);
  } catch (error) {
    logger.error(error as Error, "Error fetching practice settings");
    return NextResponse.json(
      { error: "Failed to fetch practice settings" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await request.json();
    logger.info({ data }, "Received practice settings data");

    // Validate request body
    const validationResult = practiceSettingsPayload.safeParse(data);
    if (!validationResult.success) {
      logger.warn(
        { error: validationResult.error },
        "Practice settings validation failed",
      );
      return NextResponse.json(
        {
          error: "Invalid request payload",
          details: validationResult.error.message,
        },
        { status: 422 },
      );
    }

    logger.info(
      { data: validationResult.data },
      "Practice settings validation passed",
    );

    // Update or create the settings
    const updateOrCreateSetting = async (
      key: string,
      value: PracticeSettingValue,
    ) => {
      logger.debug(
        { key, value, type: typeof value },
        "Processing practice setting",
      );

      const existing = await prisma.practiceSettings.findFirst({
        where: { key },
      });

      // Convert value to string for storage
      let stringValue: string;
      if (typeof value === "object") {
        stringValue = JSON.stringify(value);
        logger.debug(
          { key, stringValue },
          "Converted object to string for storage",
        );
      } else {
        stringValue = String(value);
        logger.debug(
          { key, type: typeof value, stringValue },
          "Converted value to string for storage",
        );
      }

      if (existing) {
        return prisma.practiceSettings.update({
          where: { id: existing.id },
          data: { value: stringValue },
        });
      } else {
        return prisma.practiceSettings.create({
          data: {
            id: crypto.randomUUID(),
            key,
            value: stringValue,
          },
        });
      }
    };

    // Process all settings in the request
    const updatePromises = Object.entries(validationResult.data).map(
      ([key, value]) => updateOrCreateSetting(key, value),
    );

    await Promise.all(updatePromises);

    return NextResponse.json({
      success: true,
      updated: Object.keys(validationResult.data),
    });
  } catch (error) {
    logger.error(error as Error, "Error updating practice settings");
    return NextResponse.json(
      { error: "Failed to update practice settings" },
      { status: 500 },
    );
  }
}
