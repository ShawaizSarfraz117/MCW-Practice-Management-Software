/* eslint-disable no-restricted-imports */
// API routes are allowed to import from @mcw/database
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@mcw/database";
import { logger } from "@mcw/logger";
import { getBackOfficeSession } from "@/utils/helpers";

// GET - Retrieve all clinicians or a specific clinician by ID
export async function GET(request: NextRequest) {
  try {
    const session = await getBackOfficeSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    const details = searchParams.get("details");

    if (details === "true" && userId) {
      logger.info("Retrieving clinician details");

      const clinician = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          UserRole: {
            include: {
              Role: true,
            },
          },
          clinicalInfos: true,
          Clinician: {
            include: {
              ClinicianServices: {
                include: {
                  PracticeService: true,
                },
              },
              License: true,
            },
          },
        },
      });

      return NextResponse.json(clinician);
    } else if (id) {
      logger.info("Retrieving specific clinician by ID");
      // Retrieve specific clinician
      const clinician = await prisma.clinician.findUnique({
        where: { id },
        include: {
          User: {
            select: {
              email: true,
            },
          },
          ClinicianLocation: {
            include: {
              Location: true,
            },
          },
          ClinicianServices: {
            include: {
              PracticeService: true,
            },
          },
          ClinicianClient: {
            include: {
              Client: {
                select: {
                  id: true,
                  legal_first_name: true,
                  legal_last_name: true,
                  preferred_name: true,
                  is_active: true,
                },
              },
            },
          },
        },
      });

      if (!clinician) {
        return NextResponse.json(
          { error: "Clinician not found" },
          { status: 404 },
        );
      }

      return NextResponse.json(clinician);
    } else if (userId) {
      logger.info(`Retrieving clinician by user ID: ${userId}`);

      // Retrieve clinician by user_id
      const clinician = await prisma.clinician.findUnique({
        where: { user_id: userId },
        include: {
          User: {
            select: {
              email: true,
            },
          },
        },
      });

      if (!clinician) {
        return NextResponse.json(
          { error: "Clinician not found for this user" },
          { status: 404 },
        );
      }

      return NextResponse.json(clinician);
    } else {
      logger.info("Retrieving all clinicians");
      // List all clinicians
      const clinicians = await prisma.clinician.findMany({
        include: {
          User: {
            select: {
              email: true,
            },
          },
        },
      });

      return NextResponse.json(clinicians);
    }
  } catch (error) {
    console.error("Error fetching clinicians:", error);
    return NextResponse.json(
      { error: "Failed to fetch clinicians" },
      { status: 500 },
    );
  }
}

// POST - Create a new clinician
export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.user_id || !data.first_name || !data.last_name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Check if user_id already exists in clinician table
    const existingClinician = await prisma.clinician.findUnique({
      where: { user_id: data.user_id },
    });

    if (existingClinician) {
      return NextResponse.json(
        { error: "A clinician with this user ID already exists" },
        { status: 400 },
      );
    }

    // Create new clinician
    const newClinician = await prisma.clinician.create({
      data: {
        user_id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address || "no address found",
        percentage_split: data.percentage_split || 0,
        is_active: data.is_active ?? true,
      },
    });

    return NextResponse.json(newClinician, { status: 201 });
  } catch (error) {
    console.error("Error creating clinician:", error);
    return NextResponse.json(
      { error: "Failed to create clinician" },
      { status: 500 },
    );
  }
}

// PUT - Update an existing clinician
export async function PUT(request: NextRequest) {
  try {
    const data = await request.json();

    if (!data.id) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    await prisma.user.update({
      where: { id: data.user_id },
      data: {
        email: data.email,
      },
    });

    // Update clinician
    const updatedClinician = await prisma.clinician.upsert({
      where: { user_id: data.user_id },
      update: {
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address,
        percentage_split: data.percentage_split,
        is_active: data.is_active,
      },
      create: {
        user_id: data.user_id,
        first_name: data.first_name,
        last_name: data.last_name,
        address: data.address || "no address found",
        percentage_split: data.percentage_split || 0,
        is_active: data.is_active || true,
      },
    });

    return NextResponse.json(updatedClinician);
  } catch (error) {
    console.error("Error updating clinician:", error);
    return NextResponse.json(
      { error: "Failed to update clinician" },
      { status: 500 },
    );
  }
}

// DELETE - Remove a clinician
export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Clinician ID is required" },
        { status: 400 },
      );
    }

    // Check if clinician exists
    const existingClinician = await prisma.clinician.findUnique({
      where: { id },
    });

    if (!existingClinician) {
      return NextResponse.json(
        { error: "Clinician not found" },
        { status: 404 },
      );
    }

    // Instead of deleting, you might want to set is_active to false
    // to maintain data integrity if there are related records
    const deactivatedClinician = await prisma.clinician.update({
      where: { id },
      data: { is_active: false },
    });

    // If you really want to delete:
    // await prisma.clinician.delete({
    //   where: { id }
    // });

    return NextResponse.json({
      message: "Clinician deactivated successfully",
      clinician: deactivatedClinician,
    });
  } catch (error) {
    console.error("Error deactivating clinician:", error);
    return NextResponse.json(
      { error: "Failed to deactivate clinician" },
      { status: 500 },
    );
  }
}
