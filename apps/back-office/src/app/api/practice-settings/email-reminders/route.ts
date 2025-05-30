import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// Email reminder settings key in PracticeSettings table
const EMAIL_REMINDERS_KEY = "reminder_emails_enabled";

/**
 * GET handler for retrieving email reminder settings
 */
export async function GET() {
  try {
    logger.info("Fetching email reminder settings");

    const setting = await prisma.practiceSettings.findFirst({
      where: { key: EMAIL_REMINDERS_KEY },
    });

    // Default to enabled if setting doesn't exist
    const isReminderEmailsEnabled = setting ? setting.value === "true" : true;

    logger.info(
      { isReminderEmailsEnabled },
      "Successfully fetched email reminder settings",
    );
    return NextResponse.json({ isReminderEmailsEnabled });
  } catch (error) {
    logger.error({ error }, "Failed to fetch email reminder settings");

    return NextResponse.json(
      { error: "Failed to fetch email reminder settings" },
      { status: 500 },
    );
  }
}

/**
 * PUT handler for updating email reminder settings
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (typeof body.isReminderEmailsEnabled !== "boolean") {
      return NextResponse.json(
        { error: "isReminderEmailsEnabled must be a boolean value" },
        { status: 400 },
      );
    }

    logger.info(
      { isReminderEmailsEnabled: body.isReminderEmailsEnabled },
      "Updating email reminder settings",
    );

    // Convert boolean to string for storage
    const valueToStore = String(body.isReminderEmailsEnabled);

    // Get existing setting if it exists
    const existingSetting = await prisma.practiceSettings.findFirst({
      where: { key: EMAIL_REMINDERS_KEY },
    });

    let updatedSetting;

    if (existingSetting) {
      // Update existing setting
      updatedSetting = await prisma.practiceSettings.update({
        where: { id: existingSetting.id },
        data: { value: valueToStore },
      });
    } else {
      // Create new setting
      updatedSetting = await prisma.practiceSettings.create({
        data: {
          id: crypto.randomUUID(),
          key: EMAIL_REMINDERS_KEY,
          value: valueToStore,
        },
      });
    }

    logger.info(
      {
        key: updatedSetting.key,
        value: updatedSetting.value,
      },
      "Successfully updated email reminder settings",
    );

    return NextResponse.json({
      isReminderEmailsEnabled: updatedSetting.value === "true",
      message: "Email reminder settings updated successfully",
    });
  } catch (error) {
    logger.error({ error }, "Failed to update email reminder settings");

    return NextResponse.json(
      { error: "Failed to update email reminder settings" },
      { status: 500 },
    );
  }
}
