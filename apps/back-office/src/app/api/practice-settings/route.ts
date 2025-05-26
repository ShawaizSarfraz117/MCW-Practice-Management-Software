import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

/**
 * GET - Retrieve all practice settings
 * @param request - The NextRequest object
 * @returns - JSON response with practice settings data or error
 */
export async function GET(_request: NextRequest) {
  try {
    const settings = await prisma.practiceSettings.findMany();

    // Convert array of settings to an object for easier consumption
    const settingsObject = settings.reduce(
      (acc, setting) => {
        acc[setting.key] = setting.value;
        return acc;
      },
      {} as Record<string, string>,
    );

    return NextResponse.json(settingsObject);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to fetch practice settings: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to fetch practice settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT - Update practice settings
 * @param request - The NextRequest object
 * @returns - JSON response with updated practice settings data or error
 */
export async function PUT(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Validate request data structure (key-value pairs)
    if (typeof requestData !== "object" || requestData === null) {
      return NextResponse.json(
        {
          error: "Invalid input",
          details: "Request body must be an object with key-value pairs",
        },
        { status: 400 },
      );
    }

    // Process each setting
    const results = [];

    for (const [key, value] of Object.entries(requestData)) {
      if (typeof value !== "string") {
        return NextResponse.json(
          {
            error: "Invalid input",
            details: `Value for key '${key}' must be a string`,
          },
          { status: 400 },
        );
      }

      // Check if the setting already exists
      const existingSetting = await prisma.practiceSettings.findFirst({
        where: { key },
      });

      if (existingSetting) {
        // Update existing setting
        const updatedSetting = await prisma.practiceSettings.update({
          where: { id: existingSetting.id },
          data: { value },
        });
        results.push(updatedSetting);
      } else {
        // Create new setting
        const newSetting = await prisma.practiceSettings.create({
          data: {
            id: crypto.randomUUID(),
            key,
            value,
          },
        });
        results.push(newSetting);
      }
    }

    return NextResponse.json({
      message: "Practice settings updated successfully",
      settings: results,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`Failed to update practice settings: ${errorMessage}`);
    return NextResponse.json(
      { error: "Failed to update practice settings" },
      { status: 500 },
    );
  }
}
