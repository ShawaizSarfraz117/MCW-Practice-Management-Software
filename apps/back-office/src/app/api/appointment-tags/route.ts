import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { withErrorHandling } from "@mcw/utils";
import {
  updatePaymentStatusTag,
  updateNoteStatusTag,
} from "@/utils/appointment-helpers";

// GET - Retrieve all tags or appointment tags
export const GET = withErrorHandling(async (request: NextRequest) => {
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
});

// POST - Add a tag to an appointment
export const POST = withErrorHandling(async (request: NextRequest) => {
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
});

// PUT - Update appointment tags (replace existing tags)
export const PUT = withErrorHandling(async (request: NextRequest) => {
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
});

// DELETE - Remove a tag from an appointment
export const DELETE = withErrorHandling(async (request: NextRequest) => {
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
});

// Export the helper functions from appointment-helpers for backward compatibility
export { updatePaymentStatusTag, updateNoteStatusTag };
