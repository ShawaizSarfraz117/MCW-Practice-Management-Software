import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";

// GET - Retrieve all tags or appointment tags
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get("appointmentId");

    if (appointmentId) {
      // Get tags for a specific appointment
      const appointmentTags = await prisma.appointmentTag.findMany({
        where: { appointment_id: appointmentId },
        include: {
          Tag: true,
        },
      });

      return NextResponse.json(appointmentTags);
    } else {
      // Get all available tags
      const tags = await prisma.tag.findMany({
        orderBy: { name: "asc" },
      });

      return NextResponse.json(tags);
    }
  } catch (error) {
    logger.error(`Error fetching tags: ${error}`);
    return NextResponse.json(
      { error: "Failed to fetch tags" },
      { status: 500 },
    );
  }
}

// POST - Add a tag to an appointment
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { appointmentId, tagId } = data;

    if (!appointmentId || !tagId) {
      return NextResponse.json(
        { error: "appointmentId and tagId are required" },
        { status: 400 },
      );
    }

    // Check if the tag is already assigned
    const existingTag = await prisma.appointmentTag.findFirst({
      where: {
        appointment_id: appointmentId,
        tag_id: tagId,
      },
    });

    if (existingTag) {
      return NextResponse.json(
        { error: "Tag already assigned to this appointment" },
        { status: 400 },
      );
    }

    // Create the appointment tag
    const appointmentTag = await prisma.appointmentTag.create({
      data: {
        appointment_id: appointmentId,
        tag_id: tagId,
      },
      include: {
        Tag: true,
      },
    });

    return NextResponse.json(appointmentTag, { status: 201 });
  } catch (error) {
    logger.error(`Error adding tag to appointment: ${error}`);
    return NextResponse.json({ error: "Failed to add tag" }, { status: 500 });
  }
}

// PUT - Update appointment tags (replace existing tags)
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();
    const { appointmentId, tagIds } = data;

    if (!appointmentId || !Array.isArray(tagIds)) {
      return NextResponse.json(
        { error: "appointmentId and tagIds array are required" },
        { status: 400 },
      );
    }

    // Delete existing tags for the appointment
    await prisma.appointmentTag.deleteMany({
      where: { appointment_id: appointmentId },
    });

    // Create new tags
    await prisma.appointmentTag.createMany({
      data: tagIds.map((tagId) => ({
        appointment_id: appointmentId,
        tag_id: tagId,
      })),
    });

    // Return the updated tags
    const updatedTags = await prisma.appointmentTag.findMany({
      where: { appointment_id: appointmentId },
      include: {
        Tag: true,
      },
    });

    return NextResponse.json(updatedTags);
  } catch (error) {
    logger.error(`Error updating appointment tags: ${error}`);
    return NextResponse.json(
      { error: "Failed to update tags" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a tag from an appointment
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const appointmentId = searchParams.get("appointmentId");
    const tagId = searchParams.get("tagId");

    if (!appointmentId || !tagId) {
      return NextResponse.json(
        { error: "appointmentId and tagId are required" },
        { status: 400 },
      );
    }

    // Find the appointment tag first
    const appointmentTag = await prisma.appointmentTag.findFirst({
      where: {
        appointment_id: appointmentId,
        tag_id: tagId,
      },
    });

    if (!appointmentTag) {
      return NextResponse.json(
        { error: "Tag not found for this appointment" },
        { status: 404 },
      );
    }

    await prisma.appointmentTag.delete({
      where: {
        id: appointmentTag.id,
      },
    });

    return NextResponse.json({ message: "Tag removed successfully" });
  } catch (error) {
    logger.error(`Error removing tag from appointment: ${error}`);
    return NextResponse.json(
      { error: "Failed to remove tag" },
      { status: 500 },
    );
  }
}

export async function updatePaymentStatusTag(
  appointmentId: string,
  isPaid: boolean,
) {
  try {
    const tags = await prisma.tag.findMany();
    const paidTag = tags.find((t) => t.name === "Appointment Paid");
    const unpaidTag = tags.find((t) => t.name === "Appointment Unpaid");

    if (!paidTag || !unpaidTag) {
      logger.error("Payment status tags not found");
      return;
    }

    // Remove existing payment status tags
    await prisma.appointmentTag.deleteMany({
      where: {
        appointment_id: appointmentId,
        tag_id: { in: [paidTag.id, unpaidTag.id] },
      },
    });

    // Add the appropriate tag
    await prisma.appointmentTag.create({
      data: {
        appointment_id: appointmentId,
        tag_id: isPaid ? paidTag.id : unpaidTag.id,
      },
    });
  } catch (error) {
    logger.error(`Error updating payment status tag: ${error}`);
  }
}

// Helper function to update note status tag
export async function updateNoteStatusTag(
  appointmentId: string,
  hasNote: boolean,
) {
  try {
    const tags = await prisma.tag.findMany();
    const noteAddedTag = tags.find((t) => t.name === "Note Added");
    const noNoteTag = tags.find((t) => t.name === "No Note");

    if (!noteAddedTag || !noNoteTag) {
      logger.error("Note status tags not found");
      return;
    }

    // Remove existing note status tags
    await prisma.appointmentTag.deleteMany({
      where: {
        appointment_id: appointmentId,
        tag_id: { in: [noteAddedTag.id, noNoteTag.id] },
      },
    });

    // Add the appropriate tag
    await prisma.appointmentTag.create({
      data: {
        appointment_id: appointmentId,
        tag_id: hasNote ? noteAddedTag.id : noNoteTag.id,
      },
    });
  } catch (error) {
    logger.error(`Error updating note status tag: ${error}`);
  }
}
